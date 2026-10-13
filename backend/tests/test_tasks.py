import json

def test_task_creation_by_pm(client, auth_headers):
    res = client.post("/api/tasks", headers=auth_headers["pm"], json={
        "title": "Build Auth Middleware",
        "description": "JWT parsing and RBAC verification",
        "priority": "high",
        "assigned_to_id": auth_headers["dev_id"],
        "estimated_hours": 8.0,
        "due_date": "2026-12-31T23:59:59Z"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "task_id" in data
    assert data["message"] == "Task created successfully"

def test_task_creation_forbidden_for_team_member(client, auth_headers):
    res = client.post("/api/tasks", headers=auth_headers["dev"], json={
        "title": "Unauthorized Task",
        "priority": "low"
    })
    assert res.status_code == 403

def test_task_status_transition_and_timestamps(client, auth_headers):
    # 1. PM creates task
    res = client.post("/api/tasks", headers=auth_headers["pm"], json={
        "title": "State Transition Test",
        "priority": "medium",
        "assigned_to_id": auth_headers["dev_id"]
    })
    task_id = res.get_json()["task_id"]

    # 2. Dev transitions task to in_progress
    res = client.put(f"/api/tasks/{task_id}/status", headers=auth_headers["dev"], json={
        "status": "in_progress",
        "comment": "Started working on feature"
    })
    assert res.status_code == 200

    # Verify started_at is populated
    res = client.get(f"/api/tasks/{task_id}", headers=auth_headers["dev"])
    task = res.get_json()["task"]
    assert task["status"] == "in_progress"
    assert task["started_at"] is not None
    assert len(task["history"]) >= 2

    # 3. Dev transitions task to completed
    res = client.put(f"/api/tasks/{task_id}/status", headers=auth_headers["dev"], json={
        "status": "completed",
        "actual_hours": 5.5,
        "comment": "Completed and reviewed"
    })
    assert res.status_code == 200

    # Verify completed_at is populated
    res = client.get(f"/api/tasks/{task_id}", headers=auth_headers["dev"])
    task = res.get_json()["task"]
    assert task["status"] == "completed"
    assert task["completed_at"] is not None
    assert task["actual_hours"] == 5.5

def test_reopen_completed_task_rework(client, auth_headers):
    # Create, progress, complete, then reopen
    res = client.post("/api/tasks", headers=auth_headers["pm"], json={
        "title": "Rework Lifecycle Test",
        "priority": "critical",
        "assigned_to_id": auth_headers["dev_id"]
    })
    task_id = res.get_json()["task_id"]

    client.put(f"/api/tasks/{task_id}/status", headers=auth_headers["dev"], json={"status": "in_progress"})
    client.put(f"/api/tasks/{task_id}/status", headers=auth_headers["dev"], json={"status": "completed"})

    # Reopen to in_progress
    res = client.put(f"/api/tasks/{task_id}/status", headers=auth_headers["pm"], json={
        "status": "in_progress",
        "comment": "Reopening due to QA regression"
    })
    assert res.status_code == 200

    res = client.get(f"/api/tasks/{task_id}", headers=auth_headers["pm"])
    task = res.get_json()["task"]
    assert task["status"] == "in_progress"

    # Verify history recorded the reopening transition
    transitions = [(h["old_status"], h["new_status"]) for h in task["history"]]
    assert ("completed", "in_progress") in transitions

def test_delete_task_soft_delete(client, auth_headers):
    res = client.post("/api/tasks", headers=auth_headers["pm"], json={
        "title": "Task to Delete",
        "priority": "low"
    })
    task_id = res.get_json()["task_id"]

    # Delete task
    del_res = client.delete(f"/api/tasks/{task_id}", headers=auth_headers["pm"])
    assert del_res.status_code == 200

    # Verify not returned in active list
    list_res = client.get("/api/tasks", headers=auth_headers["pm"])
    tasks = list_res.get_json()["tasks"]
    assert not any(t["id"] == task_id for t in tasks)

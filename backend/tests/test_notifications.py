def test_notification_flow(client, auth_headers):
    # 1. PM creates task assigned to Dev -> Dev receives assignment notification
    res = client.post("/api/tasks", headers=auth_headers["pm"], json={
        "title": "Alert Trigger Test",
        "priority": "high",
        "assigned_to_id": auth_headers["dev_id"]
    })
    assert res.status_code == 201

    # Dev checks notifications
    notif_res = client.get("/api/notifications", headers=auth_headers["dev"])
    assert notif_res.status_code == 200
    data = notif_res.get_json()
    assert data["unread_count"] >= 1
    assert any(n["type"] == "assignment" for n in data["notifications"])

    # Mark as read
    first_notif = data["notifications"][0]
    read_res = client.put(f"/api/notifications/{first_notif['id']}/read", headers=auth_headers["dev"])
    assert read_res.status_code == 200

    # Mark all read
    all_read_res = client.put("/api/notifications/read-all", headers=auth_headers["dev"])
    assert all_read_res.status_code == 200

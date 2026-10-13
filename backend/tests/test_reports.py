def test_report_summary_and_csv_export(client, auth_headers):
    # Create task
    client.post("/api/tasks", headers=auth_headers["pm"], json={
        "title": "Exportable Task for Report",
        "description": "Comma, \"quotes\", and newlines in description\nSecond line",
        "priority": "critical",
        "assigned_to_id": auth_headers["dev_id"],
        "estimated_hours": 10.0
    })

    # Summary
    sum_res = client.get("/api/reports/summary", headers=auth_headers["pm"])
    assert sum_res.status_code == 200
    summary = sum_res.get_json()["summary"]
    assert summary["total_tasks"] >= 1

    # CSV Export
    csv_res = client.get("/api/reports/export-csv", headers=auth_headers["pm"])
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.content_type
    csv_text = csv_res.data.decode("utf-8")
    assert "Task ID,Title,Description,Assignee" in csv_text
    assert "Exportable Task for Report" in csv_text

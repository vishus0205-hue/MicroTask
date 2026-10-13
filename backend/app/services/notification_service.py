from datetime import datetime, timezone, timedelta

def create_notification(db_conn, user_id, title, message, notif_type, link=None):
    if not user_id:
        return None
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor = db_conn.cursor()
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, 0, ?, ?)
    """, (user_id, title, message, notif_type, link, now_iso))
    db_conn.commit()
    return cursor.lastrowid

def check_and_generate_deadline_notifications(db_conn):
    """
    Checks upcoming and overdue deadlines, creating notifications for assigned users
    without generating duplicates.
    """
    now = datetime.now(timezone.utc)
    soon = now + timedelta(hours=24)
    now_iso = now.isoformat()
    soon_iso = soon.isoformat()

    # 1. Overdue tasks
    overdue_query = """
        SELECT t.id, t.title, t.assigned_to_id, t.due_date
        FROM tasks t
        WHERE t.is_deleted = 0
          AND t.status IN ('todo', 'in_progress')
          AND t.assigned_to_id IS NOT NULL
          AND t.due_date IS NOT NULL
          AND t.due_date < ?
    """
    tasks_overdue = db_conn.execute(overdue_query, (now_iso,)).fetchall()
    for t in tasks_overdue:
        # Check if overdue notification was already created today for this task and user
        today_prefix = now.strftime("%Y-%m-%d")
        existing = db_conn.execute("""
            SELECT id FROM notifications
            WHERE user_id = ? AND type = 'overdue' AND link = ? AND created_at LIKE ?
        """, (t["assigned_to_id"], f"/tasks/{t['id']}", f"{today_prefix}%")).fetchone()
        if not existing:
            create_notification(
                db_conn,
                user_id=t["assigned_to_id"],
                title="Task Overdue",
                message=f"Task '{t['title']}' is overdue. Deadline was {t['due_date']}.",
                notif_type="overdue",
                link=f"/tasks/{t['id']}"
            )

    # 2. Approaching deadlines (due within 24 hours, not yet overdue)
    approaching_query = """
        SELECT t.id, t.title, t.assigned_to_id, t.due_date
        FROM tasks t
        WHERE t.is_deleted = 0
          AND t.status IN ('todo', 'in_progress')
          AND t.assigned_to_id IS NOT NULL
          AND t.due_date IS NOT NULL
          AND t.due_date >= ?
          AND t.due_date <= ?
    """
    tasks_approaching = db_conn.execute(approaching_query, (now_iso, soon_iso)).fetchall()
    for t in tasks_approaching:
        today_prefix = now.strftime("%Y-%m-%d")
        existing = db_conn.execute("""
            SELECT id FROM notifications
            WHERE user_id = ? AND type = 'deadline' AND link = ? AND created_at LIKE ?
        """, (t["assigned_to_id"], f"/tasks/{t['id']}", f"{today_prefix}%")).fetchone()
        if not existing:
            create_notification(
                db_conn,
                user_id=t["assigned_to_id"],
                title="Approaching Deadline",
                message=f"Task '{t['title']}' is due within 24 hours ({t['due_date']}).",
                notif_type="deadline",
                link=f"/tasks/{t['id']}"
            )

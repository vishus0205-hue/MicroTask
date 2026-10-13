import os
import sys

# Ensure backend root is on sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

import sqlite3
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash

def seed_database(conn):
    cursor = conn.cursor()

    # Clear existing data in reverse dependency order
    cursor.execute("DELETE FROM notifications")
    cursor.execute("DELETE FROM defects")
    cursor.execute("DELETE FROM task_status_history")
    cursor.execute("DELETE FROM tasks")
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM project_settings")

    now = datetime.now(timezone.utc)
    demo_password_hash = generate_password_hash("Demo@12345", method="scrypt")

    # 1. Insert Users
    users_data = [
        ("admin", "admin@microtask.local", demo_password_hash, "Dr. Sarah Jenkins (Lead Architect)", "admin"),
        ("pm_alex", "alex.morgan@microtask.local", demo_password_hash, "Alex Morgan (Sprint Manager)", "project_manager"),
        ("pm_rachel", "rachel.green@microtask.local", demo_password_hash, "Rachel Green (Product Owner)", "project_manager"),
        ("dev_john", "john.doe@microtask.local", demo_password_hash, "John Doe (Full Stack Dev)", "team_member"),
        ("dev_priya", "priya.sharma@microtask.local", demo_password_hash, "Priya Sharma (Backend Engineer)", "team_member"),
        ("dev_marcus", "marcus.chen@microtask.local", demo_password_hash, "Marcus Chen (Frontend Dev)", "team_member"),
        ("dev_elena", "elena.rostova@microtask.local", demo_password_hash, "Elena Rostova (QA Engineer)", "team_member"),
    ]

    user_ids = {}
    for uname, email, phash, fname, role in users_data:
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)
        """, (uname, email, phash, fname, role, (now - timedelta(days=45)).isoformat()))
        user_ids[uname] = cursor.lastrowid

    # 2. Insert Project Settings
    settings_data = [
        ("project_name", "MicroTask Enterprise Suite", "Official title of the monitored software project"),
        ("current_sprint", "Sprint 14 - Metrics & Resilience", "Current active agile iteration"),
        ("target_completion_rate", "85", "Target task completion percentage threshold"),
        ("max_acceptable_cycle_time", "24", "Target maximum cycle time in hours"),
        ("defect_rate_tolerance", "15", "Maximum acceptable defect percentage on completed tasks"),
    ]
    for k, v, d in settings_data:
        cursor.execute("""
            INSERT INTO project_settings (key, value, description, updated_at)
            VALUES (?, ?, ?, ?)
        """, (k, v, d, now.isoformat()))

    # Helper function to generate ISO timestamp relative to now
    def rel_time(days=0, hours=0, minutes=0):
        return (now + timedelta(days=days, hours=hours, minutes=minutes)).isoformat()

    # 3. Tasks dataset: Rich scenarios covering all metrics
    # Task schema: title, desc, assignee, creator, priority, status, est_h, act_h, created_offset, start_offset, due_offset, comp_offset
    tasks_data = [
        # COMPLETED TASKS (Contributes to Completion Rate, Cycle Time, Throughput)
        {
            "title": "Implement JWT Authentication Endpoints",
            "desc": "Create login, token verification, and refresh routes using PyJWT and scrypt password hashing.",
            "assignee": "dev_priya", "creator": "pm_alex", "priority": "high", "status": "completed",
            "est": 8.0, "act": 7.5, "created": -18, "start": -17, "due": -14, "comp": -16, # Cycle: 24h
            "defects": []
        },
        {
            "title": "Design Database Schema & Relational DDL",
            "desc": "Define tables for users, tasks, history, and metrics with enforced foreign key cascades.",
            "assignee": "dev_john", "creator": "pm_alex", "priority": "critical", "status": "completed",
            "est": 6.0, "act": 5.0, "created": -16, "start": -16, "due": -13, "comp": -15, # Cycle: 24h
            "defects": []
        },
        {
            "title": "Build Automated Metrics Calculation Engine",
            "desc": "Implement mathematical formulas for completion rate, cycle time, throughput, defect rate, and rework rate.",
            "assignee": "dev_priya", "creator": "admin", "priority": "critical", "status": "completed",
            "est": 12.0, "act": 14.0, "created": -14, "start": -13, "due": -10, "comp": -11, # Cycle: 48h
            "defects": [
                {"title": "Zero division on empty dataset", "desc": "Calculating completion rate on 0 eligible tasks returned uncaught ZeroDivisionError", "sev": "high", "status": "resolved"}
            ]
        },
        {
            "title": "Develop Interactive Recharts Dashboard Cards",
            "desc": "Construct KPI summary widgets with percentage indicators and clean visual telemetry.",
            "assignee": "dev_marcus", "creator": "pm_alex", "priority": "high", "status": "completed",
            "est": 10.0, "act": 9.0, "created": -12, "start": -11, "due": -8, "comp": -9, # Cycle: 48h
            "defects": []
        },
        {
            "title": "Implement CSV Export with Strict Escaping",
            "desc": "Generate compliant CSV files supporting multiline task descriptions and active filter parameters.",
            "assignee": "dev_john", "creator": "pm_rachel", "priority": "medium", "status": "completed",
            "est": 4.0, "act": 4.5, "created": -10, "start": -9, "due": -6, "comp": -8, # Cycle: 24h
            "defects": []
        },
        {
            "title": "Add In-App Notification Trigger Framework",
            "desc": "Push alerts to assigned engineers when tasks are assigned, modified, or near deadline.",
            "assignee": "dev_elena", "creator": "pm_alex", "priority": "medium", "status": "completed",
            "est": 6.0, "act": 6.0, "created": -8, "start": -7, "due": -4, "comp": -6, # Cycle: 24h
            "defects": [
                {"title": "Duplicate alert spam on page refresh", "desc": "Deadline notifications generated duplicate records on repeated dashboard queries", "sev": "critical", "status": "resolved"}
            ]
        },
        {
            "title": "Configure SQLite Connection Connection Pooling & PRAGMA",
            "desc": "Enforce PRAGMA foreign_keys = ON and multi-thread safe row factories.",
            "assignee": "dev_priya", "creator": "admin", "priority": "low", "status": "completed",
            "est": 3.0, "act": 2.5, "created": -7, "start": -6, "due": -3, "comp": -5, # Cycle: 24h
            "defects": []
        },
        {
            "title": "Write Pytest Test Suite for Authentication & Roles",
            "desc": "Implement automated tests for JWT generation, expired tokens, and RBAC forbidden scenarios.",
            "assignee": "dev_elena", "creator": "admin", "priority": "high", "status": "completed",
            "est": 8.0, "act": 8.0, "created": -6, "start": -5, "due": -2, "comp": -4, # Cycle: 24h
            "defects": []
        },

        # REWORK TASK (Has completed in past, but reopened! Demonstrates Rework Rate)
        {
            "title": "Refactor User Role Management Permissions",
            "desc": "Validate that team members cannot escalate roles or modify tasks owned by other engineers.",
            "assignee": "dev_john", "creator": "admin", "priority": "high", "status": "in_progress",
            "est": 5.0, "act": 6.5, "created": -15, "start": -14, "due": 2, "comp": None,
            "was_reopened": True,
            "defects": [
                {"title": "Role dropdown visible to non-admin users", "desc": "Team member UI was able to view administrative user creation menu", "sev": "high", "status": "open"}
            ]
        },

        # IN PROGRESS TASKS (Active workload)
        {
            "title": "Optimize SQL Query Indexing for Large Task Repositories",
            "desc": "Analyze EXPLAIN QUERY PLAN and add composite indexes on status, due_date, and assigned_to_id.",
            "assignee": "dev_priya", "creator": "pm_alex", "priority": "medium", "status": "in_progress",
            "est": 6.0, "act": 3.0, "created": -4, "start": -2, "due": 3, "comp": None,
            "defects": []
        },
        {
            "title": "Build Responsive Mobile Drawer Navigation",
            "desc": "Ensure navigation sidebar collapses into a sleek slide-out drawer on smartphone viewports.",
            "assignee": "dev_marcus", "creator": "pm_rachel", "priority": "medium", "status": "in_progress",
            "est": 5.0, "act": 2.0, "created": -3, "start": -1, "due": 4, "comp": None,
            "defects": []
        },

        # OVERDUE TASKS (Demonstrates Overdue Task Count and Alert Badges)
        {
            "title": "Fix Memory Leak in Long-Running Background Pollers",
            "desc": "Identify unclosed database connections in notification daemon poller.",
            "assignee": "dev_john", "creator": "pm_alex", "priority": "critical", "status": "in_progress",
            "est": 4.0, "act": 2.0, "created": -7, "start": -5, "due": -2, "comp": None, # OVERDUE!
            "defects": [
                {"title": "High memory consumption after 24 hours", "desc": "Process RSS grows by 15MB per 1000 poll cycles", "sev": "medium", "status": "open"}
            ]
        },
        {
            "title": "Update API Documentation with Swagger/OpenAPI Specs",
            "desc": "Document all REST endpoint request/response contracts for college project submission.",
            "assignee": "dev_elena", "creator": "pm_rachel", "priority": "low", "status": "todo",
            "est": 5.0, "act": 0.0, "created": -8, "start": None, "due": -1, "comp": None, # OVERDUE!
            "defects": []
        },

        # APPROACHING DEADLINE (Due in 14 hours)
        {
            "title": "Validate Cross-Browser CSS Form Rendering",
            "desc": "Verify form control alignment, focus rings, and dark-mode contrast across Chrome, Edge, and Firefox.",
            "assignee": "dev_marcus", "creator": "pm_alex", "priority": "medium", "status": "in_progress",
            "est": 4.0, "act": 1.5, "created": -2, "start": -1, "due": 0.5, "comp": None, # Due in 12 hours
            "defects": []
        },

        # TODO TASKS (Backlog)
        {
            "title": "Implement Webhook Dispatcher for GitHub Commit Linking",
            "desc": "Allow tasks to automatically transition to 'In Progress' when a git branch is pushed.",
            "assignee": "dev_priya", "creator": "pm_alex", "priority": "low", "status": "todo",
            "est": 8.0, "act": 0.0, "created": -1, "start": None, "due": 7, "comp": None,
            "defects": []
        },
        {
            "title": "Conduct Security Audit of Input Sanitization",
            "desc": "Ensure all text inputs are verified against SQL injection and stored cross-site scripting vectors.",
            "assignee": "dev_elena", "creator": "admin", "priority": "high", "status": "todo",
            "est": 6.0, "act": 0.0, "created": -1, "start": None, "due": 5, "comp": None,
            "defects": []
        },
        {
            "title": "Unassigned Technical Debt Refactoring",
            "desc": "Remove legacy logging and consolidate utility date parsing helpers.",
            "assignee": None, "creator": "pm_alex", "priority": "low", "status": "todo",
            "est": 3.0, "act": 0.0, "created": -2, "start": None, "due": 10, "comp": None,
            "defects": []
        },

        # CANCELLED TASK (Demonstrates proper handling in Completion Rate denominator)
        {
            "title": "Investigate SOAP Legacy Integration",
            "desc": "Evaluate XML SOAP protocol interface for third-party billing connector (Discarded in favor of REST).",
            "assignee": "dev_john", "creator": "pm_rachel", "priority": "low", "status": "cancelled",
            "est": 8.0, "act": 1.0, "created": -20, "start": -19, "due": -15, "comp": None,
            "defects": []
        }
    ]

    for t in tasks_data:
        assignee_id = user_ids.get(t["assignee"]) if t["assignee"] else None
        creator_id = user_ids.get(t["creator"])

        created_at = rel_time(days=t["created"])
        started_at = rel_time(days=t["start"]) if t["start"] is not None else None
        due_date = rel_time(days=t["due"]) if t["due"] is not None else None
        completed_at = rel_time(days=t["comp"]) if t["comp"] is not None else None

        cursor.execute("""
            INSERT INTO tasks (
                title, description, assigned_to_id, created_by_id, priority,
                status, estimated_hours, actual_hours, created_at, started_at,
                due_date, completed_at, is_deleted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (
            t["title"], t["desc"], assignee_id, creator_id, t["priority"],
            t["status"], t["est"], t["act"], created_at, started_at,
            due_date, completed_at
        ))
        task_id = cursor.lastrowid

        # Insert historical audit trail in task_status_history
        cursor.execute("""
            INSERT INTO task_status_history (task_id, changed_by_id, old_status, new_status, changed_at, comment)
            VALUES (?, ?, NULL, 'todo', ?, 'Task created and backlogged')
        """, (task_id, creator_id, created_at))

        if started_at:
            cursor.execute("""
                INSERT INTO task_status_history (task_id, changed_by_id, old_status, new_status, changed_at, comment)
                VALUES (?, ?, 'todo', 'in_progress', ?, 'Work commenced by developer')
            """, (task_id, assignee_id or creator_id, started_at))

        if completed_at:
            cursor.execute("""
                INSERT INTO task_status_history (task_id, changed_by_id, old_status, new_status, changed_at, comment)
                VALUES (?, ?, 'in_progress', 'completed', ?, 'Code delivered and quality gates passed')
            """, (task_id, assignee_id or creator_id, completed_at))

        if t.get("was_reopened"):
            # Record previous completion, then reopening
            past_completed = rel_time(days=t["created"] + 3)
            cursor.execute("""
                INSERT INTO task_status_history (task_id, changed_by_id, old_status, new_status, changed_at, comment)
                VALUES (?, ?, 'in_progress', 'completed', ?, 'Initially completed')
            """, (task_id, assignee_id, past_completed))

            reopen_time = rel_time(days=t["created"] + 5)
            cursor.execute("""
                INSERT INTO task_status_history (task_id, changed_by_id, old_status, new_status, changed_at, comment)
                VALUES (?, ?, 'completed', 'in_progress', ?, 'Reopened due to QA test failure (rework)')
            """, (task_id, user_ids["dev_elena"], reopen_time))

        if t["status"] == "cancelled":
            cursor.execute("""
                INSERT INTO task_status_history (task_id, changed_by_id, old_status, new_status, changed_at, comment)
                VALUES (?, ?, 'in_progress', 'cancelled', ?, 'Scope abandoned - superseded by REST API')
            """, (task_id, creator_id, rel_time(days=t["created"] + 2)))

        # Insert defects
        for d in t["defects"]:
            resolved_at = completed_at if d["status"] == "resolved" else None
            cursor.execute("""
                INSERT INTO defects (task_id, reported_by_id, title, description, severity, status, created_at, resolved_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id, user_ids["dev_elena"], d["title"], d["desc"],
                d["sev"], d["status"], rel_time(days=t["created"] + 1), resolved_at
            ))

        # Insert notification for active or critical items
        if assignee_id and t["status"] in ("in_progress", "todo"):
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, is_read, link, created_at)
                VALUES (?, ?, ?, 'assignment', 0, ?, ?)
            """, (
                assignee_id,
                f"Active Task Assignment: {t['title']}",
                f"Priority: {t['priority'].upper()}. Deadline: {due_date}",
                f"/tasks/{task_id}",
                rel_time(hours=-12)
            ))

    # Add overdue and deadline alerts into notifications
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, is_read, link, created_at)
        VALUES (?, 'Urgent: Task Overdue', 'Task \"Fix Memory Leak in Long-Running Background Pollers\" is overdue.', 'overdue', 0, '/tasks/12', ?)
    """, (user_ids["dev_john"], rel_time(hours=-2)))

    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, type, is_read, link, created_at)
        VALUES (?, 'Approaching Deadline (12 Hours)', 'Task \"Validate Cross-Browser CSS Form Rendering\" is due today.', 'deadline', 0, '/tasks/14', ?)
    """, (user_ids["dev_marcus"], rel_time(hours=-1)))

    conn.commit()
    print("Database successfully seeded with realistic demonstration records.")

if __name__ == "__main__":
    db_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "instance", "microtask.db")
    os.makedirs(os.path.dirname(db_file), exist_ok=True)
    c = sqlite3.connect(db_file)
    c.execute("PRAGMA foreign_keys = ON;")
    from app.models.db import SCHEMA_SQL
    c.executescript(SCHEMA_SQL)
    seed_database(c)
    c.close()

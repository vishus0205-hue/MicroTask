import sqlite3
from datetime import datetime, timezone, timedelta
from app.metrics.engine import MetricsEngine
from app.models.db import SCHEMA_SQL

def create_isolated_db():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    return conn

def test_metrics_empty_database_safe_defaults():
    conn = create_isolated_db()
    engine = MetricsEngine(conn)
    metrics = engine.calculate_all_metrics()

    assert metrics["summary"]["completion_rate"] == 0.0
    assert metrics["summary"]["avg_cycle_time_hours"] == 0.0
    assert metrics["summary"]["throughput"] == 0
    assert metrics["summary"]["overdue_count"] == 0
    assert metrics["summary"]["defect_rate"] == 0.0
    assert metrics["summary"]["rework_rate"] == 0.0
    assert metrics["summary"]["eligible_tasks"] == 0
    assert metrics["summary"]["completed_tasks"] == 0
    conn.close()

def test_task_completion_rate_and_cancelled_treatment():
    conn = create_isolated_db()
    now = datetime.now(timezone.utc).isoformat()
    cursor = conn.cursor()

    # User
    cursor.execute("INSERT INTO users (username, email, password_hash, full_name, role, created_at) VALUES ('u1', 'u1@t.com', 'p', 'User 1', 'team_member', ?)", (now,))
    uid = cursor.lastrowid

    # Insert 2 completed, 2 in_progress, 1 cancelled (total 5 created, 4 eligible)
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T1', 'low', 'completed', ?)", (now,))
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T2', 'low', 'completed', ?)", (now,))
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T3', 'low', 'in_progress', ?)", (now,))
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T4', 'low', 'todo', ?)", (now,))
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T5', 'low', 'cancelled', ?)", (now,))
    conn.commit()

    engine = MetricsEngine(conn)
    # Eligible tasks = 4 (T1, T2, T3, T4); Completed = 2 (T1, T2) -> Rate = 2/4 * 100 = 50.0%
    assert engine.get_eligible_tasks_count() == 4
    assert engine.get_completed_tasks_count() == 2
    assert engine.get_cancelled_tasks_count() == 1
    assert engine.get_task_completion_rate() == 50.0
    conn.close()

def test_average_cycle_time_calculation():
    conn = create_isolated_db()
    cursor = conn.cursor()
    base_time = datetime(2026, 1, 10, 10, 0, 0, tzinfo=timezone.utc)

    # Task 1: 10 hours cycle time
    start1 = base_time.isoformat()
    comp1 = (base_time + timedelta(hours=10)).isoformat()
    cursor.execute("""
        INSERT INTO tasks (title, priority, status, started_at, completed_at, created_at)
        VALUES ('Task 10h', 'high', 'completed', ?, ?, ?)
    """, (start1, comp1, start1))

    # Task 2: 20 hours cycle time
    start2 = base_time.isoformat()
    comp2 = (base_time + timedelta(hours=20)).isoformat()
    cursor.execute("""
        INSERT INTO tasks (title, priority, status, started_at, completed_at, created_at)
        VALUES ('Task 20h', 'high', 'completed', ?, ?, ?)
    """, (start2, comp2, start2))

    # Task 3: Incomplete task (should NOT be included in cycle time)
    cursor.execute("""
        INSERT INTO tasks (title, priority, status, started_at, created_at)
        VALUES ('Task Active', 'medium', 'in_progress', ?, ?)
    """, (start1, start1))
    conn.commit()

    engine = MetricsEngine(conn)
    # Expected average: (10 + 20) / 2 = 15.0 hours
    assert engine.get_average_cycle_time() == 15.0
    conn.close()

def test_overdue_task_count():
    conn = create_isolated_db()
    now = datetime.now(timezone.utc)
    past_due = (now - timedelta(days=2)).isoformat()
    future_due = (now + timedelta(days=5)).isoformat()
    now_iso = now.isoformat()
    cursor = conn.cursor()

    # Overdue task (in_progress with past deadline) -> Counted
    cursor.execute("INSERT INTO tasks (title, priority, status, due_date, created_at) VALUES ('Overdue 1', 'high', 'in_progress', ?, ?)", (past_due, now_iso))
    # Overdue task (todo with past deadline) -> Counted
    cursor.execute("INSERT INTO tasks (title, priority, status, due_date, created_at) VALUES ('Overdue 2', 'medium', 'todo', ?, ?)", (past_due, now_iso))
    # On-time task (future deadline) -> Not overdue
    cursor.execute("INSERT INTO tasks (title, priority, status, due_date, created_at) VALUES ('On Time', 'low', 'todo', ?, ?)", (future_due, now_iso))
    # Completed task with past deadline -> Completed, so NOT overdue
    cursor.execute("INSERT INTO tasks (title, priority, status, due_date, completed_at, created_at) VALUES ('Completed Past', 'low', 'completed', ?, ?, ?)", (past_due, now_iso, now_iso))
    conn.commit()

    engine = MetricsEngine(conn)
    assert engine.get_overdue_task_count() == 2
    conn.close()

def test_defect_rate_and_rework_rate():
    conn = create_isolated_db()
    now = datetime.now(timezone.utc).isoformat()
    cursor = conn.cursor()

    # 4 completed tasks
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T1', 'low', 'completed', ?)", (now,))
    t1 = cursor.lastrowid
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T2', 'low', 'completed', ?)", (now,))
    t2 = cursor.lastrowid
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T3', 'low', 'completed', ?)", (now,))
    cursor.execute("INSERT INTO tasks (title, priority, status, created_at) VALUES ('T4', 'low', 'completed', ?)", (now,))

    # T1 has 2 defects; T2 has 1 defect -> 2 tasks with defects out of 4 completed = 50.0%
    cursor.execute("INSERT INTO defects (task_id, title, severity, status, created_at) VALUES (?, 'Bug 1', 'high', 'open', ?)", (t1, now))
    cursor.execute("INSERT INTO defects (task_id, title, severity, status, created_at) VALUES (?, 'Bug 2', 'low', 'resolved', ?)", (t1, now))
    cursor.execute("INSERT INTO defects (task_id, title, severity, status, created_at) VALUES (?, 'Bug 3', 'critical', 'open', ?)", (t2, now))

    # T1 was also reopened: history from completed -> in_progress
    cursor.execute("INSERT INTO task_status_history (task_id, old_status, new_status, changed_at) VALUES (?, 'in_progress', 'completed', ?)", (t1, now))
    cursor.execute("INSERT INTO task_status_history (task_id, old_status, new_status, changed_at) VALUES (?, 'completed', 'in_progress', ?)", (t1, now))
    conn.commit()

    engine = MetricsEngine(conn)
    assert engine.get_defect_rate() == 50.0
    # 1 task reopened out of tasks that reached completion = 1/4 = 25.0%
    assert engine.get_rework_rate() == 25.0
    conn.close()

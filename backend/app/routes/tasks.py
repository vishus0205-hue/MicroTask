from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from app.models.db import get_db
from app.utils.auth_middleware import jwt_required
from app.services.notification_service import create_notification, check_and_generate_deadline_notifications

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

@tasks_bp.route("", methods=["GET"])
@jwt_required
def get_tasks():
    # Run lazy deadline check to populate alerts
    db = get_db()
    try:
        check_and_generate_deadline_notifications(db.get_connection())
    except Exception:
        pass

    search = request.args.get("search", "").strip()
    status = request.args.get("status")
    priority = request.args.get("priority")
    assigned_to = request.args.get("assigned_to_id")
    created_by = request.args.get("created_by_id")
    overdue_only = request.args.get("overdue", "false").lower() == "true"
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    sort_by = request.args.get("sort_by", "created_at")
    order = request.args.get("order", "desc").lower()
    page = max(1, int(request.args.get("page", 1)))
    limit = max(1, min(100, int(request.args.get("limit", 20))))
    offset = (page - 1) * limit

    allowed_sorts = {
        "created_at": "t.created_at",
        "due_date": "t.due_date",
        "priority": "t.priority",
        "status": "t.status",
        "title": "t.title",
        "id": "t.id"
    }
    sort_column = allowed_sorts.get(sort_by, "t.created_at")
    sort_direction = "ASC" if order == "asc" else "DESC"

    where_clauses = ["t.is_deleted = 0"]
    params = []

    # If team_member and requested 'my_tasks_only'
    if request.args.get("my_tasks_only", "false").lower() == "true":
        where_clauses.append("t.assigned_to_id = ?")
        params.append(g.current_user["id"])

    if search:
        where_clauses.append("(t.title LIKE ? OR t.description LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])

    if status:
        where_clauses.append("t.status = ?")
        params.append(status)

    if priority:
        where_clauses.append("t.priority = ?")
        params.append(priority)

    if assigned_to:
        if assigned_to == "unassigned":
            where_clauses.append("t.assigned_to_id IS NULL")
        else:
            where_clauses.append("t.assigned_to_id = ?")
            params.append(int(assigned_to))

    if created_by:
        where_clauses.append("t.created_by_id = ?")
        params.append(int(created_by))

    if overdue_only:
        now_iso = datetime.now(timezone.utc).isoformat()
        where_clauses.append("t.status IN ('todo', 'in_progress') AND t.due_date IS NOT NULL AND t.due_date < ?")
        params.append(now_iso)

    if date_from:
        where_clauses.append("t.created_at >= ?")
        params.append(date_from)

    if date_to:
        where_clauses.append("t.created_at <= ?")
        params.append(date_to)

    where_str = " AND ".join(where_clauses)

    count_query = f"SELECT COUNT(*) as total FROM tasks t WHERE {where_str}"
    
    data_query = f"""
        SELECT 
            t.id, t.title, t.description, t.assigned_to_id, t.created_by_id,
            t.priority, t.status, t.estimated_hours, t.actual_hours,
            t.created_at, t.started_at, t.due_date, t.completed_at,
            u_assignee.full_name as assigned_to_name,
            u_assignee.username as assigned_to_username,
            u_creator.full_name as created_by_name,
            (SELECT COUNT(*) FROM defects d WHERE d.task_id = t.id) as defect_count
        FROM tasks t
        LEFT JOIN users u_assignee ON t.assigned_to_id = u_assignee.id
        LEFT JOIN users u_creator ON t.created_by_id = u_creator.id
        WHERE {where_str}
        ORDER BY {sort_column} {sort_direction}
        LIMIT ? OFFSET ?
    """

    with db.get_cursor() as cursor:
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()["total"]

        cursor.execute(data_query, params + [limit, offset])
        rows = cursor.fetchall()

    tasks = [
        {
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "assigned_to_id": r["assigned_to_id"],
            "assigned_to_name": r["assigned_to_name"],
            "assigned_to_username": r["assigned_to_username"],
            "created_by_id": r["created_by_id"],
            "created_by_name": r["created_by_name"],
            "priority": r["priority"],
            "status": r["status"],
            "estimated_hours": r["estimated_hours"],
            "actual_hours": r["actual_hours"],
            "created_at": r["created_at"],
            "started_at": r["started_at"],
            "due_date": r["due_date"],
            "completed_at": r["completed_at"],
            "defect_count": r["defect_count"],
            "is_overdue": bool(
                r["status"] in ("todo", "in_progress") and
                r["due_date"] and
                r["due_date"] < datetime.now(timezone.utc).isoformat()
            )
        }
        for r in rows
    ]

    return jsonify({
        "tasks": tasks,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1
    }), 200

@tasks_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required
def get_task(task_id):
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("""
            SELECT 
                t.*,
                u_assignee.full_name as assigned_to_name,
                u_assignee.username as assigned_to_username,
                u_creator.full_name as created_by_name
            FROM tasks t
            LEFT JOIN users u_assignee ON t.assigned_to_id = u_assignee.id
            LEFT JOIN users u_creator ON t.created_by_id = u_creator.id
            WHERE t.id = ? AND t.is_deleted = 0
        """, (task_id,))
        task_row = cursor.fetchone()

        if not task_row:
            return jsonify({"error": "Task not found"}), 404

        # Fetch status history
        cursor.execute("""
            SELECT 
                h.id, h.old_status, h.new_status, h.changed_at, h.comment,
                u.full_name as changed_by_name
            FROM task_status_history h
            LEFT JOIN users u ON h.changed_by_id = u.id
            WHERE h.task_id = ?
            ORDER BY h.changed_at ASC
        """, (task_id,))
        history_rows = cursor.fetchall()

        # Fetch defects
        cursor.execute("""
            SELECT 
                d.id, d.title, d.description, d.severity, d.status, d.created_at, d.resolved_at,
                u.full_name as reported_by_name
            FROM defects d
            LEFT JOIN users u ON d.reported_by_id = u.id
            WHERE d.task_id = ?
            ORDER BY d.created_at DESC
        """, (task_id,))
        defect_rows = cursor.fetchall()

    task_data = {
        "id": task_row["id"],
        "title": task_row["title"],
        "description": task_row["description"],
        "assigned_to_id": task_row["assigned_to_id"],
        "assigned_to_name": task_row["assigned_to_name"],
        "assigned_to_username": task_row["assigned_to_username"],
        "created_by_id": task_row["created_by_id"],
        "created_by_name": task_row["created_by_name"],
        "priority": task_row["priority"],
        "status": task_row["status"],
        "estimated_hours": task_row["estimated_hours"],
        "actual_hours": task_row["actual_hours"],
        "created_at": task_row["created_at"],
        "started_at": task_row["started_at"],
        "due_date": task_row["due_date"],
        "completed_at": task_row["completed_at"],
        "is_overdue": bool(
            task_row["status"] in ("todo", "in_progress") and
            task_row["due_date"] and
            task_row["due_date"] < datetime.now(timezone.utc).isoformat()
        ),
        "history": [
            {
                "id": h["id"],
                "old_status": h["old_status"],
                "new_status": h["new_status"],
                "changed_at": h["changed_at"],
                "comment": h["comment"],
                "changed_by_name": h["changed_by_name"]
            }
            for h in history_rows
        ],
        "defects": [
            {
                "id": d["id"],
                "title": d["title"],
                "description": d["description"],
                "severity": d["severity"],
                "status": d["status"],
                "created_at": d["created_at"],
                "resolved_at": d["resolved_at"],
                "reported_by_name": d["reported_by_name"]
            }
            for d in defect_rows
        ]
    }
    return jsonify({"task": task_data}), 200

@tasks_bp.route("", methods=["POST"])
@jwt_required
def create_task():
    user = g.current_user
    if user["role"] not in ("admin", "project_manager"):
        return jsonify({"error": "Only Project Managers and Admins can create tasks"}), 403

    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Task title is required"}), 400

    description = data.get("description", "").strip()
    priority = data.get("priority", "medium")
    if priority not in ("low", "medium", "high", "critical"):
        return jsonify({"error": "Invalid priority"}), 400

    assigned_to_id = data.get("assigned_to_id")
    if assigned_to_id:
        try:
            assigned_to_id = int(assigned_to_id)
        except ValueError:
            assigned_to_id = None

    estimated_hours = float(data.get("estimated_hours", 0.0) or 0.0)
    due_date = data.get("due_date")
    now_iso = datetime.now(timezone.utc).isoformat()

    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO tasks (
                title, description, assigned_to_id, created_by_id, priority,
                status, estimated_hours, actual_hours, created_at, due_date, is_deleted
            ) VALUES (?, ?, ?, ?, ?, 'todo', ?, 0.0, ?, ?, 0)
        """, (title, description, assigned_to_id, user["id"], priority, estimated_hours, now_iso, due_date))
        task_id = cursor.lastrowid

        # Insert initial status history
        cursor.execute("""
            INSERT INTO task_status_history (task_id, changed_by_id, old_status, new_status, changed_at, comment)
            VALUES (?, ?, NULL, 'todo', ?, 'Task created')
        """, (task_id, user["id"], now_iso))

    # Send assignment notification if assigned
    if assigned_to_id:
        create_notification(
            db.get_connection(),
            user_id=assigned_to_id,
            title="New Task Assigned",
            message=f"You have been assigned to task: '{title}'.",
            notif_type="assignment",
            link=f"/tasks/{task_id}"
        )

    return jsonify({"message": "Task created successfully", "task_id": task_id}), 201

@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required
def update_task(task_id):
    user = g.current_user
    db = get_db()

    with db.get_cursor() as cursor:
        cursor.execute("SELECT * FROM tasks WHERE id = ? AND is_deleted = 0", (task_id,))
        task = cursor.fetchone()
        if not task:
            return jsonify({"error": "Task not found"}), 404

        # Permission check: Admin or PM can edit full details; assignee can edit actual_hours
        is_manager = user["role"] in ("admin", "project_manager")
        is_assignee = task["assigned_to_id"] == user["id"]

        if not is_manager and not is_assignee:
            return jsonify({"error": "Unauthorized to update this task"}), 403

        data = request.get_json() or {}
        now_iso = datetime.now(timezone.utc).isoformat()

        if is_manager:
            title = data.get("title", task["title"]).strip()
            description = data.get("description", task["description"])
            priority = data.get("priority", task["priority"])
            due_date = data.get("due_date", task["due_date"])
            estimated_hours = float(data.get("estimated_hours", task["estimated_hours"]) or 0.0)
            actual_hours = float(data.get("actual_hours", task["actual_hours"]) or 0.0)
            new_assignee = data.get("assigned_to_id")
            if new_assignee is not None:
                new_assignee = int(new_assignee) if new_assignee != "" else None
            else:
                new_assignee = task["assigned_to_id"]

            old_assignee = task["assigned_to_id"]

            cursor.execute("""
                UPDATE tasks
                SET title = ?, description = ?, priority = ?, due_date = ?,
                    estimated_hours = ?, actual_hours = ?, assigned_to_id = ?
                WHERE id = ?
            """, (title, description, priority, due_date, estimated_hours, actual_hours, new_assignee, task_id))

            # If assignee changed, notify new assignee
            if new_assignee and new_assignee != old_assignee:
                create_notification(
                    db.get_connection(),
                    user_id=new_assignee,
                    title="Task Reassigned",
                    message=f"Task '{title}' has been assigned to you.",
                    notif_type="reassignment",
                    link=f"/tasks/{task_id}"
                )
        else:
            # Assignee can only update actual_hours
            actual_hours = float(data.get("actual_hours", task["actual_hours"]) or 0.0)
            cursor.execute("UPDATE tasks SET actual_hours = ? WHERE id = ?", (actual_hours, task_id))

    return jsonify({"message": "Task updated successfully"}), 200

@tasks_bp.route("/<int:task_id>/status", methods=["PUT"])
@jwt_required
def update_task_status(task_id):
    data = request.get_json() or {}
    new_status = data.get("status")
    comment = data.get("comment", "").strip()
    actual_hours = data.get("actual_hours")

    if new_status not in ("todo", "in_progress", "completed", "cancelled"):
        return jsonify({"error": "Invalid status value"}), 400

    user = g.current_user
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("SELECT * FROM tasks WHERE id = ? AND is_deleted = 0", (task_id,))
        task = cursor.fetchone()
        if not task:
            return jsonify({"error": "Task not found"}), 404

        old_status = task["status"]
        if old_status == new_status:
            return jsonify({"message": "Status unchanged"}), 200

        # Permission check: Team member can update their assigned tasks; PM/Admin can update any
        if user["role"] not in ("admin", "project_manager") and task["assigned_to_id"] != user["id"]:
            return jsonify({"error": "You can only update status for tasks assigned to you"}), 403

        now_iso = datetime.now(timezone.utc).isoformat()
        started_at = task["started_at"]
        completed_at = task["completed_at"]

        # Record start timestamp on transition to in_progress if not already set
        if new_status == "in_progress" and not started_at:
            started_at = now_iso

        # If completed, set completed_at
        if new_status == "completed":
            completed_at = now_iso
            if not started_at:
                started_at = now_iso
        elif old_status == "completed" and new_status in ("todo", "in_progress"):
            # Reopening task - track rework
            pass

        # Update actual hours if provided
        updated_actual_hours = task["actual_hours"]
        if actual_hours is not None:
            updated_actual_hours = float(actual_hours)

        cursor.execute("""
            UPDATE tasks
            SET status = ?, started_at = ?, completed_at = ?, actual_hours = ?
            WHERE id = ?
        """, (new_status, started_at, completed_at, updated_actual_hours, task_id))

        # Record in task_status_history
        cursor.execute("""
            INSERT INTO task_status_history (task_id, changed_by_id, old_status, new_status, changed_at, comment)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (task_id, user["id"], old_status, new_status, now_iso, comment or f"Status changed from {old_status} to {new_status}"))

    # Notify manager/creator if status changed to completed or reopened
    if task["created_by_id"] and task["created_by_id"] != user["id"]:
        create_notification(
            db.get_connection(),
            user_id=task["created_by_id"],
            title=f"Task Status Changed: {task['title']}",
            message=f"Status changed from {old_status} to {new_status} by {user['username']}.",
            notif_type="status_change",
            link=f"/tasks/{task_id}"
        )

    return jsonify({"message": "Task status updated successfully", "old_status": old_status, "new_status": new_status}), 200

@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required
def delete_task(task_id):
    user = g.current_user
    if user["role"] not in ("admin", "project_manager"):
        return jsonify({"error": "Only Admins and Project Managers can delete tasks"}), 403

    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("UPDATE tasks SET is_deleted = 1 WHERE id = ?", (task_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task deleted successfully"}), 200

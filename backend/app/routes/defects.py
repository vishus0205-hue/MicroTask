from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from app.models.db import get_db
from app.utils.auth_middleware import jwt_required
from app.services.notification_service import create_notification

defects_bp = Blueprint("defects", __name__, url_prefix="/api/defects")

@defects_bp.route("/task/<int:task_id>", methods=["GET"])
@jwt_required
def get_task_defects(task_id):
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("""
            SELECT d.*, u.full_name as reported_by_name
            FROM defects d
            LEFT JOIN users u ON d.reported_by_id = u.id
            WHERE d.task_id = ?
            ORDER BY d.created_at DESC
        """, (task_id,))
        rows = cursor.fetchall()

    defects = [
        {
            "id": r["id"],
            "task_id": r["task_id"],
            "reported_by_id": r["reported_by_id"],
            "reported_by_name": r["reported_by_name"],
            "title": r["title"],
            "description": r["description"],
            "severity": r["severity"],
            "status": r["status"],
            "created_at": r["created_at"],
            "resolved_at": r["resolved_at"]
        }
        for r in rows
    ]
    return jsonify({"defects": defects}), 200

@defects_bp.route("", methods=["POST"])
@jwt_required
def report_defect():
    data = request.get_json() or {}
    task_id = data.get("task_id")
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    severity = data.get("severity", "medium")

    if not task_id or not title:
        return jsonify({"error": "Task ID and defect title are required"}), 400

    if severity not in ("low", "medium", "high", "critical"):
        return jsonify({"error": "Invalid severity level"}), 400

    user = g.current_user
    now_iso = datetime.now(timezone.utc).isoformat()
    db = get_db()

    with db.get_cursor() as cursor:
        cursor.execute("SELECT id, title, assigned_to_id, created_by_id FROM tasks WHERE id = ? AND is_deleted = 0", (task_id,))
        task = cursor.fetchone()
        if not task:
            return jsonify({"error": "Task not found"}), 404

        cursor.execute("""
            INSERT INTO defects (task_id, reported_by_id, title, description, severity, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'open', ?)
        """, (task_id, user["id"], title, description, severity, now_iso))
        defect_id = cursor.lastrowid

    # Notify assignee if someone reported a defect
    if task["assigned_to_id"] and task["assigned_to_id"] != user["id"]:
        create_notification(
            db.get_connection(),
            user_id=task["assigned_to_id"],
            title=f"Defect Reported on '{task['title']}'",
            message=f"Defect '{title}' [{severity.upper()}] reported by {user['username']}.",
            notif_type="defect",
            link=f"/tasks/{task_id}"
        )

    return jsonify({"message": "Defect reported successfully", "defect_id": defect_id}), 201

@defects_bp.route("/<int:defect_id>", methods=["PUT"])
@jwt_required
def update_defect(defect_id):
    data = request.get_json() or {}
    status = data.get("status")
    severity = data.get("severity")
    title = data.get("title")
    description = data.get("description")

    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("SELECT * FROM defects WHERE id = ?", (defect_id,))
        defect = cursor.fetchone()
        if not defect:
            return jsonify({"error": "Defect not found"}), 404

        updates = []
        params = []
        if title:
            updates.append("title = ?")
            params.append(title.strip())
        if description is not None:
            updates.append("description = ?")
            params.append(description.strip())
        if severity:
            if severity not in ("low", "medium", "high", "critical"):
                return jsonify({"error": "Invalid severity"}), 400
            updates.append("severity = ?")
            params.append(severity)
        if status:
            if status not in ("open", "in_review", "resolved", "closed"):
                return jsonify({"error": "Invalid status"}), 400
            updates.append("status = ?")
            params.append(status)
            if status in ("resolved", "closed"):
                updates.append("resolved_at = ?")
                params.append(datetime.now(timezone.utc).isoformat())

        if not updates:
            return jsonify({"message": "No changes requested"}), 200

        params.append(defect_id)
        cursor.execute(f"UPDATE defects SET {', '.join(updates)} WHERE id = ?", params)

    return jsonify({"message": "Defect updated successfully"}), 200

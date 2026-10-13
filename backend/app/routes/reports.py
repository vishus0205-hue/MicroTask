import io
import csv
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, Response, g
from app.models.db import get_db
from app.utils.auth_middleware import jwt_required
from app.metrics.engine import MetricsEngine

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

def build_filter_clause(args):
    where = ["t.is_deleted = 0"]
    params = []

    date_from = args.get("date_from")
    date_to = args.get("date_to")
    status = args.get("status")
    priority = args.get("priority")
    assigned_to = args.get("assigned_to_id")

    if date_from:
        where.append("t.created_at >= ?")
        params.append(date_from)
    if date_to:
        where.append("t.created_at <= ?")
        params.append(date_to)
    if status:
        where.append("t.status = ?")
        params.append(status)
    if priority:
        where.append("t.priority = ?")
        params.append(priority)
    if assigned_to:
        if assigned_to == "unassigned":
            where.append("t.assigned_to_id IS NULL")
        else:
            where.append("t.assigned_to_id = ?")
            params.append(int(assigned_to))

    return " AND ".join(where), params

@reports_bp.route("/summary", methods=["GET"])
@jwt_required
def get_report_summary():
    where_sql, params = build_filter_clause(request.args)
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute(f"""
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
                COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
                COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_tasks,
                SUM(t.estimated_hours) as total_estimated_hours,
                SUM(t.actual_hours) as total_actual_hours
            FROM tasks t
            WHERE {where_sql}
        """, params)
        summary = dict(cursor.fetchone())

        # Overdue count in this filter
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(f"""
            SELECT COUNT(*) as overdue_count
            FROM tasks t
            WHERE {where_sql} AND t.status IN ('todo', 'in_progress') AND t.due_date IS NOT NULL AND t.due_date < ?
        """, params + [now_iso])
        summary["overdue_tasks"] = cursor.fetchone()["overdue_count"]

        # Defects count on filtered tasks
        cursor.execute(f"""
            SELECT COUNT(d.id) as defect_count
            FROM defects d
            JOIN tasks t ON d.task_id = t.id
            WHERE {where_sql}
        """, params)
        summary["total_defects"] = cursor.fetchone()["defect_count"]

    return jsonify({"summary": summary}), 200

@reports_bp.route("/tasks", methods=["GET"])
@jwt_required
def get_report_tasks():
    where_sql, params = build_filter_clause(request.args)
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute(f"""
            SELECT 
                t.id, t.title, t.priority, t.status, t.estimated_hours, t.actual_hours,
                t.created_at, t.started_at, t.due_date, t.completed_at,
                u_assignee.full_name as assigned_to_name,
                u_creator.full_name as created_by_name,
                (SELECT COUNT(*) FROM defects d WHERE d.task_id = t.id) as defect_count
            FROM tasks t
            LEFT JOIN users u_assignee ON t.assigned_to_id = u_assignee.id
            LEFT JOIN users u_creator ON t.created_by_id = u_creator.id
            WHERE {where_sql}
            ORDER BY t.created_at DESC
        """, params)
        rows = cursor.fetchall()

    tasks = [dict(r) for r in rows]
    return jsonify({"tasks": tasks, "count": len(tasks)}), 200

@reports_bp.route("/export-csv", methods=["GET"])
@jwt_required
def export_csv():
    where_sql, params = build_filter_clause(request.args)
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute(f"""
            SELECT 
                t.id,
                t.title,
                t.description,
                u_assignee.full_name as assignee,
                u_creator.full_name as creator,
                t.priority,
                t.status,
                t.estimated_hours,
                t.actual_hours,
                t.created_at,
                t.started_at,
                t.due_date,
                t.completed_at,
                (SELECT COUNT(*) FROM defects d WHERE d.task_id = t.id) as defect_count
            FROM tasks t
            LEFT JOIN users u_assignee ON t.assigned_to_id = u_assignee.id
            LEFT JOIN users u_creator ON t.created_by_id = u_creator.id
            WHERE {where_sql}
            ORDER BY t.id ASC
        """, params)
        rows = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header row
    writer.writerow([
        "Task ID", "Title", "Description", "Assignee", "Created By",
        "Priority", "Status", "Estimated Hours", "Actual Hours",
        "Created At", "Started At", "Due Date", "Completed At", "Defect Count"
    ])

    for r in rows:
        writer.writerow([
            r["id"],
            r["title"] or "",
            (r["description"] or "").replace("\n", " ").strip(),
            r["assignee"] or "Unassigned",
            r["creator"] or "System",
            r["priority"],
            r["status"],
            r["estimated_hours"] or 0.0,
            r["actual_hours"] or 0.0,
            r["created_at"] or "",
            r["started_at"] or "",
            r["due_date"] or "",
            r["completed_at"] or "",
            r["defect_count"] or 0
        ])

    csv_data = output.getvalue()
    filename = f"microtask_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

import os
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from app.models.db import get_db
from app.utils.auth_middleware import jwt_required, roles_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/settings", methods=["GET"])
@jwt_required
@roles_required("admin")
def get_settings():
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("SELECT key, value, description, updated_at FROM project_settings")
        rows = cursor.fetchall()

    settings = {r["key"]: {"value": r["value"], "description": r["description"], "updated_at": r["updated_at"]} for r in rows}
    return jsonify({"settings": settings}), 200

@admin_bp.route("/settings", methods=["POST"])
@jwt_required
@roles_required("admin")
def update_settings():
    data = request.get_json() or {}
    now_iso = datetime.now(timezone.utc).isoformat()
    db = get_db()

    with db.get_cursor() as cursor:
        for key, val in data.items():
            if isinstance(val, dict):
                val_str = str(val.get("value", ""))
                desc = val.get("description", "")
            else:
                val_str = str(val)
                desc = ""
            cursor.execute("""
                INSERT INTO project_settings (key, value, description, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
            """, (key, val_str, desc, now_iso))

    return jsonify({"message": "Settings updated successfully"}), 200

@admin_bp.route("/system-info", methods=["GET"])
@jwt_required
@roles_required("admin")
def get_system_info():
    db = get_db()
    stats = {}
    with db.get_cursor() as cursor:
        for tbl in ("users", "tasks", "task_status_history", "defects", "notifications"):
            cursor.execute(f"SELECT COUNT(*) as c FROM {tbl}")
            stats[tbl] = cursor.fetchone()["c"]

    db_path = db.db_path
    db_size = os.path.getsize(db_path) if db_path != ":memory:" and os.path.exists(db_path) else 0

    return jsonify({
        "system": {
            "app_name": "Micro-Task Management System",
            "version": "1.0.0",
            "database_engine": "SQLite 3",
            "database_size_bytes": db_size,
            "database_path": db_path,
            "table_counts": stats,
            "server_time_utc": datetime.now(timezone.utc).isoformat()
        }
    }), 200

@admin_bp.route("/seed", methods=["POST"])
@jwt_required
@roles_required("admin")
def trigger_seed():
    from scripts.seed_data import seed_database
    db = get_db()
    seed_database(db.get_connection())
    return jsonify({"message": "Database seeded successfully with realistic test records"}), 200

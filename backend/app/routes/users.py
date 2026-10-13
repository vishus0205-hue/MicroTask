from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from app.models.db import get_db
from app.utils.auth_middleware import (
    jwt_required, roles_required, hash_password
)

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

@users_bp.route("", methods=["GET"])
@jwt_required
def get_users():
    role_filter = request.args.get("role")
    active_only = request.args.get("active", "false").lower() == "true"

    query = "SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE 1=1"
    params = []

    if role_filter:
        query += " AND role = ?"
        params.append(role_filter)
    if active_only:
        query += " AND is_active = 1"

    query += " ORDER BY full_name ASC"

    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()

    users = [
        {
            "id": r["id"],
            "username": r["username"],
            "email": r["email"],
            "full_name": r["full_name"],
            "role": r["role"],
            "is_active": bool(r["is_active"]),
            "created_at": r["created_at"]
        }
        for r in rows
    ]
    return jsonify({"users": users, "total": len(users)}), 200

@users_bp.route("", methods=["POST"])
@jwt_required
@roles_required("admin")
def create_user():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "team_member")

    if not username or not email or not password or not full_name:
        return jsonify({"error": "All fields (username, email, password, full_name) are required"}), 400

    if role not in ("admin", "project_manager", "team_member"):
        return jsonify({"error": "Invalid role specified"}), 400

    db = get_db()
    with db.get_cursor() as cursor:
        # Check existing
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 409

        now_iso = datetime.now(timezone.utc).isoformat()
        pwd_hash = hash_password(password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)
        """, (username, email, pwd_hash, full_name, role, now_iso))
        new_id = cursor.lastrowid

    return jsonify({
        "message": "User created successfully",
        "user": {
            "id": new_id,
            "username": username,
            "email": email,
            "full_name": full_name,
            "role": role,
            "is_active": True,
            "created_at": now_iso
        }
    }), 201

@users_bp.route("/<int:user_id>", methods=["PUT"])
@jwt_required
@roles_required("admin")
def update_user(user_id):
    data = request.get_json() or {}
    db = get_db()

    with db.get_cursor() as cursor:
        cursor.execute("SELECT id, username, email FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        full_name = data.get("full_name")
        role = data.get("role")
        is_active = data.get("is_active")
        new_password = data.get("password")

        updates = []
        params = []
        if full_name:
            updates.append("full_name = ?")
            params.append(full_name.strip())
        if role:
            if role not in ("admin", "project_manager", "team_member"):
                return jsonify({"error": "Invalid role"}), 400
            updates.append("role = ?")
            params.append(role)
        if is_active is not None:
            updates.append("is_active = ?")
            params.append(1 if is_active else 0)
        if new_password:
            updates.append("password_hash = ?")
            params.append(hash_password(new_password))

        if not updates:
            return jsonify({"message": "No changes requested"}), 200

        params.append(user_id)
        cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)

    return jsonify({"message": "User updated successfully"}), 200

@users_bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required
@roles_required("admin")
def deactivate_user(user_id):
    if user_id == g.current_user["id"]:
        return jsonify({"error": "Cannot deactivate your own account"}), 400

    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("UPDATE users SET is_active = 0 WHERE id = ?", (user_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "User not found"}), 404

    return jsonify({"message": "User deactivated successfully"}), 200

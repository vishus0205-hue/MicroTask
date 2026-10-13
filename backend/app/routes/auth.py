from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from app.models.db import get_db
from app.utils.auth_middleware import (
    hash_password, verify_password, create_access_token, jwt_required
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username_or_email = data.get("username", "").strip()
    password = data.get("password", "")

    if not username_or_email or not password:
        return jsonify({"error": "Username/email and password are required"}), 400

    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("""
            SELECT id, username, email, password_hash, full_name, role, is_active
            FROM users
            WHERE username = ? OR email = ?
        """, (username_or_email, username_or_email))
        user = cursor.fetchone()

    if not user:
        return jsonify({"error": "Invalid username/email or password"}), 401

    if not user["is_active"]:
        return jsonify({"error": "User account is deactivated. Contact an administrator."}), 403

    if not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid username/email or password"}), 401

    token = create_access_token(user["id"], user["username"], user["role"])
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required
def me():
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("""
            SELECT id, username, email, full_name, role, is_active, created_at
            FROM users
            WHERE id = ?
        """, (g.current_user["id"],))
        user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "is_active": bool(user["is_active"]),
            "created_at": user["created_at"]
        }
    }), 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required
def logout():
    return jsonify({"message": "Successfully logged out"}), 200

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get("old_password", "")
    new_password = data.get("new_password", "")

    if not old_password or not new_password:
        return jsonify({"error": "Old and new password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (g.current_user["id"],))
        user = cursor.fetchone()
        if not user or not verify_password(old_password, user["password_hash"]):
            return jsonify({"error": "Current password is incorrect"}), 400

        new_hash = hash_password(new_password)
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, g.current_user["id"]))

    return jsonify({"message": "Password updated successfully"}), 200

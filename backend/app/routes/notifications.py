from flask import Blueprint, request, jsonify, g
from app.models.db import get_db
from app.utils.auth_middleware import jwt_required

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notifications_bp.route("", methods=["GET"])
@jwt_required
def get_notifications():
    user_id = g.current_user["id"]
    limit = min(50, int(request.args.get("limit", 20)))
    db = get_db()

    with db.get_cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) as unread_count
            FROM notifications
            WHERE user_id = ? AND is_read = 0
        """, (user_id,))
        unread_count = cursor.fetchone()["unread_count"]

        cursor.execute("""
            SELECT id, title, message, type, is_read, link, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()

    items = [
        {
            "id": r["id"],
            "title": r["title"],
            "message": r["message"],
            "type": r["type"],
            "is_read": bool(r["is_read"]),
            "link": r["link"],
            "created_at": r["created_at"]
        }
        for r in rows
    ]

    return jsonify({
        "notifications": items,
        "unread_count": unread_count
    }), 200

@notifications_bp.route("/<int:notif_id>/read", methods=["PUT"])
@jwt_required
def mark_read(notif_id):
    user_id = g.current_user["id"]
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("""
            UPDATE notifications
            SET is_read = 1
            WHERE id = ? AND user_id = ?
        """, (notif_id, user_id))
    return jsonify({"message": "Marked as read"}), 200

@notifications_bp.route("/read-all", methods=["PUT"])
@jwt_required
def mark_all_read():
    user_id = g.current_user["id"]
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("""
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = ? AND is_read = 0
        """, (user_id,))
    return jsonify({"message": "All marked as read"}), 200

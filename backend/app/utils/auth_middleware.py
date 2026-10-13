import functools
import jwt
from datetime import datetime, timedelta, timezone
from flask import request, jsonify, g, current_app
from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password: str) -> str:
    return generate_password_hash(password, method="scrypt")

def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)

def create_access_token(user_id: int, username: str, role: str, expires_in_hours: int = 24) -> str:
    secret_key = current_app.config.get("JWT_SECRET_KEY", "dev-jwt-secret-key")
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")

def decode_access_token(token: str) -> dict:
    secret_key = current_app.config.get("JWT_SECRET_KEY", "dev-jwt-secret-key")
    return jwt.decode(token, secret_key, algorithms=["HS256"])

def get_token_from_header() -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return None

def jwt_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Authorization token required", "code": "AUTH_TOKEN_MISSING"}), 401
        try:
            payload = decode_access_token(token)
            g.current_user = {
                "id": payload["user_id"],
                "username": payload["username"],
                "role": payload["role"]
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session token has expired. Please log in again.", "code": "TOKEN_EXPIRED"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authorization token.", "code": "TOKEN_INVALID"}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}", "code": "AUTH_FAILED"}), 401
        return f(*args, **kwargs)
    return decorated_function

def roles_required(*allowed_roles):
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, "current_user") or not g.current_user:
                return jsonify({"error": "Authentication required", "code": "UNAUTHORIZED"}), 401
            user_role = g.current_user.get("role")
            if user_role not in allowed_roles:
                return jsonify({
                    "error": f"Access forbidden. Required role: {', '.join(allowed_roles)}. Current role: {user_role}",
                    "code": "FORBIDDEN"
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

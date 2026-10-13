import pytest
import sqlite3
import os
import sys

# Ensure backend root is on sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app import create_app
from app.models.db import Database, SCHEMA_SQL
from app.utils.auth_middleware import hash_password, create_access_token

@pytest.fixture
def app():
    app = create_app("config.TestConfig")
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def db_conn():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    yield conn
    conn.close()

@pytest.fixture
def auth_headers(client, app):
    # Setup test users in app's db
    from app.models.db import get_db
    db = get_db()
    with db.get_cursor() as cursor:
        cursor.execute("DELETE FROM users")
        pwd = hash_password("Password123")
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
            VALUES ('admin_test', 'admin@test.com', ?, 'Admin Test', 'admin', 1, '2026-01-01T00:00:00Z')
        """, (pwd,))
        admin_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
            VALUES ('pm_test', 'pm@test.com', ?, 'PM Test', 'project_manager', 1, '2026-01-01T00:00:00Z')
        """, (pwd,))
        pm_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
            VALUES ('dev_test', 'dev@test.com', ?, 'Dev Test', 'team_member', 1, '2026-01-01T00:00:00Z')
        """, (pwd,))
        dev_id = cursor.lastrowid

    with app.app_context():
        admin_token = create_access_token(admin_id, "admin_test", "admin")
        pm_token = create_access_token(pm_id, "pm_test", "project_manager")
        dev_token = create_access_token(dev_id, "dev_test", "team_member")

    return {
        "admin": {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
        "pm": {"Authorization": f"Bearer {pm_token}", "Content-Type": "application/json"},
        "dev": {"Authorization": f"Bearer {dev_token}", "Content-Type": "application/json"},
        "admin_id": admin_id,
        "pm_id": pm_id,
        "dev_id": dev_id
    }

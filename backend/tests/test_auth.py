import json

def test_login_success(client, auth_headers):
    res = client.post("/api/auth/login", json={
        "username": "admin_test",
        "password": "Password123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "token" in data
    assert data["user"]["username"] == "admin_test"
    assert data["user"]["role"] == "admin"

def test_login_invalid_password(client, auth_headers):
    res = client.post("/api/auth/login", json={
        "username": "admin_test",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "error" in res.get_json()

def test_me_endpoint_authenticated(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers["admin"])
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["username"] == "admin_test"

def test_me_endpoint_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401

def test_role_based_access_admin_only(client, auth_headers):
    # Dev attempts to access admin users creation endpoint
    res = client.post("/api/users", headers=auth_headers["dev"], json={
        "username": "hacker", "email": "h@test.com", "password": "pass", "full_name": "Hacker", "role": "admin"
    })
    assert res.status_code == 403

    # Admin successfully accesses it
    res = client.post("/api/users", headers=auth_headers["admin"], json={
        "username": "newuser", "email": "new@test.com", "password": "pass", "full_name": "New User", "role": "team_member"
    })
    assert res.status_code == 201

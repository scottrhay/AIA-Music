# Auth Route Tests for AIAMusic
# ==============================
import json
from datetime import datetime, timedelta


def register(client, username="alice", email="alice@example.com", password="hunter22"):
    return client.post("/api/v1/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
    })


def test_register_creates_user(client):
    resp = register(client)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["user"]["username"] == "alice"
    assert "password_hash" not in body["user"]


def test_register_duplicate_username_rejected(client):
    register(client)
    resp = register(client, email="other@example.com")
    assert resp.status_code == 409


def test_register_missing_fields_rejected(client):
    resp = client.post("/api/v1/auth/register", json={"username": "bob"})
    assert resp.status_code == 400


def test_login_success(client):
    register(client)
    resp = client.post("/api/v1/auth/login", json={"username": "alice", "password": "hunter22"})
    assert resp.status_code == 200
    body = resp.get_json()
    assert "access_token" in body
    assert body["user"]["username"] == "alice"


def test_login_rejects_bad_password(client):
    register(client)
    resp = client.post("/api/v1/auth/login", json={"username": "alice", "password": "wrong"})
    assert resp.status_code == 401


def test_login_rejects_unknown_user(client):
    resp = client.post("/api/v1/auth/login", json={"username": "ghost", "password": "x"})
    assert resp.status_code == 401


def test_users_list_returns_only_id_and_username(client):
    register(client)
    login_resp = client.post("/api/v1/auth/login", json={"username": "alice", "password": "hunter22"})
    token = login_resp.get_json()["access_token"]

    resp = client.get("/api/v1/auth/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    users = resp.get_json()["users"]
    assert len(users) >= 1
    for u in users:
        assert set(u.keys()) == {"id", "username"}


def test_users_list_requires_auth(client):
    resp = client.get("/api/v1/auth/users")
    assert resp.status_code == 401


def test_exchange_code_rejects_bogus_code(client):
    resp = client.post("/api/v1/auth/exchange-code", json={"code": "does-not-exist"})
    assert resp.status_code == 401


def test_exchange_code_rejects_missing_code(client):
    resp = client.post("/api/v1/auth/exchange-code", json={})
    assert resp.status_code == 400


def test_exchange_code_succeeds_for_valid_code(client, app):
    from app import db
    from app.models import User, OAuthLoginCode

    with app.app_context():
        user = User(username="carol", email="carol@example.com", password_hash=None,
                    oauth_provider="microsoft", oauth_id="ms-123")
        db.session.add(user)
        db.session.commit()

        code = OAuthLoginCode(
            code="valid-test-code",
            user_id=user.id,
            expires_at=datetime.utcnow() + timedelta(minutes=2),
        )
        db.session.add(code)
        db.session.commit()

    resp = client.post("/api/v1/auth/exchange-code", json={"code": "valid-test-code"})
    assert resp.status_code == 200
    body = resp.get_json()
    assert "access_token" in body
    assert body["user"]["username"] == "carol"


def test_exchange_code_rejects_reused_code(client, app):
    from app import db
    from app.models import User, OAuthLoginCode

    with app.app_context():
        user = User(username="dave", email="dave@example.com", password_hash=None,
                    oauth_provider="microsoft", oauth_id="ms-456")
        db.session.add(user)
        db.session.commit()

        code = OAuthLoginCode(
            code="one-time-code",
            user_id=user.id,
            expires_at=datetime.utcnow() + timedelta(minutes=2),
        )
        db.session.add(code)
        db.session.commit()

    first = client.post("/api/v1/auth/exchange-code", json={"code": "one-time-code"})
    assert first.status_code == 200

    second = client.post("/api/v1/auth/exchange-code", json={"code": "one-time-code"})
    assert second.status_code == 401


def test_exchange_code_rejects_expired_code(client, app):
    from app import db
    from app.models import User, OAuthLoginCode

    with app.app_context():
        user = User(username="erin", email="erin@example.com", password_hash=None,
                    oauth_provider="microsoft", oauth_id="ms-789")
        db.session.add(user)
        db.session.commit()

        code = OAuthLoginCode(
            code="expired-code",
            user_id=user.id,
            expires_at=datetime.utcnow() - timedelta(minutes=1),
        )
        db.session.add(code)
        db.session.commit()

    resp = client.post("/api/v1/auth/exchange-code", json={"code": "expired-code"})
    assert resp.status_code == 401

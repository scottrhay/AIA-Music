"""
AIA Music — Pre-Deploy Smoke Tests
====================================
Tests run against live API container via HTTP.
Validates all key endpoints before VPS promotion.

IMPORTANT: These tests require a running server. They are NOT for CI.
Run manually before promoting to VPS:
  docker compose up -d
  API_BASE_URL=http://localhost:5000 pytest tests/test_smoke.py -v

CI uses tests/test_health.py (unit tests, no server required).
"""
import os
import socket
import urllib.request
import urllib.error
import json
import pytest

API = os.environ.get("API_BASE_URL", "http://localhost:5000").strip()
PREFIX = os.environ.get("API_PREFIX", "/api/v1").strip()


def _server_is_up(url: str = None) -> bool:
    """Check if the API server responds to HTTP requests."""
    import urllib.request
    check_url = url or f"{API}/api/v1/health"
    try:
        req = urllib.request.Request(check_url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False


# Skip all smoke tests when no server responds to HTTP
pytestmark = pytest.mark.skipif(
    not _server_is_up(),
    reason=f"No live server at {API} — run smoke tests manually against a running container"
)


def api_get(path):
    try:
        req = urllib.request.Request(f"{API}{path}")
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode())
            return resp.status, body
    except urllib.error.HTTPError as e:
        body = None
        try:
            body = json.loads(e.read().decode())
        except Exception:
            pass
        return e.code, body


def api_post(path, data, headers=None):
    payload = json.dumps(data).encode()
    try:
        req = urllib.request.Request(f"{API}{path}", data=payload, method="POST")
        req.add_header("Content-Type", "application/json")
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode())
            return resp.status, body
    except urllib.error.HTTPError as e:
        body = None
        try:
            body = json.loads(e.read().decode())
        except Exception:
            pass
        return e.code, body


class TestHealth:
    def test_health_endpoint(self):
        status, body = api_get("/health")
        assert status == 200
        assert body["status"] == "healthy"


class TestAuth:
    def test_login_rejects_bad_creds(self):
        status, _ = api_post(f"{PREFIX}/auth/login", {
            "email": "nonexistent@test.com",
            "password": "wrong"
        })
        assert status in (401, 422, 400)

    def test_register_validates(self):
        status, _ = api_post(f"{PREFIX}/auth/register", {})
        assert status in (400, 422)


class TestSongs:
    def test_songs_requires_auth(self):
        status, _ = api_get(f"{PREFIX}/songs")
        assert status in (401, 422)


class TestStyles:
    def test_styles_list(self):
        """Styles endpoint should be publicly accessible or return auth error."""
        status, _ = api_get(f"{PREFIX}/styles")
        assert status in (200, 401)


class TestPlaylists:
    def test_playlists_requires_auth(self):
        status, _ = api_get(f"{PREFIX}/playlists")
        assert status in (401, 422)


class TestErrorHandling:
    def test_404_on_unknown(self):
        status, _ = api_get(f"{PREFIX}/nonexistent-xyz")
        assert status in (404, 405)

    def test_malformed_json(self):
        try:
            req = urllib.request.Request(
                f"{API}{PREFIX}/auth/login",
                data=b"{{invalid",
                method="POST"
            )
            req.add_header("Content-Type", "application/json")
            with urllib.request.urlopen(req, timeout=10) as resp:
                assert resp.status >= 400
        except urllib.error.HTTPError as e:
            assert e.code >= 400

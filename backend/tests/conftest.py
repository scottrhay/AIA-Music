# Test Configuration for AIAMusic (Flask)
# ========================================

import os
import tempfile
import pytest

# Set test environment before imports
os.environ["FLASK_ENV"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret"
os.environ["SIGNUP_ACCESS_CODE"] = os.getenv("SIGNUP_ACCESS_CODE", "test-signup-code")
# audio_storage.py defaults to /app/data/audio, which doesn't exist (and
# isn't creatable) outside the production container — point it at a temp
# dir so route tests that touch storage (e.g. delete_song) don't fail on
# a filesystem permission error unrelated to the code under test.
os.environ["AUDIO_STORAGE_PATH"] = os.getenv("AUDIO_STORAGE_PATH", os.path.join(tempfile.gettempdir(), "aiamusic_test_audio"))
os.environ["DB_HOST"] = os.getenv("DB_HOST", "localhost")
os.environ["DB_PORT"] = os.getenv("DB_PORT", "5432")
os.environ["DB_NAME"] = os.getenv("DB_NAME", "testdb")
os.environ["DB_USER"] = os.getenv("DB_USER", "testuser")
os.environ["DB_PASSWORD"] = os.getenv("DB_PASSWORD", "testpass")


@pytest.fixture
def app():
    """Create test Flask application with a real (empty) schema per test.

    TestingConfig (config.py) points at an in-memory SQLite DB, not the
    Postgres used elsewhere — SQLAlchemy's postgresql ENUM type degrades to
    a plain VARCHAR+CHECK constraint on non-Postgres dialects, so
    db.create_all() works here without any Postgres-specific setup.
    """
    from app import create_app, db as _db

    flask_app = create_app("testing")
    flask_app.config["TESTING"] = True

    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()

# Test Configuration for AIAMusic (Flask)
# ========================================

import os
import pytest

# Set test environment before imports
os.environ["FLASK_ENV"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret"
os.environ["DB_HOST"] = os.getenv("DB_HOST", "localhost")
os.environ["DB_PORT"] = os.getenv("DB_PORT", "5432")
os.environ["DB_NAME"] = os.getenv("DB_NAME", "testdb")
os.environ["DB_USER"] = os.getenv("DB_USER", "testuser")
os.environ["DB_PASSWORD"] = os.getenv("DB_PASSWORD", "testpass")


@pytest.fixture
def app():
    """Create test Flask application."""
    # Import here to ensure env vars are set first
    try:
        from run import create_app
        app = create_app()
        app.config["TESTING"] = True
        yield app
    except ImportError:
        # If create_app doesn't exist, try direct import
        try:
            from app import app as flask_app
            flask_app.config["TESTING"] = True
            yield flask_app
        except ImportError:
            pytest.skip("Could not import Flask app")


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()

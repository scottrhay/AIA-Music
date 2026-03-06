# Health Check Tests for AIAMusic
# ================================


def test_health_endpoint(client):
    """Test /health returns 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_api_health_endpoint(client):
    """Test /api/v1/health if it exists."""
    response = client.get("/api/v1/health")
    # Accept 200 or 404 (endpoint may not exist)
    assert response.status_code in [200, 404]

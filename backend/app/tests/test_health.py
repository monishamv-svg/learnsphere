"""Root and health endpoint tests."""


class TestHealthEndpoints:
    def test_root(self, client):
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "LearnSphere" in data["message"]

    def test_health_check(self, client):
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("healthy", "degraded")
        assert "database" in data

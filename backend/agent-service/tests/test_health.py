from fastapi.testclient import TestClient

from aicare_agent_service.main import app


def test_health() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "UP",
        "service": "aicare-agent-service",
        "version": "0.1.0",
    }


def test_agent_health() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/agent/health")

    assert response.status_code == 200
    assert response.json()["status"] == "UP"

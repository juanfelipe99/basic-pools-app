from fastapi.testclient import TestClient


def test_create_user(client: TestClient) -> None:
    response = client.post("/users", json={"username": "  alice  "})

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "alice"
    assert body["id"] > 0
    assert body["created_at"].endswith("Z")


def test_create_user_duplicate_username(client: TestClient) -> None:
    client.post("/users", json={"username": "alice"})

    response = client.post("/users", json={"username": "alice"})

    assert response.status_code == 409


def test_create_user_invalid_username(client: TestClient) -> None:
    response = client.post("/users", json={"username": "ab"})

    assert response.status_code == 422


def test_get_user(client: TestClient) -> None:
    created = client.post("/users", json={"username": "alice"}).json()

    response = client.get(f"/users/{created['id']}")

    assert response.status_code == 200
    assert response.json()["username"] == "alice"


def test_get_user_not_found(client: TestClient) -> None:
    response = client.get("/users/999")

    assert response.status_code == 404

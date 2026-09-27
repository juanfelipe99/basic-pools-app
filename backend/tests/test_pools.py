from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi.testclient import TestClient

from tests.conftest import admin_headers

CreatePool = Callable[..., dict[str, Any]]


def future(days: int = 1) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


# ---------- Create ----------


def test_create_pool(create_pool: CreatePool) -> None:
    pool = create_pool()

    assert pool["name"] == "Favorite language"
    assert pool["share_code"]
    assert pool["admin_token"]
    assert pool["is_active"] is True
    assert pool["is_open"] is True
    assert pool["total_votes"] == 0
    assert [option["text"] for option in pool["options"]] == ["Python", "TypeScript"]
    assert [option["position"] for option in pool["options"]] == [0, 1]
    assert "admin_token_hash" not in pool


def test_create_pool_with_user(client: TestClient, create_pool: CreatePool) -> None:
    user = client.post("/users", json={"username": "alice"}).json()

    pool = create_pool(user_id=user["id"])

    assert pool["user_id"] == user["id"]


def test_create_pool_unknown_user(client: TestClient) -> None:
    response = client.post(
        "/pools",
        json={"name": "X", "user_id": 999, "options": [{"text": "A"}, {"text": "B"}]},
    )

    assert response.status_code == 422


def test_create_pool_requires_two_options(client: TestClient) -> None:
    response = client.post("/pools", json={"name": "X", "options": [{"text": "A"}]})

    assert response.status_code == 422


def test_create_pool_rejects_duplicate_options(client: TestClient) -> None:
    response = client.post(
        "/pools", json={"name": "X", "options": [{"text": "A"}, {"text": "a"}]}
    )

    assert response.status_code == 422


def test_create_pool_rejects_past_closes_at(client: TestClient) -> None:
    response = client.post(
        "/pools",
        json={
            "name": "X",
            "closes_at": "2000-01-01T00:00:00Z",
            "options": [{"text": "A"}, {"text": "B"}],
        },
    )

    assert response.status_code == 422


def test_create_pool_normalizes_closes_at_to_utc(create_pool: CreatePool) -> None:
    pool = create_pool(closes_at="2099-01-01T07:00:00-05:00")

    assert pool["closes_at"] == "2099-01-01T12:00:00Z"


# ---------- Read ----------


def test_get_pool(client: TestClient, create_pool: CreatePool) -> None:
    created = create_pool()

    response = client.get(f"/pools/{created['share_code']}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert "admin_token" not in body


def test_get_pool_not_found(client: TestClient) -> None:
    response = client.get("/pools/unknown")

    assert response.status_code == 404


# ---------- Update ----------


def test_update_pool(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.patch(
        f"/pools/{pool['share_code']}",
        json={"name": "New name", "closes_at": future()},
        headers=admin_headers(pool),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "New name"
    assert body["description"] == "Pick one"
    assert body["closes_at"] is not None


def test_update_pool_deactivate_closes_it(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.patch(
        f"/pools/{pool['share_code']}",
        json={"is_active": False},
        headers=admin_headers(pool),
    )

    assert response.json()["is_open"] is False


def test_update_pool_rejects_null_name(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.patch(
        f"/pools/{pool['share_code']}", json={"name": None}, headers=admin_headers(pool)
    )

    assert response.status_code == 422


def test_update_pool_rejects_past_closes_at(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.patch(
        f"/pools/{pool['share_code']}",
        json={"closes_at": "2000-01-01T00:00:00Z"},
        headers=admin_headers(pool),
    )

    assert response.status_code == 422


def test_update_pool_without_token(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.patch(f"/pools/{pool['share_code']}", json={"name": "Hacked"})

    assert response.status_code == 403


def test_update_pool_with_wrong_token(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    other = create_pool()

    response = client.patch(
        f"/pools/{pool['share_code']}", json={"name": "Hacked"}, headers=admin_headers(other)
    )

    assert response.status_code == 403


# ---------- Delete ----------


def test_delete_pool(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    client.post(f"/pools/{pool['share_code']}/votes", json={"option_id": pool["options"][0]["id"]})

    response = client.delete(f"/pools/{pool['share_code']}", headers=admin_headers(pool))

    assert response.status_code == 204
    assert client.get(f"/pools/{pool['share_code']}").status_code == 404


def test_delete_pool_without_token(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.delete(f"/pools/{pool['share_code']}")

    assert response.status_code == 403
    assert client.get(f"/pools/{pool['share_code']}").status_code == 200

from collections.abc import Callable
from typing import Any

from fastapi.testclient import TestClient

from tests.conftest import admin_headers

CreatePool = Callable[..., dict[str, Any]]


def options_url(pool: dict[str, Any], option_id: int | None = None) -> str:
    url = f"/pools/{pool['share_code']}/options"
    return url if option_id is None else f"{url}/{option_id}"


def vote(client: TestClient, pool: dict[str, Any]) -> None:
    response = client.post(
        f"/pools/{pool['share_code']}/votes", json={"option_id": pool["options"][0]["id"]}
    )
    assert response.status_code == 201


# ---------- Add ----------


def test_add_option(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.post(options_url(pool), json={"text": "Rust"}, headers=admin_headers(pool))

    assert response.status_code == 201
    body = response.json()
    assert body["text"] == "Rust"
    assert body["position"] == 2
    assert body["votes_count"] == 0


def test_add_option_duplicate(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.post(
        options_url(pool), json={"text": "python"}, headers=admin_headers(pool)
    )

    assert response.status_code == 409


def test_add_option_without_token(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.post(options_url(pool), json={"text": "Rust"})

    assert response.status_code == 403


def test_add_option_after_votes(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    vote(client, pool)

    response = client.post(options_url(pool), json={"text": "Rust"}, headers=admin_headers(pool))

    assert response.status_code == 409


# ---------- Update ----------


def test_update_option(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    option_id = pool["options"][0]["id"]

    response = client.patch(
        options_url(pool, option_id), json={"text": "Go"}, headers=admin_headers(pool)
    )

    assert response.status_code == 200
    assert response.json()["text"] == "Go"


def test_update_option_duplicate(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    option_id = pool["options"][0]["id"]

    response = client.patch(
        options_url(pool, option_id), json={"text": "TypeScript"}, headers=admin_headers(pool)
    )

    assert response.status_code == 409


def test_update_option_same_text_is_allowed(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    option_id = pool["options"][0]["id"]

    response = client.patch(
        options_url(pool, option_id), json={"text": "python"}, headers=admin_headers(pool)
    )

    assert response.status_code == 200


def test_update_option_from_another_pool(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    other = create_pool()

    response = client.patch(
        options_url(pool, other["options"][0]["id"]),
        json={"text": "Go"},
        headers=admin_headers(pool),
    )

    assert response.status_code == 404


def test_update_option_after_votes(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    vote(client, pool)

    response = client.patch(
        options_url(pool, pool["options"][0]["id"]),
        json={"text": "Go"},
        headers=admin_headers(pool),
    )

    assert response.status_code == 409


# ---------- Delete ----------


def test_delete_option(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool(options=[{"text": "A"}, {"text": "B"}, {"text": "C"}])
    option_id = pool["options"][2]["id"]

    response = client.delete(options_url(pool, option_id), headers=admin_headers(pool))

    assert response.status_code == 204
    remaining = client.get(f"/pools/{pool['share_code']}").json()["options"]
    assert [option["text"] for option in remaining] == ["A", "B"]


def test_delete_option_keeps_minimum(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.delete(
        options_url(pool, pool["options"][0]["id"]), headers=admin_headers(pool)
    )

    assert response.status_code == 409


def test_delete_option_not_found(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()

    response = client.delete(options_url(pool, 999), headers=admin_headers(pool))

    assert response.status_code == 404

from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Pool, Vote
from tests.conftest import FakeClientIP, admin_headers

CreatePool = Callable[..., dict[str, Any]]


def votes_url(pool: dict[str, Any]) -> str:
    return f"/pools/{pool['share_code']}/votes"


def test_cast_vote(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    option_id = pool["options"][1]["id"]

    response = client.post(votes_url(pool), json={"option_id": option_id})

    assert response.status_code == 201
    body = response.json()
    assert body["option_id"] == option_id
    assert body["pool_id"] == pool["id"]
    assert "ip_hash" not in body

    updated = client.get(f"/pools/{pool['share_code']}").json()
    assert [option["votes_count"] for option in updated["options"]] == [0, 1]
    assert updated["total_votes"] == 1


def test_same_ip_cannot_vote_twice(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    client.post(votes_url(pool), json={"option_id": pool["options"][0]["id"]})

    response = client.post(votes_url(pool), json={"option_id": pool["options"][1]["id"]})

    assert response.status_code == 409
    updated = client.get(f"/pools/{pool['share_code']}").json()
    assert updated["total_votes"] == 1


def test_different_ips_can_vote(
    client: TestClient, client_ip: FakeClientIP, create_pool: CreatePool
) -> None:
    pool = create_pool()
    option_id = pool["options"][0]["id"]

    for ip in ["203.0.113.1", "203.0.113.2", "2001:db8::1"]:
        client_ip.value = ip
        assert client.post(votes_url(pool), json={"option_id": option_id}).status_code == 201

    updated = client.get(f"/pools/{pool['share_code']}").json()
    assert updated["options"][0]["votes_count"] == 3


def test_same_ip_can_vote_in_different_pools(
    client: TestClient, create_pool: CreatePool
) -> None:
    first = create_pool()
    second = create_pool()

    assert client.post(votes_url(first), json={"option_id": first["options"][0]["id"]}).status_code == 201
    assert client.post(votes_url(second), json={"option_id": second["options"][0]["id"]}).status_code == 201


def test_raw_ip_is_not_stored(
    client: TestClient, db: Session, client_ip: FakeClientIP, create_pool: CreatePool
) -> None:
    pool = create_pool()
    client.post(votes_url(pool), json={"option_id": pool["options"][0]["id"]})

    stored = db.scalar(select(Vote))

    assert stored is not None
    assert client_ip.value not in stored.ip_hash
    assert len(stored.ip_hash) == 64


def test_vote_option_from_another_pool(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    other = create_pool()

    response = client.post(votes_url(pool), json={"option_id": other["options"][0]["id"]})

    assert response.status_code == 404


def test_vote_unknown_pool(client: TestClient) -> None:
    response = client.post("/pools/unknown/votes", json={"option_id": 1})

    assert response.status_code == 404


def test_vote_inactive_pool(client: TestClient, create_pool: CreatePool) -> None:
    pool = create_pool()
    client.patch(
        f"/pools/{pool['share_code']}", json={"is_active": False}, headers=admin_headers(pool)
    )

    response = client.post(votes_url(pool), json={"option_id": pool["options"][0]["id"]})

    assert response.status_code == 409


def test_vote_after_closes_at(client: TestClient, db: Session, create_pool: CreatePool) -> None:
    pool = create_pool()
    stored = db.scalar(select(Pool).where(Pool.share_code == pool["share_code"]))
    assert stored is not None
    stored.closes_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()

    response = client.post(votes_url(pool), json={"option_id": pool["options"][0]["id"]})

    assert response.status_code == 409
    assert client.get(f"/pools/{pool['share_code']}").json()["is_open"] is False

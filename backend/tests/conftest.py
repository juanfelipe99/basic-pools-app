import os

# Must be set before importing the app so settings never point at the real database
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["IP_HASH_SECRET"] = "test-secret"

from collections.abc import Callable, Generator  # noqa: E402
from typing import Any  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models  # noqa: E402, F401  (registers models on Base.metadata)
from app.db.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.routers.deps import get_client_ip  # noqa: E402

# StaticPool keeps a single connection so the in-memory DB survives across sessions
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class FakeClientIP:
    def __init__(self) -> None:
        self.value = "203.0.113.1"

    def __call__(self) -> str:
        return self.value


@pytest.fixture
def db() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client_ip() -> FakeClientIP:
    return FakeClientIP()


@pytest.fixture
def client(db: Session, client_ip: FakeClientIP) -> Generator[TestClient, None, None]:
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_client_ip] = client_ip
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def create_pool(client: TestClient) -> Callable[..., dict[str, Any]]:
    def _create_pool(**overrides: Any) -> dict[str, Any]:
        payload = {
            "name": "Favorite language",
            "description": "Pick one",
            "options": [{"text": "Python"}, {"text": "TypeScript"}],
            **overrides,
        }
        response = client.post("/pools", json=payload)
        assert response.status_code == 201, response.text
        return response.json()

    return _create_pool


def admin_headers(pool: dict[str, Any]) -> dict[str, str]:
    return {"X-Admin-Token": pool["admin_token"]}

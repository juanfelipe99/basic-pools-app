from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app import models  # noqa: F401  (registers models on Base.metadata)
from app.core.config import settings
from app.db.database import Base, engine
from app.routers import options, pools, users, votes


def ensure_sqlite_parent(url: str) -> None:
    if not url.startswith("sqlite:///"):
        return
    db_path = Path(url.removeprefix("sqlite:///"))
    if db_path.name:
        db_path.parent.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    ensure_sqlite_parent(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Basic Pools API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(pools.router)
app.include_router(options.router)
app.include_router(votes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _safe_static_file(full_path: str) -> Path | None:
    static_dir = settings.static_dir
    if static_dir is None:
        return None
    target = (static_dir / full_path).resolve()
    try:
        target.relative_to(static_dir.resolve())
    except ValueError:
        return None
    return target if target.is_file() else None


if settings.static_dir is not None:
    index_html = settings.static_dir / "index.html"

    @app.get("/")
    def frontend_index() -> FileResponse:
        return FileResponse(index_html)

    @app.get("/{full_path:path}")
    def frontend_spa(full_path: str) -> FileResponse:
        static_file = _safe_static_file(full_path)
        if static_file is not None:
            return FileResponse(static_file)
        return FileResponse(index_html)

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers models on Base.metadata)
from app.core.config import settings
from app.db.database import Base, engine
from app.routers import options, pools, users, votes


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
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

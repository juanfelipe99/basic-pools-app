from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from app.core.security import generate_admin_token, hash_admin_token
from app.models import Option, Pool, User
from app.models.pool import utc_now
from app.routers.deps import AdminPoolDep, DbSession, PoolDep
from app.schemas import PoolCreate, PoolCreated, PoolRead, PoolUpdate

router = APIRouter(prefix="/pools", tags=["pools"])


def ensure_future(closes_at: datetime | None) -> None:
    if closes_at is not None and closes_at <= utc_now():
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "closes_at must be in the future"
        )


@router.post("", response_model=PoolCreated, status_code=status.HTTP_201_CREATED)
def create_pool(data: PoolCreate, db: DbSession) -> PoolCreated:
    ensure_future(data.closes_at)
    if data.user_id is not None and db.get(User, data.user_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "User not found")

    admin_token = generate_admin_token()
    pool = Pool(
        name=data.name,
        description=data.description,
        closes_at=data.closes_at,
        user_id=data.user_id,
        admin_token_hash=hash_admin_token(admin_token),
        options=[
            Option(text=option.text, position=index)
            for index, option in enumerate(data.options)
        ],
    )
    db.add(pool)
    db.commit()
    db.refresh(pool)

    # The plain admin token is only ever returned in this response
    return PoolCreated(**PoolRead.model_validate(pool).model_dump(), admin_token=admin_token)


@router.get("/{share_code}", response_model=PoolRead)
def get_pool(pool: PoolDep) -> Pool:
    return pool


@router.patch("/{share_code}", response_model=PoolRead)
def update_pool(data: PoolUpdate, pool: AdminPoolDep, db: DbSession) -> Pool:
    changes = data.model_dump(exclude_unset=True)
    if "closes_at" in changes:
        ensure_future(changes["closes_at"])

    for field, value in changes.items():
        setattr(pool, field, value)
    db.commit()
    db.refresh(pool)
    return pool


@router.delete("/{share_code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pool(pool: AdminPoolDep, db: DbSession) -> None:
    db.delete(pool)
    db.commit()

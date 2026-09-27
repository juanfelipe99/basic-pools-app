from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_admin_token
from app.db.database import get_db
from app.models import Option, Pool

DbSession = Annotated[Session, Depends(get_db)]


def get_client_ip(request: Request) -> str:
    if request.client is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Could not determine client IP")
    return request.client.host


def get_pool_or_404(share_code: str, db: DbSession) -> Pool:
    pool = db.scalar(select(Pool).where(Pool.share_code == share_code))
    if pool is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pool not found")
    return pool


def get_admin_pool(
    pool: Annotated[Pool, Depends(get_pool_or_404)],
    x_admin_token: Annotated[str | None, Header()] = None,
) -> Pool:
    if x_admin_token is None or not verify_admin_token(x_admin_token, pool.admin_token_hash):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid admin token")
    return pool


ClientIP = Annotated[str, Depends(get_client_ip)]
PoolDep = Annotated[Pool, Depends(get_pool_or_404)]
AdminPoolDep = Annotated[Pool, Depends(get_admin_pool)]


def get_option_or_404(pool: Pool, option_id: int) -> Option:
    option = next((option for option in pool.options if option.id == option_id), None)
    if option is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Option not found")
    return option

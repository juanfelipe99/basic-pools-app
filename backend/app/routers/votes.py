from fastapi import APIRouter, HTTPException, status
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError

from app.core.security import hash_ip
from app.models import Option, Vote
from app.routers.deps import ClientIP, DbSession, PoolDep, get_option_or_404
from app.schemas import VoteCreate, VoteRead

router = APIRouter(prefix="/pools/{share_code}/votes", tags=["votes"])


@router.post("", response_model=VoteRead, status_code=status.HTTP_201_CREATED)
def cast_vote(data: VoteCreate, pool: PoolDep, client_ip: ClientIP, db: DbSession) -> Vote:
    if not pool.is_open:
        raise HTTPException(status.HTTP_409_CONFLICT, "Pool is closed")
    option = get_option_or_404(pool, data.option_id)

    vote = Vote(pool_id=pool.id, option_id=option.id, ip_hash=hash_ip(client_ip))
    db.add(vote)
    # Atomic SQL increment so concurrent votes don't overwrite each other
    db.execute(
        update(Option)
        .where(Option.id == option.id)
        .values(votes_count=Option.votes_count + 1)
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "This IP has already voted")
    db.refresh(vote)
    return vote

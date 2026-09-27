from fastapi import APIRouter, HTTPException, status

from app.models import Option, Pool
from app.routers.deps import AdminPoolDep, DbSession, get_option_or_404
from app.schemas import OptionCreate, OptionRead, OptionUpdate

router = APIRouter(prefix="/pools/{share_code}/options", tags=["options"])

MIN_OPTIONS = 2


def ensure_no_votes(pool: Pool) -> None:
    # Editing options after voting would change what people voted for
    if pool.has_votes:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Options cannot be changed once the pool has votes"
        )


def ensure_unique_text(pool: Pool, text: str, exclude_id: int | None = None) -> None:
    for option in pool.options:
        if option.id != exclude_id and option.text.casefold() == text.casefold():
            raise HTTPException(status.HTTP_409_CONFLICT, "Option already exists")


@router.post("", response_model=OptionRead, status_code=status.HTTP_201_CREATED)
def add_option(data: OptionCreate, pool: AdminPoolDep, db: DbSession) -> Option:
    ensure_no_votes(pool)
    ensure_unique_text(pool, data.text)

    next_position = max((option.position for option in pool.options), default=-1) + 1
    option = Option(text=data.text, position=next_position)
    pool.options.append(option)
    db.commit()
    db.refresh(option)
    return option


@router.patch("/{option_id}", response_model=OptionRead)
def update_option(
    option_id: int, data: OptionUpdate, pool: AdminPoolDep, db: DbSession
) -> Option:
    option = get_option_or_404(pool, option_id)
    ensure_no_votes(pool)
    changes = data.model_dump(exclude_unset=True)
    if "text" in changes:
        ensure_unique_text(pool, changes["text"], exclude_id=option.id)

    for field, value in changes.items():
        setattr(option, field, value)
    db.commit()
    db.refresh(option)
    return option


@router.delete("/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_option(option_id: int, pool: AdminPoolDep, db: DbSession) -> None:
    option = get_option_or_404(pool, option_id)
    ensure_no_votes(pool)
    if len(pool.options) <= MIN_OPTIONS:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"A pool needs at least {MIN_OPTIONS} options"
        )

    pool.options.remove(option)
    db.commit()

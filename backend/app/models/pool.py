import secrets
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_share_code() -> str:
    return secrets.token_urlsafe(8)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)

    pools: Mapped[list["Pool"]] = relationship(back_populates="user")


class Pool(TimestampMixin, Base):
    __tablename__ = "pools"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Public, non-sequential identifier used in the shareable link
    share_code: Mapped[str] = mapped_column(
        String(16), unique=True, index=True, default=generate_share_code
    )
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    closes_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None
    )

    user: Mapped["User | None"] = relationship(back_populates="pools")
    options: Mapped[list["Option"]] = relationship(
        back_populates="pool",
        cascade="all, delete-orphan",
        order_by="Option.position",
    )
    votes: Mapped[list["Vote"]] = relationship(
        back_populates="pool", cascade="all, delete-orphan"
    )


class Option(TimestampMixin, Base):
    __tablename__ = "options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pool_id: Mapped[int] = mapped_column(
        ForeignKey("pools.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(Integer, default=0)
    votes_count: Mapped[int] = mapped_column(Integer, default=0)

    pool: Mapped["Pool"] = relationship(back_populates="options")
    votes: Mapped[list["Vote"]] = relationship(back_populates="option")


class Vote(TimestampMixin, Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("pool_id", "ip_hash", name="uq_vote_pool_ip"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pool_id: Mapped[int] = mapped_column(
        ForeignKey("pools.id", ondelete="CASCADE"), index=True
    )
    option_id: Mapped[int] = mapped_column(
        ForeignKey("options.id", ondelete="CASCADE"), index=True
    )
    # SHA-256 hex digest of the voter's IP; raw IPs are never stored
    ip_hash: Mapped[str] = mapped_column(String(64))

    pool: Mapped["Pool"] = relationship(back_populates="votes")
    option: Mapped["Option"] = relationship(back_populates="votes")

from datetime import datetime, timezone
from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    field_validator,
)


def to_utc(value: datetime) -> datetime:
    # SQLite stores datetimes without offset, so every value must be normalized to UTC
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


UTCDatetime = Annotated[datetime, AfterValidator(to_utc)]


class InputSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class ReadSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    created_at: UTCDatetime
    updated_at: UTCDatetime


# ---------- User ----------


class UserCreate(InputSchema):
    username: str = Field(min_length=3, max_length=50)


class UserRead(ReadSchema):
    id: int
    username: str


# ---------- Option ----------


class OptionCreate(InputSchema):
    text: str = Field(min_length=1, max_length=200)


class OptionUpdate(InputSchema):
    text: str | None = Field(default=None, min_length=1, max_length=200)
    position: int | None = Field(default=None, ge=0)


class OptionRead(ReadSchema):
    id: int
    text: str
    position: int
    votes_count: int


# ---------- Pool ----------


class PoolCreate(InputSchema):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    closes_at: UTCDatetime | None = None
    user_id: int | None = None
    options: list[OptionCreate] = Field(min_length=2)

    @field_validator("options")
    @classmethod
    def options_must_be_unique(cls, options: list[OptionCreate]) -> list[OptionCreate]:
        texts = [option.text.casefold() for option in options]
        if len(texts) != len(set(texts)):
            raise ValueError("Options must be unique")
        return options


class PoolUpdate(InputSchema):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    is_active: bool | None = None
    closes_at: UTCDatetime | None = None


class PoolRead(ReadSchema):
    id: int
    share_code: str
    name: str
    description: str | None
    is_active: bool
    closes_at: UTCDatetime | None
    user_id: int | None
    options: list[OptionRead]

    @computed_field
    @property
    def total_votes(self) -> int:
        return sum(option.votes_count for option in self.options)


# ---------- Vote ----------


class VoteCreate(InputSchema):
    option_id: int


class VoteRead(ReadSchema):
    id: int
    pool_id: int
    option_id: int

import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, SmallInteger, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.common import TimestampMixin


class Rating(TimestampMixin, Base):
    __tablename__ = "ratings"
    __table_args__ = (
        CheckConstraint("score BETWEEN 1 AND 5", name="score"),
        Index("ix_ratings_novel", "novel_id", text("created_at DESC")),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    novel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("novels.id", ondelete="CASCADE"),
        primary_key=True,
    )
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    review_text: Mapped[str | None] = mapped_column(Text)


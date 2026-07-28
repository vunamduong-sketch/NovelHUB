import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.common import TimestampMixin, UUIDPrimaryKeyMixin


class Novel(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "novels"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'ongoing', 'hiatus', 'completed')",
            name="status",
        ),
        CheckConstraint(
            "visibility IN ('public', 'private')",
            name="visibility",
        ),
        CheckConstraint(
            "moderation_status IN ('pending', 'approved', 'rejected', 'hidden')",
            name="moderation",
        ),
        CheckConstraint(
            "view_count >= 0 AND follower_count >= 0 AND rating_count >= 0",
            name="counts",
        ),
        CheckConstraint("rating_average BETWEEN 0 AND 5", name="rating_average"),
        Index(
            "ix_novels_author",
            "author_id",
            text("updated_at DESC"),
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "ix_novels_catalog",
            "status",
            "category_id",
            text("published_at DESC"),
            postgresql_where=text(
                "deleted_at IS NULL "
                "AND visibility = 'public' "
                "AND moderation_status = 'approved'"
            ),
        ),
        Index(
            "ix_novels_search",
            text(
                "to_tsvector('simple', "
                "coalesce(title, '') || ' ' || coalesce(description, ''))"
            ),
            postgresql_using="gin",
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    category_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("categories.id", ondelete="SET NULL"),
    )
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    slug: Mapped[str] = mapped_column(String(280), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    cover_url: Mapped[str | None] = mapped_column(Text)
    language_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        server_default=text("'vi'"),
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'draft'"),
    )
    visibility: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'private'"),
    )
    moderation_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'approved'"),
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    view_count: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        server_default=text("0"),
    )
    follower_count: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        server_default=text("0"),
    )
    rating_count: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        server_default=text("0"),
    )
    rating_average: Mapped[Decimal] = mapped_column(
        Numeric(3, 2),
        nullable=False,
        server_default=text("0"),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


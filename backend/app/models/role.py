from sqlalchemy import CheckConstraint, Identity, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.common import CreatedAtMixin


class Role(CreatedAtMixin, Base):
    __tablename__ = "roles"
    __table_args__ = (
        CheckConstraint("code ~ '^[a-z][a-z0-9_]*$'", name="code_format"),
    )

    id: Mapped[int] = mapped_column(
        SmallInteger,
        Identity(always=True),
        primary_key=True,
    )
    code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


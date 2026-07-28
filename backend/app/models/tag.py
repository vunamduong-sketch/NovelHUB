from sqlalchemy import BigInteger, Identity, Index, String, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.common import CreatedAtMixin


class Tag(CreatedAtMixin, Base):
    __tablename__ = "tags"
    __table_args__ = (
        Index("uq_tags_name_ci", func.lower(text("name")), unique=True),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(always=True),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)


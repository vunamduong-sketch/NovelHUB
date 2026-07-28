"""Create the initial NovelHub database schema.

Revision ID: 20260728_0001
Revises:
Create Date: 2026-07-28
"""
from collections.abc import Sequence

from alembic import op
from sqlalchemy import text

from app.database.base import Base
import app.models  # noqa: F401 - registers all tables before create_all


revision: str = "20260728_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


UPDATED_AT_TABLES = (
    "users",
    "categories",
    "novels",
    "chapters",
    "ratings",
    "bookmarks",
    "comments",
)


def upgrade() -> None:
    bind = op.get_bind()
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    Base.metadata.create_all(bind=bind, checkfirst=False)

    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$
        """
    )
    for table_name in UPDATED_AT_TABLES:
        op.execute(
            f"""
            CREATE TRIGGER trg_{table_name}_updated_at
            BEFORE UPDATE ON {table_name}
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
            """
        )

    bind.execute(
        text(
            """
            INSERT INTO roles (code, name, description) VALUES
                ('reader', 'Reader', 'Đọc và tương tác với truyện'),
                ('author', 'Author', 'Sáng tác và xuất bản truyện'),
                ('admin', 'Administrator', 'Quản trị hệ thống')
            """
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    for table_name in reversed(UPDATED_AT_TABLES):
        op.execute(f"DROP TRIGGER IF EXISTS trg_{table_name}_updated_at ON {table_name}")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at()")
    Base.metadata.drop_all(bind=bind, checkfirst=True)


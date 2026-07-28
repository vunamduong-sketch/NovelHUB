"""Add summary to chapters.

Revision ID: 20260728_0002
Revises: 20260728_0001
Create Date: 2026-07-28
"""
from collections.abc import Sequence

from alembic import op


revision: str = "20260728_0002"
down_revision: str | None = "20260728_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # IF NOT EXISTS also supports a fresh installation because the initial
    # metadata-based migration sees the current Chapter model.
    op.execute("ALTER TABLE chapters ADD COLUMN IF NOT EXISTS summary TEXT")


def downgrade() -> None:
    op.execute("ALTER TABLE chapters DROP COLUMN IF EXISTS summary")


"""add course additional_instructors

Revision ID: b2c3d4e5f6a7
Revises: f7g8h9i0j1k2
Create Date: 2026-06-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "f7g8h9i0j1k2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column(
            "additional_instructors",
            sa.Text(),
            nullable=True
        )
    )


def downgrade() -> None:
    op.drop_column("courses", "additional_instructors")

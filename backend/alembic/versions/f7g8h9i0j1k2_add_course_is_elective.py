"""add course is_elective

Revision ID: f7g8h9i0j1k2
Revises: a1b2c3d4e5f6
Create Date: 2026-06-04 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7g8h9i0j1k2"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column(
            "is_elective",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )

    op.execute(
        "UPDATE courses SET is_elective = TRUE "
        "WHERE course_code LIKE 'ELC%'"
    )


def downgrade() -> None:
    op.drop_column("courses", "is_elective")

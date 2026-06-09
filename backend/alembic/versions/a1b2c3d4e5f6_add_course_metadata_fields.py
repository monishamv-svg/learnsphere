"""add course metadata fields

Revision ID: a1b2c3d4e5f6
Revises: c36ecf04446a
Create Date: 2026-06-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "c36ecf04446a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column(
            "semester",
            sa.Integer(),
            nullable=False,
            server_default="1"
        )
    )
    op.add_column(
        "courses",
        sa.Column(
            "department",
            sa.String(),
            nullable=False,
            server_default="Computer Science"
        )
    )
    op.add_column(
        "courses",
        sa.Column(
            "instructor_name",
            sa.String(),
            nullable=True
        )
    )
    op.add_column(
        "courses",
        sa.Column(
            "max_capacity",
            sa.Integer(),
            nullable=False,
            server_default="40"
        )
    )


def downgrade() -> None:
    op.drop_column("courses", "max_capacity")
    op.drop_column("courses", "instructor_name")
    op.drop_column("courses", "department")
    op.drop_column("courses", "semester")

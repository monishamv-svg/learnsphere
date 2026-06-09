"""add enrollment timetable_id

Revision ID: c7d8e9f0a1b2
Revises: b2c3d4e5f6a7
Create Date: 2026-06-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "enrollments",
        sa.Column(
            "timetable_id",
            sa.Integer(),
            nullable=True
        )
    )
    op.create_foreign_key(
        "fk_enrollments_timetable_id",
        "enrollments",
        "timetables",
        ["timetable_id"],
        ["id"]
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_enrollments_timetable_id",
        "enrollments",
        type_="foreignkey"
    )
    op.drop_column("enrollments", "timetable_id")

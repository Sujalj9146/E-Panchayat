"""store uploaded document files in the database

Revision ID: c8d2e4f6a1b3
Revises: a3c7e1f9b2d4
Create Date: 2026-11-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c8d2e4f6a1b3'
down_revision: Union[str, None] = 'a3c7e1f9b2d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('citizen_documents', sa.Column('file_data', sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    op.drop_column('citizen_documents', 'file_data')

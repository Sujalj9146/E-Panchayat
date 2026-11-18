"""add users.phone and sms_notifications

Revision ID: a3c7e1f9b2d4
Revises: f1b8d4e6a2c0
Create Date: 2026-11-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a3c7e1f9b2d4'
down_revision: Union[str, None] = 'f1b8d4e6a2c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True))
    op.create_table(
        'sms_notifications',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column(
            'grievance_id', sa.String(length=64),
            sa.ForeignKey('grievances.id', ondelete='CASCADE'), nullable=False,
        ),
        sa.Column('event', sa.String(length=30), nullable=False),
        sa.Column('phone_masked', sa.String(length=30)),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('provider', sa.String(length=30), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('provider_message_id', sa.String(length=120)),
        sa.Column('error', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_sms_notifications_grievance_id', 'sms_notifications', ['grievance_id'])
    op.create_index('ix_sms_notifications_created_at', 'sms_notifications', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_sms_notifications_created_at', table_name='sms_notifications')
    op.drop_index('ix_sms_notifications_grievance_id', table_name='sms_notifications')
    op.drop_table('sms_notifications')
    op.drop_column('users', 'phone')

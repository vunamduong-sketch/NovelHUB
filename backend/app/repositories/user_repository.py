import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_active_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.session.scalar(
            select(User).where(
                User.id == user_id,
                User.status == "active",
                User.deleted_at.is_(None),
            )
        )

    def get_user_by_username(self, username: str) -> User | None:
        return self.session.scalar(
            select(User).where(
                func.lower(User.username) == username.lower(),
                User.deleted_at.is_(None),
            )
        )

    def get_role_codes(self, user_id: uuid.UUID) -> list[str]:
        return list(
            self.session.scalars(
                select(Role.code)
                .join(UserRole, UserRole.role_id == Role.id)
                .where(UserRole.user_id == user_id)
            )
        )

    def revoke_active_refresh_tokens(self, user_id: uuid.UUID) -> int:
        result = self.session.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        ).update(
            {RefreshToken.revoked_at: datetime.now(timezone.utc)},
            synchronize_session=False,
        )
        return int(result or 0)

    def save(self) -> None:
        self.session.commit()

    def rollback(self) -> None:
        self.session.rollback()

    def refresh(self, user: User) -> None:
        self.session.refresh(user)

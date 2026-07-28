import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole


class AuthRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.session.get(User, user_id)

    def get_user_by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(func.lower(User.email) == email.lower(), User.deleted_at.is_(None)))

    def get_user_by_username(self, username: str) -> User | None:
        return self.session.scalar(select(User).where(func.lower(User.username) == username.lower(), User.deleted_at.is_(None)))

    def get_user_by_identity(self, identity: str) -> User | None:
        return self.get_user_by_email(identity) if "@" in identity else self.get_user_by_username(identity)

    def get_role_codes(self, user_id: uuid.UUID) -> list[str]:
        return list(self.session.scalars(select(Role.code).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user_id)))

    def get_reader_role(self) -> Role | None:
        return self.session.scalar(select(Role).where(Role.code == "reader"))

    def add_user(self, user: User, reader_role: Role) -> None:
        self.session.add(user)
        self.session.flush()
        self.session.add(UserRole(user_id=user.id, role_id=reader_role.id))

    def add_refresh_token(self, refresh_token: RefreshToken) -> None:
        self.session.add(refresh_token)

    def get_active_refresh_token(self, token_hash: str, now: datetime) -> RefreshToken | None:
        return self.session.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash, RefreshToken.revoked_at.is_(None), RefreshToken.expires_at > now))

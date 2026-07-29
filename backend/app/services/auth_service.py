from datetime import datetime, timedelta, timezone
import uuid

from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.core.security import (create_access_token, create_refresh_token, create_reset_token,
                               decode_token, hash_password, hash_token, verify_password)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.auth_repository import AuthRepository


class AuthenticationError(Exception): pass
class ConflictError(Exception): pass
class ResetTokenError(Exception): pass


class AuthService:
    def __init__(self, repository: AuthRepository, settings: Settings) -> None:
        self.repository = repository
        self.settings = settings

    def register(self, email: str, username: str, password: str) -> User:
        if self.repository.get_user_by_email(email):
            raise ConflictError("Email is already registered")
        if self.repository.get_user_by_username(username):
            raise ConflictError("Username is already registered")
        reader_role = self.repository.get_reader_role()
        if reader_role is None:
            raise RuntimeError("The default reader role has not been seeded")
        user = User(email=email, username=username, password_hash=hash_password(password))
        try:
            self.repository.add_user(user, reader_role)
            self.repository.session.commit()
        except IntegrityError as exc:
            self.repository.session.rollback()
            raise ConflictError("Email or username is already registered") from exc
        self.repository.session.refresh(user)
        return user

    def login(self, identity: str, password: str, user_agent: str | None, ip_address: str | None) -> tuple[str, str, datetime, User, list[str]]:
        user = self.repository.get_user_by_identity(identity.strip().lower())
        if user is None or user.status != "active" or not verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid credentials")
        roles = self.repository.get_role_codes(user.id)
        access_token, expires_at = create_access_token(str(user.id), roles, self.settings)
        refresh_token = self._store_refresh_token(user.id, user_agent, ip_address)
        user.last_login_at = datetime.now(timezone.utc)
        self.repository.session.commit()
        return access_token, refresh_token, expires_at, user, roles

    def refresh(self, raw_token: str, user_agent: str | None, ip_address: str | None) -> tuple[str, str, datetime, User, list[str]]:
        stored_token = self.repository.get_active_refresh_token(hash_token(raw_token), datetime.now(timezone.utc))
        if stored_token is None:
            raise AuthenticationError("Invalid or expired refresh token")
        user = self.repository.get_user_by_id(stored_token.user_id)
        if user is None or user.status != "active" or user.deleted_at is not None:
            raise AuthenticationError("User is not available")
        stored_token.revoked_at = datetime.now(timezone.utc)
        replacement = self._store_refresh_token(user.id, user_agent, ip_address)
        self.repository.session.flush()
        stored_token.replaced_by_id = self.repository.get_active_refresh_token(hash_token(replacement), datetime.now(timezone.utc)).id
        roles = self.repository.get_role_codes(user.id)
        access_token, expires_at = create_access_token(str(user.id), roles, self.settings)
        self.repository.session.commit()
        return access_token, replacement, expires_at, user, roles

    def logout(self, raw_token: str) -> None:
        stored_token = self.repository.get_active_refresh_token(hash_token(raw_token), datetime.now(timezone.utc))
        if stored_token is not None:
            stored_token.revoked_at = datetime.now(timezone.utc)
            self.repository.session.commit()

    def request_password_reset(self, email: str) -> str | None:
        user = self.repository.get_user_by_email(email)
        if user is None or user.status != "active":
            return None
        return create_reset_token(str(user.id), self.settings)

    def confirm_password_reset(self, token: str, new_password: str) -> None:
        try:
            payload = decode_token(token, "password_reset", self.settings)
        except ValueError as exc:
            raise ResetTokenError("Invalid or expired reset token") from exc
        try:
            user = self.repository.get_user_by_id(uuid.UUID(payload["sub"]))
        except ValueError as exc:
            raise ResetTokenError("Invalid reset token") from exc
        if user is None or user.status != "active" or user.deleted_at is not None:
            raise ResetTokenError("Invalid reset token")
        issued_at = datetime.fromtimestamp(float(payload["issued_at_exact"]), tz=timezone.utc)
        if user.updated_at > issued_at:
            raise ResetTokenError("Reset token has already been used or superseded")
        user.password_hash = hash_password(new_password)
        self.repository.session.query(RefreshToken).filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)).update({RefreshToken.revoked_at: datetime.now(timezone.utc)}, synchronize_session=False)
        self.repository.session.commit()

    def _store_refresh_token(self, user_id, user_agent: str | None, ip_address: str | None) -> str:
        raw_token = create_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=self.settings.refresh_token_expire_days)
        self.repository.add_refresh_token(RefreshToken(user_id=user_id, token_hash=hash_token(raw_token), expires_at=expires_at, user_agent=user_agent, ip_address=ip_address))
        return raw_token

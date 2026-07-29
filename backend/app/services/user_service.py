from sqlalchemy.exc import IntegrityError
from fastapi import UploadFile

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.utils.avatar_storage import AvatarStorage, AvatarStorageError


class UserNotFoundError(Exception):
    pass


class ProfileConflictError(Exception):
    pass


class PasswordChangeError(Exception):
    pass


class AvatarUpdateError(Exception):
    pass


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def get_my_profile(self, current_user: User) -> tuple[User, list[str]]:
        user = self.repository.get_active_user_by_id(current_user.id)
        if user is None:
            raise UserNotFoundError("User is not available")
        roles = self.repository.get_role_codes(user.id)
        return user, roles

    def update_my_profile(
        self,
        current_user: User,
        *,
        display_name: str | None,
        bio: str | None,
        username: str | None,
    ) -> tuple[User, list[str]]:
        user = self.repository.get_active_user_by_id(current_user.id)
        if user is None:
            raise UserNotFoundError("User is not available")

        if username is not None and username != user.username:
            existing = self.repository.get_user_by_username(username)
            if existing is not None and existing.id != user.id:
                raise ProfileConflictError("Username is already registered")
            user.username = username

        if display_name is not None:
            user.display_name = display_name
        if bio is not None:
            user.bio = bio

        try:
            self.repository.save()
        except IntegrityError as exc:
            self.repository.rollback()
            raise ProfileConflictError("Profile update conflict") from exc

        self.repository.refresh(user)
        roles = self.repository.get_role_codes(user.id)
        return user, roles

    def change_my_password(self, current_user: User, current_password: str, new_password: str) -> None:
        user = self.repository.get_active_user_by_id(current_user.id)
        if user is None:
            raise UserNotFoundError("User is not available")
        if not verify_password(current_password, user.password_hash):
            raise PasswordChangeError("Current password is incorrect")

        user.password_hash = hash_password(new_password)
        self.repository.revoke_active_refresh_tokens(user.id)
        self.repository.save()

    def update_my_avatar(self, current_user: User, upload: UploadFile, storage: AvatarStorage) -> User:
        user = self.repository.get_active_user_by_id(current_user.id)
        if user is None:
            raise UserNotFoundError("User is not available")

        old_avatar_url = user.avatar_url
        new_avatar_url, new_avatar_path = storage.save_upload(str(user.id), upload)
        user.avatar_url = new_avatar_url
        try:
            self.repository.save()
        except IntegrityError as exc:
            self.repository.rollback()
            storage.delete_file(new_avatar_path)
            raise AvatarUpdateError("Failed to update avatar") from exc
        except Exception as exc:
            self.repository.rollback()
            storage.delete_file(new_avatar_path)
            raise AvatarStorageError("Failed to update avatar") from exc

        self.repository.refresh(user)
        storage.delete_if_managed_url(old_avatar_url)
        return user

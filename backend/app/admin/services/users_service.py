import uuid

from app.admin.repositories.users_repository import AdminUsersRepository
from app.models.user import User


class AdminUserNotFoundError(Exception):
    pass


class AdminRoleNotFoundError(Exception):
    pass


class AdminSelfRoleChangeError(Exception):
    pass


class AdminUsersService:
    def __init__(self, repository: AdminUsersRepository) -> None:
        self.repository = repository

    def list_users(
        self,
        *,
        search: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[tuple[User, list[str]]], int]:
        users, total = self.repository.list_users(
            search=self._normalize_search(search), page=page, page_size=page_size
        )
        roles = self.repository.get_role_codes_by_user_ids([user.id for user in users])
        return [(user, roles[user.id]) for user in users], total

    def get_user(self, user_id: uuid.UUID) -> tuple[User, list[str]]:
        user = self.repository.get_user(user_id)
        if user is None:
            raise AdminUserNotFoundError("User not found")
        roles = self.repository.get_role_codes_by_user_ids([user.id])
        return user, roles[user.id]

    def update_user_roles(
        self,
        *,
        user_id: uuid.UUID,
        role_codes: list[str],
        current_admin: User,
    ) -> tuple[User, list[str]]:
        user = self.repository.get_user(user_id)
        if user is None:
            raise AdminUserNotFoundError("User not found")
        if user.id == current_admin.id:
            raise AdminSelfRoleChangeError("Admins cannot change their own roles")

        roles = self.repository.get_roles_by_codes(role_codes)
        roles_by_code = {role.code: role for role in roles}
        unknown = [code for code in role_codes if code not in roles_by_code]
        if unknown:
            raise AdminRoleNotFoundError(
                f"Unknown role code(s): {', '.join(unknown)}"
            )
        ordered_roles = [roles_by_code[code] for code in role_codes]
        self.repository.replace_user_roles(user.id, ordered_roles, current_admin.id)
        return user, role_codes

    @staticmethod
    def _normalize_search(search: str | None) -> str | None:
        if search is None:
            return None
        normalized = search.strip()
        return normalized or None

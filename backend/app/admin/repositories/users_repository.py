import uuid

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole


class AdminUsersRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_users(
        self,
        *,
        search: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[User], int]:
        filters = [User.deleted_at.is_(None)]
        if search:
            pattern = f"%{search}%"
            filters.append(
                or_(
                    User.email.ilike(pattern),
                    User.username.ilike(pattern),
                    User.display_name.ilike(pattern),
                )
            )

        total = self.session.scalar(
            select(func.count()).select_from(User).where(*filters)
        ) or 0
        users = list(
            self.session.scalars(
                select(User)
                .where(*filters)
                .order_by(User.created_at.desc(), User.id)
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return users, int(total)

    def get_user(self, user_id: uuid.UUID) -> User | None:
        return self.session.scalar(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )

    def get_role_codes_by_user_ids(
        self, user_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, list[str]]:
        result = {user_id: [] for user_id in user_ids}
        if not user_ids:
            return result
        rows = self.session.execute(
            select(UserRole.user_id, Role.code)
            .join(Role, Role.id == UserRole.role_id)
            .where(UserRole.user_id.in_(user_ids))
            .order_by(Role.code)
        )
        for user_id, role_code in rows:
            result[user_id].append(role_code)
        return result

    def get_roles_by_codes(self, codes: list[str]) -> list[Role]:
        return list(self.session.scalars(select(Role).where(Role.code.in_(codes))))

    def replace_user_roles(
        self,
        user_id: uuid.UUID,
        roles: list[Role],
        assigned_by: uuid.UUID,
    ) -> None:
        self.session.execute(delete(UserRole).where(UserRole.user_id == user_id))
        self.session.add_all(
            UserRole(user_id=user_id, role_id=role.id, assigned_by=assigned_by)
            for role in roles
        )
        self.session.commit()

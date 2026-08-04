import uuid
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.admin.services.users_service import (
    AdminRoleNotFoundError,
    AdminSelfRoleChangeError,
    AdminUserNotFoundError,
    AdminUsersService,
)


def test_list_users_normalizes_search_and_attaches_roles() -> None:
    user_id = uuid.uuid4()
    user = SimpleNamespace(id=user_id)
    repository = Mock()
    repository.list_users.return_value = ([user], 1)
    repository.get_role_codes_by_user_ids.return_value = {user_id: ["reader"]}

    items, total = AdminUsersService(repository).list_users(
        search="  reader  ",
        page=2,
        page_size=10,
    )

    repository.list_users.assert_called_once_with(
        search="reader",
        page=2,
        page_size=10,
    )
    assert items == [(user, ["reader"])]
    assert total == 1


def test_get_user_reports_missing_user() -> None:
    repository = Mock()
    repository.get_user.return_value = None

    with pytest.raises(AdminUserNotFoundError):
        AdminUsersService(repository).get_user(uuid.uuid4())


def test_update_roles_rejects_self_role_change() -> None:
    admin_id = uuid.uuid4()
    admin = SimpleNamespace(id=admin_id)
    repository = Mock()
    repository.get_user.return_value = admin

    with pytest.raises(AdminSelfRoleChangeError):
        AdminUsersService(repository).update_user_roles(
            user_id=admin_id,
            role_codes=["admin"],
            current_admin=admin,
        )

    repository.replace_user_roles.assert_not_called()


def test_update_roles_replaces_roles_in_request_order() -> None:
    admin = SimpleNamespace(id=uuid.uuid4())
    user = SimpleNamespace(id=uuid.uuid4())
    author_role = SimpleNamespace(id=2, code="author")
    reader_role = SimpleNamespace(id=1, code="reader")
    repository = Mock()
    repository.get_user.return_value = user
    repository.get_roles_by_codes.return_value = [author_role, reader_role]

    result_user, role_codes = AdminUsersService(repository).update_user_roles(
        user_id=user.id,
        role_codes=["reader", "author"],
        current_admin=admin,
    )

    repository.replace_user_roles.assert_called_once_with(
        user.id,
        [reader_role, author_role],
        admin.id,
    )
    assert result_user is user
    assert role_codes == ["reader", "author"]


def test_update_roles_rejects_unknown_role() -> None:
    admin = SimpleNamespace(id=uuid.uuid4())
    user = SimpleNamespace(id=uuid.uuid4())
    repository = Mock()
    repository.get_user.return_value = user
    repository.get_roles_by_codes.return_value = []

    with pytest.raises(AdminRoleNotFoundError, match="unknown"):
        AdminUsersService(repository).update_user_roles(
            user_id=user.id,
            role_codes=["unknown"],
            current_admin=admin,
        )

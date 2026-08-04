import uuid
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from sqlalchemy.exc import IntegrityError

from app.admin.services.categories_service import (
    AdminCategoriesService,
    AdminCategoryConflictError,
    AdminCategoryNotFoundError,
)
from app.admin.services.novels_service import (
    AdminNovelNotFoundError,
    AdminNovelsService,
)
from app.admin.services.tags_service import (
    AdminTagConflictError,
    AdminTagNotFoundError,
    AdminTagsService,
)
from app.admin.services.users_service import (
    AdminRoleNotFoundError,
    AdminSelfRoleChangeError,
    AdminUserNotFoundError,
    AdminUsersService,
)
from app.models.category import Category
from app.models.tag import Tag


def test_users_service_normalizes_search_and_attaches_roles() -> None:
    user_id = uuid.uuid4()
    user = SimpleNamespace(id=user_id)
    repository = Mock()
    repository.list_users.return_value = ([user], 1)
    repository.get_role_codes_by_user_ids.return_value = {user_id: ["reader"]}

    items, total = AdminUsersService(repository).list_users(
        search="  reader  ", page=2, page_size=10
    )

    repository.list_users.assert_called_once_with(search="reader", page=2, page_size=10)
    assert items == [(user, ["reader"])]
    assert total == 1


def test_users_service_reports_missing_user() -> None:
    repository = Mock()
    repository.get_user.return_value = None

    with pytest.raises(AdminUserNotFoundError):
        AdminUsersService(repository).get_user(uuid.uuid4())


def test_users_service_rejects_self_role_change() -> None:
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


def test_users_service_validates_and_replaces_roles_in_request_order() -> None:
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
        user.id, [reader_role, author_role], admin.id
    )
    assert result_user is user
    assert role_codes == ["reader", "author"]


def test_users_service_rejects_unknown_role() -> None:
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


def test_novels_service_normalizes_search_and_forwards_filters() -> None:
    record = SimpleNamespace()
    repository = Mock()
    repository.list_novels.return_value = ([record], 1)

    result = AdminNovelsService(repository).list_novels(
        search="  fantasy  ",
        status="ongoing",
        visibility="private",
        moderation_status="pending",
        page=1,
        page_size=20,
    )

    repository.list_novels.assert_called_once_with(
        search="fantasy",
        status="ongoing",
        visibility="private",
        moderation_status="pending",
        page=1,
        page_size=20,
    )
    assert result == ([record], 1)


def test_novels_service_reports_missing_novel() -> None:
    repository = Mock()
    repository.get_novel.return_value = None

    with pytest.raises(AdminNovelNotFoundError):
        AdminNovelsService(repository).get_novel(uuid.uuid4())


def test_categories_service_creates_category_and_generates_vietnamese_slug() -> None:
    repository = Mock()
    repository.name_exists.return_value = False
    repository.slug_exists.return_value = False

    category = AdminCategoriesService(repository).create_category(
        name="Khoa học viễn tưởng",
        slug=None,
        description="Mô tả",
        is_active=True,
    )

    assert category.slug == "khoa-hoc-vien-tuong"
    assert category.name == "Khoa học viễn tưởng"
    repository.add.assert_called_once_with(category)
    repository.save.assert_called_once()
    repository.refresh.assert_called_once_with(category)


def test_categories_service_updates_only_requested_fields() -> None:
    category = Category(
        id=7,
        name="Fantasy",
        slug="fantasy",
        description="Old",
        is_active=True,
    )
    repository = Mock()
    repository.get_category.return_value = category
    repository.name_exists.return_value = False
    repository.slug_exists.return_value = False

    result = AdminCategoriesService(repository).update_category(
        7,
        fields={"description", "is_active"},
        name=None,
        slug=None,
        description=None,
        is_active=False,
    )

    assert result.name == "Fantasy"
    assert result.slug == "fantasy"
    assert result.description is None
    assert result.is_active is False


def test_categories_service_detects_conflict_and_rolls_back_integrity_error() -> None:
    repository = Mock()
    repository.name_exists.return_value = True
    repository.slug_exists.return_value = False
    service = AdminCategoriesService(repository)

    with pytest.raises(AdminCategoryConflictError, match="name"):
        service.create_category(
            name="Fantasy", slug="fantasy-new", description=None, is_active=True
        )

    repository.name_exists.return_value = False
    repository.save.side_effect = IntegrityError("insert", {}, Exception("duplicate"))
    with pytest.raises(AdminCategoryConflictError):
        service.create_category(
            name="Sci-fi", slug="sci-fi", description=None, is_active=True
        )
    repository.rollback.assert_called_once()


def test_categories_service_reports_missing_category_on_delete() -> None:
    repository = Mock()
    repository.get_category.return_value = None

    with pytest.raises(AdminCategoryNotFoundError):
        AdminCategoriesService(repository).delete_category(999)


def test_tags_service_creates_and_updates_tag() -> None:
    repository = Mock()
    repository.name_exists.return_value = False
    repository.slug_exists.return_value = False
    service = AdminTagsService(repository)

    tag = service.create_tag(name="Xuyên không", slug=None)
    assert tag.slug == "xuyen-khong"
    repository.add.assert_called_once_with(tag)

    stored_tag = Tag(id=3, name="Fantasy", slug="fantasy")
    repository.get_tag.return_value = stored_tag
    updated = service.update_tag(
        3,
        fields={"name", "slug"},
        name="Dị giới",
        slug="di-gioi",
    )
    assert updated.name == "Dị giới"
    assert updated.slug == "di-gioi"


def test_tags_service_detects_conflict() -> None:
    repository = Mock()
    repository.name_exists.return_value = False
    repository.slug_exists.return_value = True

    with pytest.raises(AdminTagConflictError, match="slug"):
        AdminTagsService(repository).create_tag(name="Fantasy", slug="existing")


def test_tags_service_reports_missing_tag_on_delete() -> None:
    repository = Mock()
    repository.get_tag.return_value = None

    with pytest.raises(AdminTagNotFoundError):
        AdminTagsService(repository).delete_tag(999)

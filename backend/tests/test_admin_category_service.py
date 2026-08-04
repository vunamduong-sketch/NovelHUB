from unittest.mock import Mock

import pytest
from sqlalchemy.exc import IntegrityError

from app.admin.services.categories_service import (
    AdminCategoriesService,
    AdminCategoryConflictError,
    AdminCategoryNotFoundError,
)
from app.models.category import Category


def test_create_category_generates_vietnamese_slug() -> None:
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


def test_update_category_changes_only_requested_fields() -> None:
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


def test_create_category_rejects_duplicate_name() -> None:
    repository = Mock()
    repository.name_exists.return_value = True
    repository.slug_exists.return_value = False

    with pytest.raises(AdminCategoryConflictError, match="name"):
        AdminCategoriesService(repository).create_category(
            name="Fantasy",
            slug="fantasy-new",
            description=None,
            is_active=True,
        )


def test_create_category_rolls_back_integrity_error() -> None:
    repository = Mock()
    repository.name_exists.return_value = False
    repository.slug_exists.return_value = False
    repository.save.side_effect = IntegrityError(
        "insert",
        {},
        Exception("duplicate"),
    )

    with pytest.raises(AdminCategoryConflictError):
        AdminCategoriesService(repository).create_category(
            name="Sci-fi",
            slug="sci-fi",
            description=None,
            is_active=True,
        )

    repository.rollback.assert_called_once()


def test_delete_category_reports_missing_category() -> None:
    repository = Mock()
    repository.get_category.return_value = None

    with pytest.raises(AdminCategoryNotFoundError):
        AdminCategoriesService(repository).delete_category(999)

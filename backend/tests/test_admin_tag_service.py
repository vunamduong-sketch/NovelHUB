from unittest.mock import Mock

import pytest

from app.admin.services.tags_service import (
    AdminTagConflictError,
    AdminTagNotFoundError,
    AdminTagsService,
)
from app.models.tag import Tag


def test_create_tag_generates_vietnamese_slug() -> None:
    repository = Mock()
    repository.name_exists.return_value = False
    repository.slug_exists.return_value = False

    tag = AdminTagsService(repository).create_tag(
        name="Xuyên không",
        slug=None,
    )

    assert tag.slug == "xuyen-khong"
    repository.add.assert_called_once_with(tag)
    repository.save.assert_called_once()
    repository.refresh.assert_called_once_with(tag)


def test_update_tag_changes_name_and_slug() -> None:
    stored_tag = Tag(id=3, name="Fantasy", slug="fantasy")
    repository = Mock()
    repository.get_tag.return_value = stored_tag
    repository.name_exists.return_value = False
    repository.slug_exists.return_value = False

    updated = AdminTagsService(repository).update_tag(
        3,
        fields={"name", "slug"},
        name="Dị giới",
        slug="di-gioi",
    )

    assert updated.name == "Dị giới"
    assert updated.slug == "di-gioi"


def test_create_tag_rejects_duplicate_slug() -> None:
    repository = Mock()
    repository.name_exists.return_value = False
    repository.slug_exists.return_value = True

    with pytest.raises(AdminTagConflictError, match="slug"):
        AdminTagsService(repository).create_tag(
            name="Fantasy",
            slug="existing",
        )


def test_delete_tag_reports_missing_tag() -> None:
    repository = Mock()
    repository.get_tag.return_value = None

    with pytest.raises(AdminTagNotFoundError):
        AdminTagsService(repository).delete_tag(999)

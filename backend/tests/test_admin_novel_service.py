import uuid
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.admin.services.novels_service import (
    AdminNovelNotFoundError,
    AdminNovelsService,
)


def test_list_novels_normalizes_search_and_forwards_filters() -> None:
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


def test_list_novels_converts_blank_search_to_none() -> None:
    repository = Mock()
    repository.list_novels.return_value = ([], 0)

    AdminNovelsService(repository).list_novels(
        search="   ",
        status=None,
        visibility=None,
        moderation_status=None,
        page=1,
        page_size=20,
    )

    assert repository.list_novels.call_args.kwargs["search"] is None


def test_get_novel_reports_missing_novel() -> None:
    repository = Mock()
    repository.get_novel.return_value = None

    with pytest.raises(AdminNovelNotFoundError):
        AdminNovelsService(repository).get_novel(uuid.uuid4())

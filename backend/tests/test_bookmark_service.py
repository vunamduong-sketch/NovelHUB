import uuid
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.services.bookmark_service import (
    BookmarkChapterNotAvailableError,
    BookmarkNotFoundError,
    BookmarkService,
)

def _service():
    repository = Mock()
    chapter_repository = Mock()
    novel_repository = Mock()

    service = BookmarkService(
        repository,
        chapter_repository,
        novel_repository,
    )

    return (
        service,
        repository,
        chapter_repository,
        novel_repository,
    )

def create_service():
    bookmark_repository = Mock()
    chapter_repository = Mock()
    novel_repository = Mock()

    service = BookmarkService(
        bookmark_repository,
        chapter_repository,
        novel_repository,
    )

    return (
        service,
        bookmark_repository,
        chapter_repository,
        novel_repository,
    )


def create_public_chapter():
    novel = SimpleNamespace(
        id=uuid.uuid4(),
        visibility="public",
        moderation_status="approved",
    )

    chapter = SimpleNamespace(
        id=uuid.uuid4(),
        novel_id=novel.id,
        status="published",
    )

    return chapter, novel


def test_save_bookmark_uses_current_user_and_chapter():
    (
        service,
        bookmark_repository,
        chapter_repository,
        novel_repository,
    ) = create_service()

    user = SimpleNamespace(id=uuid.uuid4())
    chapter, novel = create_public_chapter()
    bookmark = SimpleNamespace(
        user_id=user.id,
        chapter_id=chapter.id,
        position_offset=120,
        note="Đọc lại",
    )

    chapter_repository.get_active_by_id.return_value = (
        chapter
    )
    novel_repository.get_active_by_id.return_value = novel
    bookmark_repository.upsert.return_value = bookmark

    result = service.save_bookmark(
        user,
        chapter.id,
        position_offset=120,
        note="Đọc lại",
    )

    chapter_repository.get_active_by_id.assert_called_once_with(
        chapter.id
    )

    novel_repository.get_active_by_id.assert_called_once_with(
        novel.id
    )

    bookmark_repository.upsert.assert_called_once_with(
        user.id,
        chapter.id,
        position_offset=120,
        note="Đọc lại",
    )

    assert result == (
        bookmark,
        chapter,
        novel,
    )


def test_get_bookmark_returns_user_bookmark():
    (
        service,
        bookmark_repository,
        chapter_repository,
        novel_repository,
    ) = create_service()

    user = SimpleNamespace(id=uuid.uuid4())
    chapter, novel = create_public_chapter()
    bookmark = SimpleNamespace(
        user_id=user.id,
        chapter_id=chapter.id,
    )

    chapter_repository.get_active_by_id.return_value = (
        chapter
    )
    novel_repository.get_active_by_id.return_value = novel
    bookmark_repository.get.return_value = bookmark

    result = service.get_bookmark(
        user,
        chapter.id,
    )

    bookmark_repository.get.assert_called_once_with(
        user.id,
        chapter.id,
    )

    assert result == (
        bookmark,
        chapter,
        novel,
    )


def test_save_bookmark_rejects_draft_chapter():
    (
        service,
        bookmark_repository,
        chapter_repository,
        novel_repository,
    ) = create_service()

    user = SimpleNamespace(id=uuid.uuid4())

    chapter_repository.get_active_by_id.return_value = (
        SimpleNamespace(
            id=uuid.uuid4(),
            status="draft",
        )
    )

    with pytest.raises(
        BookmarkChapterNotAvailableError
    ):
        service.save_bookmark(
            user,
            uuid.uuid4(),
            position_offset=0,
            note=None,
        )

    novel_repository.get_active_by_id.assert_not_called()
    bookmark_repository.upsert.assert_not_called()


def test_save_bookmark_rejects_private_novel():
    (
        service,
        bookmark_repository,
        chapter_repository,
        novel_repository,
    ) = create_service()

    user = SimpleNamespace(id=uuid.uuid4())

    novel = SimpleNamespace(
        id=uuid.uuid4(),
        visibility="private",
        moderation_status="approved",
    )

    chapter = SimpleNamespace(
        id=uuid.uuid4(),
        novel_id=novel.id,
        status="published",
    )

    chapter_repository.get_active_by_id.return_value = (
        chapter
    )
    novel_repository.get_active_by_id.return_value = novel

    with pytest.raises(
        BookmarkChapterNotAvailableError
    ):
        service.save_bookmark(
            user,
            chapter.id,
            position_offset=0,
            note=None,
        )

    bookmark_repository.upsert.assert_not_called()


def test_remove_bookmark_reports_missing_bookmark():
    (
        service,
        bookmark_repository,
        chapter_repository,
        novel_repository,
    ) = create_service()

    user = SimpleNamespace(id=uuid.uuid4())
    chapter, novel = create_public_chapter()

    chapter_repository.get_active_by_id.return_value = (
        chapter
    )
    novel_repository.get_active_by_id.return_value = novel
    bookmark_repository.get.return_value = None

    with pytest.raises(BookmarkNotFoundError):
        service.remove_bookmark(
            user,
            chapter.id,
        )

    bookmark_repository.delete.assert_not_called()

def test_list_novel_bookmarks_returns_repository_items() -> None:
    service, repository, _, novel_repository = _service()

    user = SimpleNamespace(id=uuid.uuid4())

    novel = SimpleNamespace(
        id=uuid.uuid4(),
        visibility="public",
        moderation_status="approved",
        deleted_at=None,
    )

    items = [SimpleNamespace()]

    novel_repository.get_active_by_id.return_value = novel
    repository.list_by_novel.return_value = items

    result = service.list_novel_bookmarks(
        user,
        novel.id,
    )

    repository.list_by_novel.assert_called_once_with(
        user.id,
        novel.id,
    )

    assert result is items
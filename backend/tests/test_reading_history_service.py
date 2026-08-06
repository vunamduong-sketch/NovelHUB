import uuid
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.services.reading_history_service import (
    ReadingHistoryChapterNotAvailableError,
    ReadingHistoryService,
)


def _service():
    repository = Mock()
    chapter_repository = Mock()
    novel_repository = Mock()

    service = ReadingHistoryService(
        repository,
        chapter_repository,
        novel_repository,
    )

    return service, repository, chapter_repository, novel_repository


def test_record_progress_updates_history_for_public_chapter() -> None:
    service, repository, chapter_repository, novel_repository = _service()

    user = SimpleNamespace(id=uuid.uuid4())

    novel = SimpleNamespace(
        id=uuid.uuid4(),
        visibility="public",
        moderation_status="approved",
        deleted_at=None,
    )

    chapter = SimpleNamespace(
        id=uuid.uuid4(),
        novel_id=novel.id,
        status="published",
        deleted_at=None,
    )

    history = SimpleNamespace()

    chapter_repository.get_active_by_id.return_value = chapter
    novel_repository.get_active_by_id.return_value = novel
    repository.upsert.return_value = history

    result = service.record_progress(
        user,
        chapter.id,
        position_offset=220,
        progress_percent=Decimal("52.5"),
    )

    repository.upsert.assert_called_once_with(
        user.id,
        novel.id,
        chapter.id,
        position_offset=220,
        progress_percent=Decimal("52.5"),
    )

    assert result == (history, novel, chapter)


def test_record_progress_rejects_unavailable_novel() -> None:
    service, repository, chapter_repository, novel_repository = _service()

    chapter = SimpleNamespace(
        id=uuid.uuid4(),
        novel_id=uuid.uuid4(),
        status="published",
        deleted_at=None,
    )

    chapter_repository.get_active_by_id.return_value = chapter
    novel_repository.get_active_by_id.return_value = SimpleNamespace(
        visibility="private",
        moderation_status="approved",
    )

    with pytest.raises(ReadingHistoryChapterNotAvailableError):
        service.record_progress(
            SimpleNamespace(id=uuid.uuid4()),
            chapter.id,
            position_offset=0,
            progress_percent=Decimal("0"),
        )

    repository.upsert.assert_not_called()
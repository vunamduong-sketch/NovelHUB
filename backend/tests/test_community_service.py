import uuid
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.services.community_service import (
    CommunityConflictError,
    CommunityNotFoundError,
    CommunityService,
)


def _service() -> tuple[CommunityService, Mock]:
    repository = Mock()
    return CommunityService(repository), repository


def _user() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        username="reader",
        display_name="Reader",
    )


def _public_chapter() -> SimpleNamespace:
    return SimpleNamespace(id=uuid.uuid4())


def _public_novel() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        author_id=uuid.uuid4(),
        follower_count=0,
        rating_count=0,
        rating_average=0,
    )


def test_create_comment_uses_current_user_and_public_chapter() -> None:
    service, repository = _service()
    user = _user()
    chapter = _public_chapter()
    comment = SimpleNamespace(
        id=uuid.uuid4(),
        user_id=user.id,
        chapter_id=chapter.id,
    )

    repository.get_public_chapter.return_value = chapter
    repository.add_comment.return_value = comment

    result = service.create_comment(
        user,
        chapter.id,
        content="Hay qua",
    )

    repository.add_comment.assert_called_once_with(
        chapter_id=chapter.id,
        user_id=user.id,
        content="Hay qua",
    )
    assert result == (comment, user)


def test_create_comment_rejects_unavailable_chapter() -> None:
    service, repository = _service()
    repository.get_public_chapter.return_value = None

    with pytest.raises(CommunityNotFoundError):
        service.create_comment(
            _user(),
            uuid.uuid4(),
            content="Hay qua",
        )

    repository.add_comment.assert_not_called()


def test_reply_comment_rejects_reply_to_reply() -> None:
    service, repository = _service()
    parent = SimpleNamespace(
        id=uuid.uuid4(),
        chapter_id=uuid.uuid4(),
        parent_id=uuid.uuid4(),
    )
    repository.get_visible_comment.return_value = parent

    with pytest.raises(CommunityConflictError):
        service.reply_comment(
            _user(),
            parent.id,
            content="Dong y",
        )

    repository.add_comment.assert_not_called()


def test_rate_novel_updates_user_rating() -> None:
    service, repository = _service()
    user = _user()
    novel = _public_novel()
    rating = SimpleNamespace(
        user_id=user.id,
        novel_id=novel.id,
        score=5,
    )

    repository.get_public_novel.return_value = novel
    repository.upsert_rating.return_value = rating

    result = service.rate_novel(
        user,
        novel.id,
        score=5,
        review_text="Tot",
    )

    repository.upsert_rating.assert_called_once_with(
        user_id=user.id,
        novel=novel,
        score=5,
        review_text="Tot",
    )
    assert result == (rating, novel)


def test_follow_novel_creates_follow_for_public_novel() -> None:
    service, repository = _service()
    user = _user()
    novel = _public_novel()
    author = SimpleNamespace(
        id=novel.author_id,
        username="author",
        display_name="Author",
    )
    follow = SimpleNamespace(
        user_id=user.id,
        novel_id=novel.id,
    )

    repository.get_public_novel.return_value = novel
    repository.get_active_user.return_value = author
    repository.upsert_novel_follow.return_value = follow

    result = service.follow_novel(
        user,
        novel.id,
        notifications_enabled=True,
    )

    repository.upsert_novel_follow.assert_called_once_with(
        user_id=user.id,
        novel=novel,
        notifications_enabled=True,
    )
    assert result == (follow, novel, author)


def test_follow_author_rejects_following_self() -> None:
    service, repository = _service()
    user = _user()

    with pytest.raises(CommunityConflictError):
        service.follow_author(
            user,
            user.id,
            notifications_enabled=True,
        )

    repository.upsert_author_follow.assert_not_called()


def test_unfollow_novel_reports_missing_follow() -> None:
    service, repository = _service()
    user = _user()
    novel = _public_novel()

    repository.get_public_novel.return_value = novel
    repository.get_novel_follow.return_value = None

    with pytest.raises(CommunityNotFoundError):
        service.unfollow_novel(user, novel.id)

    repository.delete_novel_follow.assert_not_called()


import os
import uuid
from types import SimpleNamespace
from unittest.mock import Mock

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

from app.services.novel_service import NovelService


def _service() -> tuple[NovelService, Mock]:
    repository = Mock()
    return NovelService(repository), repository


def test_get_new_releases_forwards_category_and_enriches_results() -> None:
    service, repository = _service()

    novel = SimpleNamespace(id=uuid.uuid4())
    tag_one = SimpleNamespace(id=1)
    tag_two = SimpleNamespace(id=2)

    repository.get_new_releases.return_value = [(novel, "Author Name")]
    repository.get_tags_for_novels.return_value = {novel.id: [tag_one, tag_two]}

    result = service.get_new_releases(category_id=7)

    repository.get_new_releases.assert_called_once_with(category_id=7, search=None)
    repository.get_tags_for_novels.assert_called_once_with([novel.id])
    assert result == [(novel, [tag_one, tag_two], "Author Name")]


def test_get_completed_novels_forwards_category_and_enriches_results() -> None:
    service, repository = _service()

    novel = SimpleNamespace(id=uuid.uuid4())
    tag = SimpleNamespace(id=3)

    repository.get_completed_novels.return_value = [(novel, "Completed Author")]
    repository.get_tags_for_novels.return_value = {novel.id: [tag]}

    result = service.get_completed_novels(category_id=11)

    repository.get_completed_novels.assert_called_once_with(category_id=11, search=None)
    repository.get_tags_for_novels.assert_called_once_with([novel.id])
    assert result == [(novel, [tag], "Completed Author")]


def test_get_featured_novels_forwards_filters_and_enriches_results() -> None:
    service, repository = _service()

    novel = SimpleNamespace(id=uuid.uuid4())
    tag = SimpleNamespace(id=4)

    repository.get_featured_novels.return_value = [(novel, "Featured Author")]
    repository.get_tags_for_novels.return_value = {novel.id: [tag]}

    result = service.get_featured_novels(category_id=9, search="action")

    repository.get_featured_novels.assert_called_once_with(category_id=9, search="action", limit=30)
    repository.get_tags_for_novels.assert_called_once_with([novel.id])
    assert result == [(novel, [tag], "Featured Author")]
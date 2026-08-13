import os
from types import SimpleNamespace
from unittest.mock import Mock

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

from app.repositories.novel_repository import NovelRepository


def _repository() -> tuple[NovelRepository, Mock]:
    session = Mock()
    return NovelRepository(session), session


def test_public_novel_rows_prefers_display_name_over_username() -> None:
    repository, session = _repository()
    statement = Mock()
    novel = SimpleNamespace(id=1)
    session.execute.return_value = [
        (novel, "Display Name", "username-one"),
        (novel, None, "username-two"),
    ]

    result = repository._public_novel_rows(statement)

    session.execute.assert_called_once_with(statement)
    assert result == [(novel, "Display Name"), (novel, "username-two")]


def test_get_new_releases_uses_category_filter_limit_and_public_catalog_pipeline() -> None:
    repository, _ = _repository()
    catalog_statement = Mock()
    chained_statement = Mock()
    catalog_statement.where.return_value = chained_statement
    chained_statement.where.return_value = chained_statement
    chained_statement.order_by.return_value = chained_statement
    chained_statement.limit.return_value = chained_statement
    repository._public_catalog_statement = Mock(return_value=catalog_statement)
    repository._public_novel_rows = Mock(return_value=[("novel", "author")])

    result = repository.get_new_releases(category_id=5)

    repository._public_catalog_statement.assert_called_once_with(category_id=5, search=None)
    catalog_statement.where.assert_called_once()
    chained_statement.where.assert_called_once()
    chained_statement.order_by.assert_called_once()
    chained_statement.limit.assert_called_once_with(30)
    repository._public_novel_rows.assert_called_once_with(chained_statement)
    assert result == [("novel", "author")]


def test_get_completed_novels_uses_public_catalog_pipeline() -> None:
    repository, _ = _repository()
    catalog_statement = Mock()
    chained_statement = Mock()
    catalog_statement.where.return_value = chained_statement
    chained_statement.order_by.return_value = chained_statement
    repository._public_catalog_statement = Mock(return_value=catalog_statement)
    repository._public_novel_rows = Mock(return_value=[("novel", "author")])

    result = repository.get_completed_novels(category_id=None)

    repository._public_catalog_statement.assert_called_once_with(category_id=None, search=None)
    catalog_statement.where.assert_called_once()
    chained_statement.order_by.assert_called_once()
    repository._public_novel_rows.assert_called_once_with(chained_statement)
    assert result == [("novel", "author")]


def test_get_featured_novels_uses_public_catalog_pipeline_and_limit() -> None:
    repository, _ = _repository()
    catalog_statement = Mock()
    chained_statement = Mock()
    catalog_statement.order_by.return_value = chained_statement
    chained_statement.limit.return_value = chained_statement
    repository._public_catalog_statement = Mock(return_value=catalog_statement)
    repository._public_novel_rows = Mock(return_value=[("novel", "author")])

    result = repository.get_featured_novels(category_id=3, search="fantasy")

    repository._public_catalog_statement.assert_called_once_with(category_id=3, search="fantasy")
    catalog_statement.order_by.assert_called_once()
    chained_statement.limit.assert_called_once_with(30)
    repository._public_novel_rows.assert_called_once_with(chained_statement)
    assert result == [("novel", "author")]
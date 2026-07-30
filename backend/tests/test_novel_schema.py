import pytest
from pydantic import ValidationError

from app.schemas.novel import NovelCreateRequest, NovelUpdateRequest


def test_create_novel_normalizes_fields() -> None:
    request = NovelCreateRequest(
        title="  Ten truyen  ",
        description="  Mo ta ngan  ",
        tag_ids=[1, 2, 1],
        cover_url="  https://cdn.example.com/cover.jpg  ",
        language_code="VI",
    )

    assert request.title == "Ten truyen"
    assert request.description == "Mo ta ngan"
    assert request.tag_ids == [1, 2]
    assert request.cover_url == "https://cdn.example.com/cover.jpg"
    assert request.language_code == "vi"


def test_create_novel_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        NovelCreateRequest(title="Ten truyen", unknown_field=True)


def test_update_novel_requires_at_least_one_field() -> None:
    with pytest.raises(ValidationError):
        NovelUpdateRequest()


def test_update_novel_allows_explicit_null_category() -> None:
    request = NovelUpdateRequest(category_id=None)

    assert request.category_id is None
    assert "category_id" in request.model_fields_set


def test_update_novel_allows_empty_tag_list() -> None:
    request = NovelUpdateRequest(tag_ids=[])

    assert request.tag_ids == []
    assert "tag_ids" in request.model_fields_set


def test_novel_schema_rejects_invalid_tag_ids() -> None:
    with pytest.raises(ValidationError):
        NovelCreateRequest(title="Ten truyen", tag_ids=[0])


def test_update_novel_rejects_invalid_status() -> None:
    with pytest.raises(ValidationError):
        NovelUpdateRequest(status="published")

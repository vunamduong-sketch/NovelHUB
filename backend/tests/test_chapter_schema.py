from decimal import Decimal
import pytest
from pydantic import ValidationError

from app.schemas.chapter import ChapterCreateRequest, ChapterUpdateRequest


def test_create_chapter_normalizes_fields() -> None:
    request = ChapterCreateRequest(
        title="  Chapter 1: The Beginning  ",
        chapter_number=Decimal("1.50"),
        content="This is content.",
        summary="  This is a summary.  ",
        status="draft",
    )

    assert request.title == "Chapter 1: The Beginning"
    assert request.summary == "This is a summary."
    assert request.chapter_number == Decimal("1.50")
    assert request.content == "This is content."
    assert request.status == "draft"


def test_create_chapter_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        ChapterCreateRequest(title="Chapter 1", chapter_number=1, unknown_field=True)


def test_update_chapter_requires_at_least_one_field() -> None:
    with pytest.raises(ValidationError):
        ChapterUpdateRequest()


def test_create_chapter_rejects_empty_title() -> None:
    with pytest.raises(ValidationError):
        ChapterCreateRequest(title="   ", chapter_number=1)


def test_create_chapter_rejects_non_positive_number() -> None:
    with pytest.raises(ValidationError):
        ChapterCreateRequest(title="Chapter 1", chapter_number=Decimal("0"))

    with pytest.raises(ValidationError):
        ChapterCreateRequest(title="Chapter 1", chapter_number=Decimal("-1"))


def test_update_chapter_rejects_invalid_status() -> None:
    with pytest.raises(ValidationError):
        ChapterUpdateRequest(status="unknown_status")

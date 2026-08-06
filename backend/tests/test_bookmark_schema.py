import pytest
from pydantic import ValidationError

from app.schemas.bookmark import BookmarkUpsertRequest


def test_bookmark_request_uses_default_values():
    request = BookmarkUpsertRequest()

    assert request.position_offset == 0
    assert request.note is None


def test_bookmark_request_strips_note():
    request = BookmarkUpsertRequest(
        position_offset=100,
        note="  Đọc lại đoạn này  ",
    )

    assert request.position_offset == 100
    assert request.note == "Đọc lại đoạn này"


def test_bookmark_request_converts_blank_note_to_none():
    request = BookmarkUpsertRequest(
        note="   ",
    )

    assert request.note is None


def test_bookmark_request_rejects_negative_offset():
    with pytest.raises(ValidationError):
        BookmarkUpsertRequest(
            position_offset=-1,
        )


def test_bookmark_request_rejects_long_note():
    with pytest.raises(ValidationError):
        BookmarkUpsertRequest(
            note="a" * 501,
        )
import pytest
from pydantic import ValidationError

from app.schemas.community import CommentCreateRequest, RatingUpsertRequest


def test_comment_content_is_trimmed() -> None:
    payload = CommentCreateRequest(content="  Truyen rat cuon  ")

    assert payload.content == "Truyen rat cuon"


def test_comment_rejects_blank_content() -> None:
    with pytest.raises(ValidationError):
        CommentCreateRequest(content="   ")


def test_rating_rejects_score_outside_one_to_five() -> None:
    with pytest.raises(ValidationError):
        RatingUpsertRequest(score=6)


def test_rating_review_text_is_trimmed_to_none() -> None:
    payload = RatingUpsertRequest(score=5, review_text="   ")

    assert payload.review_text is None


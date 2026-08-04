import pytest
from pydantic import ValidationError

from app.admin.schemas.tags import AdminTagCreateRequest, AdminTagUpdateRequest


def test_tag_requests_normalize_fields() -> None:
    created = AdminTagCreateRequest(
        name="  Xuyên không  ",
        slug="  xuyen-khong  ",
    )
    updated = AdminTagUpdateRequest(name="  Dị giới  ")

    assert created.name == "Xuyên không"
    assert created.slug == "xuyen-khong"
    assert updated.name == "Dị giới"


def test_update_tag_requires_at_least_one_field() -> None:
    with pytest.raises(ValidationError):
        AdminTagUpdateRequest()


def test_tag_requests_reject_invalid_slug() -> None:
    with pytest.raises(ValidationError):
        AdminTagCreateRequest(name="Xuyên không", slug="Xuyên Không")


def test_update_tag_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        AdminTagUpdateRequest(name="Fantasy", color="red")

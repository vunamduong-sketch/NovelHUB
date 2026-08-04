import pytest
from pydantic import ValidationError

from app.admin.schemas.categories import (
    AdminCategoryCreateRequest,
    AdminCategoryUpdateRequest,
)
from app.admin.schemas.tags import AdminTagCreateRequest, AdminTagUpdateRequest
from app.admin.schemas.users import AdminUserRoleUpdateRequest


def test_user_role_request_normalizes_and_deduplicates_codes() -> None:
    request = AdminUserRoleUpdateRequest(roles=[" Reader ", "AUTHOR", "reader"])

    assert request.roles == ["reader", "author"]


@pytest.mark.parametrize("roles", [[], ["   "]])
def test_user_role_request_requires_at_least_one_valid_role(roles: list[str]) -> None:
    with pytest.raises(ValidationError):
        AdminUserRoleUpdateRequest(roles=roles)


def test_category_create_request_normalizes_fields() -> None:
    request = AdminCategoryCreateRequest(
        name="  Khoa học  ",
        slug="  khoa-hoc  ",
        description="  Mô tả  ",
    )

    assert request.name == "Khoa học"
    assert request.slug == "khoa-hoc"
    assert request.description == "Mô tả"
    assert request.is_active is True


@pytest.mark.parametrize("slug", ["Khoa Hoc", "khoa_hoc", "-khoa-hoc", "khoa-hoc-"])
def test_category_create_request_rejects_invalid_slug(slug: str) -> None:
    with pytest.raises(ValidationError):
        AdminCategoryCreateRequest(name="Khoa học", slug=slug)


def test_category_update_requires_a_field_and_preserves_explicit_null() -> None:
    with pytest.raises(ValidationError):
        AdminCategoryUpdateRequest()

    request = AdminCategoryUpdateRequest(description=None)
    assert request.description is None
    assert "description" in request.model_fields_set


def test_tag_requests_normalize_fields() -> None:
    created = AdminTagCreateRequest(name="  Xuyên không  ", slug="  xuyen-khong  ")
    updated = AdminTagUpdateRequest(name="  Dị giới  ")

    assert created.name == "Xuyên không"
    assert created.slug == "xuyen-khong"
    assert updated.name == "Dị giới"


def test_tag_update_requires_a_field_and_forbids_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        AdminTagUpdateRequest()
    with pytest.raises(ValidationError):
        AdminTagUpdateRequest(name="Fantasy", color="red")

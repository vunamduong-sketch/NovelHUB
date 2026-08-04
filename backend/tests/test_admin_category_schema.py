import pytest
from pydantic import ValidationError

from app.admin.schemas.categories import (
    AdminCategoryCreateRequest,
    AdminCategoryUpdateRequest,
)


def test_create_category_normalizes_fields() -> None:
    request = AdminCategoryCreateRequest(
        name="  Khoa học  ",
        slug="  khoa-hoc  ",
        description="  Mô tả  ",
    )

    assert request.name == "Khoa học"
    assert request.slug == "khoa-hoc"
    assert request.description == "Mô tả"
    assert request.is_active is True


@pytest.mark.parametrize(
    "slug",
    ["Khoa Hoc", "khoa_hoc", "-khoa-hoc", "khoa-hoc-"],
)
def test_create_category_rejects_invalid_slug(slug: str) -> None:
    with pytest.raises(ValidationError):
        AdminCategoryCreateRequest(name="Khoa học", slug=slug)


def test_update_category_requires_at_least_one_field() -> None:
    with pytest.raises(ValidationError):
        AdminCategoryUpdateRequest()


def test_update_category_preserves_explicit_null_description() -> None:
    request = AdminCategoryUpdateRequest(description=None)

    assert request.description is None
    assert "description" in request.model_fields_set


def test_create_category_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        AdminCategoryCreateRequest(name="Fantasy", color="red")

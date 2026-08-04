import pytest
from pydantic import ValidationError

from app.admin.schemas.users import AdminUserRoleUpdateRequest


def test_role_update_normalizes_and_deduplicates_codes() -> None:
    request = AdminUserRoleUpdateRequest(
        roles=[" Reader ", "AUTHOR", "reader"],
    )

    assert request.roles == ["reader", "author"]


@pytest.mark.parametrize("roles", [[], ["   "]])
def test_role_update_requires_at_least_one_valid_role(roles: list[str]) -> None:
    with pytest.raises(ValidationError):
        AdminUserRoleUpdateRequest(roles=roles)


def test_role_update_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        AdminUserRoleUpdateRequest(roles=["reader"], user_id="uuid")

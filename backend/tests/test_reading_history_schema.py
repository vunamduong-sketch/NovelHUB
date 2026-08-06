from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.reading_history import ReadingProgressRequest


def test_reading_progress_accepts_valid_percent() -> None:
    request = ReadingProgressRequest(progress_percent="42.75")

    assert request.progress_percent == Decimal("42.75")


@pytest.mark.parametrize("percent", [-1, 101])
def test_reading_progress_rejects_out_of_range_percent(percent: int) -> None:
    with pytest.raises(ValidationError):
        ReadingProgressRequest(progress_percent=percent)
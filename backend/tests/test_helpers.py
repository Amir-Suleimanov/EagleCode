from dataclasses import dataclass

from apps.ratings.helpers import get_eagle_progress
from apps.users.helpers import build_initials


@dataclass
class Level:
    code: str
    order: int
    min_meters: int


def test_eagle_progress_contract():
    levels = [Level("IV", 4, 5_000), Level("V", 5, 14_000)]
    result = get_eagle_progress(12_480, levels)
    assert result.level.code == "IV"
    assert result.progress == 83
    assert result.remaining == 1_520


def test_initials():
    assert build_initials("Магомед Алиев") == "МА"

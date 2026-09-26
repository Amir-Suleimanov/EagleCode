from dataclasses import dataclass


@dataclass(frozen=True)
class EagleProgress:
    level: object
    next_level: object | None
    progress: int
    remaining: int


def get_eagle_progress(meters: int, levels) -> EagleProgress:
    ordered = list(levels)
    level = next((item for item in reversed(ordered) if meters >= item.min_meters), ordered[0])
    next_level = next((item for item in ordered if item.order == level.order + 1), None)
    if next_level is None:
        return EagleProgress(level, None, 100, 0)
    span = next_level.min_meters - level.min_meters
    progress = round((meters - level.min_meters) / span * 100)
    return EagleProgress(
        level, next_level, max(0, min(100, progress)), next_level.min_meters - meters
    )


def max_meters_for(level, levels):
    next_level = next((item for item in levels if item.order == level.order + 1), None)
    return next_level.min_meters - 1 if next_level else None

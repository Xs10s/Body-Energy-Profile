from __future__ import annotations

from datetime import datetime, timedelta, timezone

from calc_core_py.core.time_utils import solar_longitude_deg


class SolarTerm:
    def __init__(self, term_index: int, longitude_deg: float, timestamp: datetime):
        self.term_index = term_index
        self.longitude_deg = longitude_deg
        self.timestamp = timestamp


def _wrap_diff(target: float, current: float) -> float:
    diff = (target - current) % 360
    if diff > 180:
        diff -= 360
    return diff


def _find_crossing(start: datetime, end: datetime, target_deg: float) -> datetime:
    left = start
    right = end
    for _ in range(40):
        mid = left + (right - left) / 2
        diff_left = _wrap_diff(target_deg, solar_longitude_deg(left))
        diff_mid = _wrap_diff(target_deg, solar_longitude_deg(mid))
        if diff_left == 0:
            return left
        if diff_left * diff_mid <= 0:
            right = mid
        else:
            left = mid
    return left


def get_solar_terms_for_year(year: int) -> list[SolarTerm]:
    terms: list[SolarTerm] = []
    start = datetime(year, 1, 1, tzinfo=timezone.utc)
    end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    current = start
    step = timedelta(days=1)
    targets = [(index, (index * 15) % 360) for index in range(24)]
    target_index = 0

    while current < end and target_index < len(targets):
        next_day = current + step
        current_lon = solar_longitude_deg(current)
        next_lon = solar_longitude_deg(next_day)
        target_deg = targets[target_index][1]
        diff_current = _wrap_diff(target_deg, current_lon)
        diff_next = _wrap_diff(target_deg, next_lon)
        if diff_current == 0 or diff_current * diff_next <= 0:
            crossing = _find_crossing(current, next_day, target_deg)
            terms.append(SolarTerm(targets[target_index][0], target_deg, crossing))
            target_index += 1
            continue
        current = next_day

    return terms


def get_major_terms_for_year(year: int) -> list[SolarTerm]:
    return [term for term in get_solar_terms_for_year(year) if term.term_index % 2 == 0]

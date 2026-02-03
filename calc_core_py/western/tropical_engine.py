from __future__ import annotations

from datetime import datetime

from calc_core_py.schemas.enums import PlanetId, SignId, WesternElementId
from calc_core_py.schemas.models import BodyPosition, ElementBalance, WesternCalcMode, WesternResult
from calc_core_py.western.mappings import ELEMENT_IDS, PLANET_IDS, SIGN_IDS, SIGN_TO_ELEMENT


def _longitude_for_planet(planet_index: int, utc_dt: datetime, lat: float, lon: float) -> float:
    julian_day = _julian_day(utc_dt)
    base = (julian_day * 13.37) % 360
    offset = (planet_index + 1) * 27.5
    geo = (lat + lon) * 0.1
    return (base + offset + geo) % 360


def _julian_day(dt: datetime) -> float:
    year = dt.year
    month = dt.month
    day = dt.day
    hour = dt.hour + dt.minute / 60 + dt.second / 3600 + dt.microsecond / 3_600_000_000
    if month <= 2:
        year -= 1
        month += 12
    a = year // 100
    b = 2 - a + a // 4
    jd = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + hour / 24 + b - 1524.5
    return jd


def _sign_for_longitude(longitude: float) -> SignId:
    index = int(longitude // 30) % 12
    return SIGN_IDS[index]


def calculate_tropical(utc_dt: datetime, lat: float, lon: float) -> WesternResult:
    bodies: dict[PlanetId, BodyPosition] = {}
    element_counts = {element_id: 0 for element_id in ELEMENT_IDS}

    for index, planet_id in enumerate(PLANET_IDS):
        longitude = _longitude_for_planet(index, utc_dt, lat, lon)
        sign_id = _sign_for_longitude(longitude)
        element_id = SIGN_TO_ELEMENT[sign_id]
        element_counts[element_id] += 1
        bodies[planet_id] = BodyPosition(
            longitude_deg=longitude,
            sign_id=sign_id,
            element_id=element_id,
        )

    total = sum(element_counts.values()) or 1
    elements = {
        element_id: ElementBalance(count=count, ratio=count / total)
        for element_id, count in element_counts.items()
    }

    return WesternResult(
        reference_frame_id="frame_01",
        calculation_mode=WesternCalcMode(
            mode_version="v1",
            mode_id="mode_01",
            house_system="system_01",
        ),
        bodies=bodies,
        elements=elements,
    )

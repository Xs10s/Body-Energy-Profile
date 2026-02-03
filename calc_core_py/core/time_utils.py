from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class SolarLongitudeResult:
    longitude_deg: float


def julian_day(dt: datetime) -> float:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
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


def julian_day_number(dt: datetime) -> int:
    return int(julian_day(dt) + 0.5)


def solar_longitude_deg(dt: datetime) -> float:
    jd = julian_day(dt)
    n = jd - 2451545.0
    mean_longitude = (280.460 + 0.9856474 * n) % 360
    mean_anomaly = (357.528 + 0.9856003 * n) % 360
    mean_anomaly_rad = mean_anomaly * 3.141592653589793 / 180
    ecliptic_longitude = mean_longitude + 1.915 * __import__("math").sin(mean_anomaly_rad) + 0.020 * __import__("math").sin(2 * mean_anomaly_rad)
    return ecliptic_longitude % 360

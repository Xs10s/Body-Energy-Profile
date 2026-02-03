from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from calc_core_py.schemas.models import EnergyProfileInput, NormalizedBirthInfo


def normalize_birth_info(input_data: EnergyProfileInput) -> NormalizedBirthInfo:
    birth_date = input_data.birth_date
    birth_time = input_data.birth_time or "12:00"
    year, month, day = [int(part) for part in birth_date.split("-")]
    hour, minute = [int(part) for part in birth_time.split(":")]
    tz = ZoneInfo(input_data.timezone)
    local_dt = datetime(year, month, day, hour, minute, tzinfo=tz)
    if input_data.time_unknown:
        local_dt = datetime(year, month, day, 12, 0, tzinfo=tz)
    utc_dt = local_dt.astimezone(timezone.utc)
    offset_minutes = int(local_dt.utcoffset().total_seconds() / 60) if local_dt.utcoffset() else 0
    latitude = float(input_data.latitude) if input_data.latitude is not None else 0.0
    longitude = float(input_data.longitude) if input_data.longitude is not None else 0.0
    altitude = float(input_data.altitude) if input_data.altitude is not None else None
    return NormalizedBirthInfo(
        birth_utc_datetime=utc_dt.isoformat(),
        birth_local_datetime_resolved=local_dt.isoformat(),
        tz_offset_minutes_at_birth=offset_minutes,
        latitude=latitude,
        longitude=longitude,
        altitude=altitude,
    )

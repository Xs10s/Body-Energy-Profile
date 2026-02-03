from __future__ import annotations

from datetime import datetime

from calc_core_py.chinese.bazi_engine import calculate_bazi
from calc_core_py.core.input_normalization import normalize_birth_info
from calc_core_py.schemas.models import EnergyProfileInput, EnergyProfileResult
from calc_core_py.western.sidereal_engine import calculate_sidereal
from calc_core_py.western.tropical_engine import calculate_tropical


def calculate_energy_profile(input_data: EnergyProfileInput) -> EnergyProfileResult:
    normalized = normalize_birth_info(input_data)
    utc_dt = datetime.fromisoformat(normalized.birth_utc_datetime)
    local_dt = datetime.fromisoformat(normalized.birth_local_datetime_resolved)

    western_tropical = calculate_tropical(utc_dt, normalized.latitude, normalized.longitude)
    western_sidereal = calculate_sidereal(utc_dt, normalized.latitude, normalized.longitude)
    chinese_bazi = calculate_bazi(local_dt)

    return EnergyProfileResult(
        birth_utc_datetime=normalized.birth_utc_datetime,
        birth_local_datetime_resolved=normalized.birth_local_datetime_resolved,
        tz_offset_minutes_at_birth=normalized.tz_offset_minutes_at_birth,
        latitude=normalized.latitude,
        longitude=normalized.longitude,
        altitude=normalized.altitude,
        calc_versions={
            "western_tropical": "v1",
            "western_sidereal": "v1",
            "chinese_bazi": "v1",
        },
        calculation_modes={
            "western_tropical": western_tropical.calculation_mode.model_dump(),
            "western_sidereal": western_sidereal.calculation_mode.model_dump(),
            "chinese_bazi": chinese_bazi.calculation_mode.model_dump(),
        },
        western_tropical=western_tropical,
        western_sidereal=western_sidereal,
        chinese_bazi=chinese_bazi,
    )

from __future__ import annotations

from calc_core_py.core.engine import calculate_energy_profile
from calc_core_py.schemas.enums import (
    BaziBranchId,
    BaziCycleId,
    BaziElementId,
    BaziPillarId,
    BaziStemId,
    LuckCycleId,
    PlanetId,
    PolarityId,
    SignId,
    WesternElementId,
)
from calc_core_py.schemas.models import EnergyProfileInput, EnergyProfileResult


def _sample_input() -> EnergyProfileInput:
    return EnergyProfileInput.model_validate(
        {
            "birthDate": "1990-01-02",
            "birthTime": "04:30",
            "timezone": "Europe/Amsterdam",
            "latitude": 52.37,
            "longitude": 4.89,
        }
    )


def test_determinism_energy_profile():
    input_data = _sample_input()
    result_a = calculate_energy_profile(input_data)
    result_b = calculate_energy_profile(input_data)
    assert result_a.model_dump_json() == result_b.model_dump_json()


def test_schema_roundtrip_energy_profile():
    input_data = _sample_input()
    result = calculate_energy_profile(input_data)
    payload = result.model_dump()
    roundtrip = EnergyProfileResult.model_validate(payload)
    assert roundtrip.model_dump() == payload


def test_enums_complete_counts():
    assert len(list(PlanetId)) == 10
    assert len(list(SignId)) == 12
    assert len(list(WesternElementId)) == 4
    assert len(list(BaziStemId)) == 10
    assert len(list(BaziBranchId)) == 12
    assert len(list(BaziElementId)) == 5
    assert len(list(PolarityId)) == 2
    assert len(list(BaziCycleId)) == 60
    assert len(list(BaziPillarId)) == 4
    assert len(list(LuckCycleId)) >= 12


def test_bazi_pillars_present():
    input_data = _sample_input()
    result = calculate_energy_profile(input_data)
    assert set(result.chinese_bazi.pillars.keys()) == set(BaziPillarId)


def test_bazi_balance_normalization():
    input_data = _sample_input()
    result = calculate_energy_profile(input_data)
    visible_sum = sum(item.ratio for item in result.chinese_bazi.elements_visible.values())
    total_sum = sum(item.ratio for item in result.chinese_bazi.elements_total.values())
    polarity_visible_sum = sum(item.ratio for item in result.chinese_bazi.polarity_visible.values())
    polarity_total_sum = sum(item.ratio for item in result.chinese_bazi.polarity_total.values())
    assert abs(visible_sum - 1.0) < 1e-6
    assert abs(total_sum - 1.0) < 1e-6
    assert abs(polarity_visible_sum - 1.0) < 1e-6
    assert abs(polarity_total_sum - 1.0) < 1e-6


def test_western_consistency_presence():
    input_data = _sample_input()
    result = calculate_energy_profile(input_data)
    assert len(result.western_tropical.bodies) == 10
    assert len(result.western_sidereal.bodies) == 10
    assert len(result.western_tropical.elements) == 4
    assert len(result.western_sidereal.elements) == 4

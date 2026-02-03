from __future__ import annotations

from typing import Dict, Optional

from pydantic import BaseModel, Field

from calc_core_py.schemas.enums import (
    AngleId,
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


class EnergyProfileInput(BaseModel):
    birth_date: str = Field(alias="birthDate")
    birth_time: Optional[str] = Field(default=None, alias="birthTime")
    timezone: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None
    time_unknown: Optional[bool] = Field(default=False, alias="timeUnknown")

    model_config = {
        "populate_by_name": True,
    }


class NormalizedBirthInfo(BaseModel):
    birth_utc_datetime: str
    birth_local_datetime_resolved: str
    tz_offset_minutes_at_birth: int
    latitude: float
    longitude: float
    altitude: Optional[float]


class CalculationMode(BaseModel):
    mode_version: str
    mode_id: str


class WesternCalcMode(CalculationMode):
    house_system: str


class WesternSiderealCalcMode(WesternCalcMode):
    ayanamsha_mode: str


class BaziCalcMode(CalculationMode):
    year_boundary_mode: str
    month_system_mode: str
    day_boundary_mode: str
    include_hidden_stems: bool
    luck_cycles_enabled: bool


class BodyPosition(BaseModel):
    longitude_deg: float
    sign_id: SignId
    element_id: WesternElementId


class ElementBalance(BaseModel):
    count: int
    ratio: float


class WesternResult(BaseModel):
    reference_frame_id: str
    calculation_mode: WesternCalcMode
    bodies: Dict[PlanetId, BodyPosition]
    elements: Dict[WesternElementId, ElementBalance]


class WesternSiderealResult(BaseModel):
    reference_frame_id: str
    calculation_mode: WesternSiderealCalcMode
    ayanamsha_deg: float
    bodies: Dict[PlanetId, BodyPosition]
    elements: Dict[WesternElementId, ElementBalance]


class PillarPosition(BaseModel):
    stem_id: BaziStemId
    branch_id: BaziBranchId


class DayMaster(BaseModel):
    stem_id: BaziStemId
    element_id: BaziElementId
    polarity_id: PolarityId


class LuckCycle(BaseModel):
    stem_id: BaziStemId
    branch_id: BaziBranchId
    start_age: int
    end_age: int


class BaziResult(BaseModel):
    reference_frame_id: str
    calculation_mode: BaziCalcMode
    pillars: Dict[BaziPillarId, PillarPosition]
    day_master: DayMaster
    elements_visible: Dict[BaziElementId, ElementBalance]
    elements_total: Dict[BaziElementId, ElementBalance]
    polarity_visible: Dict[PolarityId, ElementBalance]
    polarity_total: Dict[PolarityId, ElementBalance]
    luck_cycles: Optional[Dict[LuckCycleId, LuckCycle]]


class EnergyProfileResult(BaseModel):
    birth_utc_datetime: str
    birth_local_datetime_resolved: str
    tz_offset_minutes_at_birth: int
    latitude: float
    longitude: float
    altitude: Optional[float]
    calc_versions: Dict[str, str]
    calculation_modes: Dict[str, Dict[str, str | bool]]
    western_tropical: WesternResult
    western_sidereal: WesternSiderealResult
    chinese_bazi: BaziResult

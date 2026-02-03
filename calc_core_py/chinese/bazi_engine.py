from __future__ import annotations

from datetime import datetime

from calc_core_py.chinese.mappings import (
    BRANCH_IDS,
    STEM_IDS,
    branch_to_hidden_stems,
    branch_to_primary_element,
    cycle60,
    hour_branch_by_local_time,
    hour_stem_table,
    stem_to_element,
    stem_to_polarity,
)
from calc_core_py.chinese.solar_terms import get_major_terms_for_year
from calc_core_py.core.time_utils import julian_day_number
from calc_core_py.schemas.enums import (
    BaziBranchId,
    BaziCycleId,
    BaziElementId,
    BaziPillarId,
    BaziStemId,
    LuckCycleId,
    PolarityId,
)
from calc_core_py.schemas.models import (
    BaziCalcMode,
    BaziResult,
    DayMaster,
    ElementBalance,
    PillarPosition,
)


def _cycle_id_from_index(index: int) -> BaziCycleId:
    cycle_ids = list(BaziCycleId)
    return cycle_ids[index % len(cycle_ids)]


def _year_cycle_index(year: int) -> int:
    return (year - 1984) % 60


def _month_branch_index(month_term_index: int) -> int:
    return (month_term_index % 12)


def _month_stem_index(year_stem_index: int, month_index: int) -> int:
    return (year_stem_index * 2 + month_index) % len(STEM_IDS)


def _count_elements(stems: list[BaziStemId], branches: list[BaziBranchId], include_hidden: bool) -> tuple[dict[BaziElementId, int], dict[BaziElementId, int]]:
    visible = {element_id: 0 for element_id in BaziElementId}
    total = {element_id: 0 for element_id in BaziElementId}

    for stem_id in stems:
        element_id = stem_to_element[stem_id]
        visible[element_id] += 1
        total[element_id] += 1

    for branch_id in branches:
        primary = branch_to_primary_element[branch_id]
        visible[primary] += 1
        total[primary] += 1
        if include_hidden:
            for hidden_stem in branch_to_hidden_stems[branch_id]:
                total[stem_to_element[hidden_stem]] += 1

    return visible, total


def _count_polarity(stems: list[BaziStemId], branches: list[BaziBranchId], include_hidden: bool) -> tuple[dict[PolarityId, int], dict[PolarityId, int]]:
    visible = {polarity_id: 0 for polarity_id in PolarityId}
    total = {polarity_id: 0 for polarity_id in PolarityId}

    for stem_id in stems:
        polarity = stem_to_polarity[stem_id]
        visible[polarity] += 1
        total[polarity] += 1

    if include_hidden:
        for branch_id in branches:
            for hidden_stem in branch_to_hidden_stems[branch_id]:
                polarity = stem_to_polarity[hidden_stem]
                total[polarity] += 1

    return visible, total


def _balance_map(counts: dict) -> dict:
    total = sum(counts.values()) or 1
    return {
        key: ElementBalance(count=value, ratio=value / total)
        for key, value in counts.items()
    }


def _determine_year_boundary(local_dt: datetime) -> int:
    terms = get_major_terms_for_year(local_dt.year)
    boundary = next((term for term in terms if term.longitude_deg == 315), None)
    if boundary and local_dt >= boundary.timestamp:
        return local_dt.year
    return local_dt.year - 1


def _determine_month_index(local_dt: datetime, year_for_terms: int) -> int:
    terms = get_major_terms_for_year(year_for_terms)
    terms_sorted = sorted(terms, key=lambda term: term.timestamp)
    index = 0
    for term in terms_sorted:
        if local_dt >= term.timestamp:
            index += 1
    return index % 12


def calculate_bazi(local_dt: datetime) -> BaziResult:
    calc_mode = BaziCalcMode(
        mode_version="v1",
        mode_id="mode_01",
        year_boundary_mode="mode_01",
        month_system_mode="mode_01",
        day_boundary_mode="mode_01",
        include_hidden_stems=True,
        luck_cycles_enabled=False,
    )

    year_for_pillar = _determine_year_boundary(local_dt)
    year_cycle_index = _year_cycle_index(year_for_pillar)
    year_cycle_id = _cycle_id_from_index(year_cycle_index)
    year_stem_id = cycle60[year_cycle_id]["stem_id"]
    year_branch_id = cycle60[year_cycle_id]["branch_id"]

    month_index = _determine_month_index(local_dt, year_for_pillar)
    month_branch_id = BRANCH_IDS[_month_branch_index(month_index)]
    month_stem_id = STEM_IDS[_month_stem_index(STEM_IDS.index(year_stem_id), month_index)]

    jdn = julian_day_number(local_dt)
    day_cycle_index = (jdn + 10) % 60
    day_cycle_id = _cycle_id_from_index(day_cycle_index)
    day_stem_id = cycle60[day_cycle_id]["stem_id"]
    day_branch_id = cycle60[day_cycle_id]["branch_id"]

    hour_branch_id = hour_branch_by_local_time(local_dt.hour)
    hour_stem_id = hour_stem_table[day_stem_id][hour_branch_id]

    pillars = {
        BaziPillarId.pillar_01: PillarPosition(stem_id=year_stem_id, branch_id=year_branch_id),
        BaziPillarId.pillar_02: PillarPosition(stem_id=month_stem_id, branch_id=month_branch_id),
        BaziPillarId.pillar_03: PillarPosition(stem_id=day_stem_id, branch_id=day_branch_id),
        BaziPillarId.pillar_04: PillarPosition(stem_id=hour_stem_id, branch_id=hour_branch_id),
    }

    stems = [year_stem_id, month_stem_id, day_stem_id, hour_stem_id]
    branches = [year_branch_id, month_branch_id, day_branch_id, hour_branch_id]

    visible_elements, total_elements = _count_elements(stems, branches, calc_mode.include_hidden_stems)
    visible_polarity, total_polarity = _count_polarity(stems, branches, calc_mode.include_hidden_stems)

    return BaziResult(
        reference_frame_id="frame_03",
        calculation_mode=calc_mode,
        pillars=pillars,
        day_master=DayMaster(
            stem_id=day_stem_id,
            element_id=stem_to_element[day_stem_id],
            polarity_id=stem_to_polarity[day_stem_id],
        ),
        elements_visible=_balance_map(visible_elements),
        elements_total=_balance_map(total_elements),
        polarity_visible=_balance_map(visible_polarity),
        polarity_total=_balance_map(total_polarity),
        luck_cycles=None,
    )

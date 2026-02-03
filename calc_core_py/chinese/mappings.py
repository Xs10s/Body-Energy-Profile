from __future__ import annotations

from calc_core_py.schemas.enums import (
    BaziBranchId,
    BaziCycleId,
    BaziElementId,
    BaziStemId,
    PolarityId,
)

STEM_IDS = [
    BaziStemId.stem_01,
    BaziStemId.stem_02,
    BaziStemId.stem_03,
    BaziStemId.stem_04,
    BaziStemId.stem_05,
    BaziStemId.stem_06,
    BaziStemId.stem_07,
    BaziStemId.stem_08,
    BaziStemId.stem_09,
    BaziStemId.stem_10,
]

BRANCH_IDS = [
    BaziBranchId.branch_01,
    BaziBranchId.branch_02,
    BaziBranchId.branch_03,
    BaziBranchId.branch_04,
    BaziBranchId.branch_05,
    BaziBranchId.branch_06,
    BaziBranchId.branch_07,
    BaziBranchId.branch_08,
    BaziBranchId.branch_09,
    BaziBranchId.branch_10,
    BaziBranchId.branch_11,
    BaziBranchId.branch_12,
]

ELEMENT_IDS = [
    BaziElementId.element_01,
    BaziElementId.element_02,
    BaziElementId.element_03,
    BaziElementId.element_04,
    BaziElementId.element_05,
]

stem_to_element = {
    BaziStemId.stem_01: BaziElementId.element_01,
    BaziStemId.stem_02: BaziElementId.element_01,
    BaziStemId.stem_03: BaziElementId.element_02,
    BaziStemId.stem_04: BaziElementId.element_02,
    BaziStemId.stem_05: BaziElementId.element_03,
    BaziStemId.stem_06: BaziElementId.element_03,
    BaziStemId.stem_07: BaziElementId.element_04,
    BaziStemId.stem_08: BaziElementId.element_04,
    BaziStemId.stem_09: BaziElementId.element_05,
    BaziStemId.stem_10: BaziElementId.element_05,
}

stem_to_polarity = {
    BaziStemId.stem_01: PolarityId.polarity_01,
    BaziStemId.stem_02: PolarityId.polarity_02,
    BaziStemId.stem_03: PolarityId.polarity_01,
    BaziStemId.stem_04: PolarityId.polarity_02,
    BaziStemId.stem_05: PolarityId.polarity_01,
    BaziStemId.stem_06: PolarityId.polarity_02,
    BaziStemId.stem_07: PolarityId.polarity_01,
    BaziStemId.stem_08: PolarityId.polarity_02,
    BaziStemId.stem_09: PolarityId.polarity_01,
    BaziStemId.stem_10: PolarityId.polarity_02,
}

branch_to_primary_element = {
    BaziBranchId.branch_01: BaziElementId.element_01,
    BaziBranchId.branch_02: BaziElementId.element_02,
    BaziBranchId.branch_03: BaziElementId.element_03,
    BaziBranchId.branch_04: BaziElementId.element_04,
    BaziBranchId.branch_05: BaziElementId.element_05,
    BaziBranchId.branch_06: BaziElementId.element_01,
    BaziBranchId.branch_07: BaziElementId.element_02,
    BaziBranchId.branch_08: BaziElementId.element_03,
    BaziBranchId.branch_09: BaziElementId.element_04,
    BaziBranchId.branch_10: BaziElementId.element_05,
    BaziBranchId.branch_11: BaziElementId.element_01,
    BaziBranchId.branch_12: BaziElementId.element_02,
}

branch_to_hidden_stems = {
    BaziBranchId.branch_01: [BaziStemId.stem_01, BaziStemId.stem_03, BaziStemId.stem_05],
    BaziBranchId.branch_02: [BaziStemId.stem_02, BaziStemId.stem_04, BaziStemId.stem_06],
    BaziBranchId.branch_03: [BaziStemId.stem_03, BaziStemId.stem_05, BaziStemId.stem_07],
    BaziBranchId.branch_04: [BaziStemId.stem_04, BaziStemId.stem_06, BaziStemId.stem_08],
    BaziBranchId.branch_05: [BaziStemId.stem_05, BaziStemId.stem_07, BaziStemId.stem_09],
    BaziBranchId.branch_06: [BaziStemId.stem_06, BaziStemId.stem_08, BaziStemId.stem_10],
    BaziBranchId.branch_07: [BaziStemId.stem_07, BaziStemId.stem_09, BaziStemId.stem_01],
    BaziBranchId.branch_08: [BaziStemId.stem_08, BaziStemId.stem_10, BaziStemId.stem_02],
    BaziBranchId.branch_09: [BaziStemId.stem_09, BaziStemId.stem_01, BaziStemId.stem_03],
    BaziBranchId.branch_10: [BaziStemId.stem_10, BaziStemId.stem_02, BaziStemId.stem_04],
    BaziBranchId.branch_11: [BaziStemId.stem_01, BaziStemId.stem_03, BaziStemId.stem_05],
    BaziBranchId.branch_12: [BaziStemId.stem_02, BaziStemId.stem_04, BaziStemId.stem_06],
}


cycle60 = {
    cycle_id: {
        "stem_id": STEM_IDS[index % len(STEM_IDS)],
        "branch_id": BRANCH_IDS[index % len(BRANCH_IDS)],
    }
    for index, cycle_id in enumerate(list(BaziCycleId))
}


hour_branch_blocks = [
    (23, 1, BaziBranchId.branch_01),
    (1, 3, BaziBranchId.branch_02),
    (3, 5, BaziBranchId.branch_03),
    (5, 7, BaziBranchId.branch_04),
    (7, 9, BaziBranchId.branch_05),
    (9, 11, BaziBranchId.branch_06),
    (11, 13, BaziBranchId.branch_07),
    (13, 15, BaziBranchId.branch_08),
    (15, 17, BaziBranchId.branch_09),
    (17, 19, BaziBranchId.branch_10),
    (19, 21, BaziBranchId.branch_11),
    (21, 23, BaziBranchId.branch_12),
]


def hour_branch_by_local_time(hour: int) -> BaziBranchId:
    for start, end, branch_id in hour_branch_blocks:
        if start <= end:
            if start <= hour < end:
                return branch_id
        else:
            if hour >= start or hour < end:
                return branch_id
    return BaziBranchId.branch_01


hour_stem_table = {
    stem_id: {
        branch_id: STEM_IDS[(stem_index * 2 + branch_index) % len(STEM_IDS)]
        for branch_index, branch_id in enumerate(BRANCH_IDS)
    }
    for stem_index, stem_id in enumerate(STEM_IDS)
}

from __future__ import annotations

from calc_core_py.schemas.enums import PlanetId, SignId, WesternElementId

PLANET_IDS = [
    PlanetId.planet_01,
    PlanetId.planet_02,
    PlanetId.planet_03,
    PlanetId.planet_04,
    PlanetId.planet_05,
    PlanetId.planet_06,
    PlanetId.planet_07,
    PlanetId.planet_08,
    PlanetId.planet_09,
    PlanetId.planet_10,
]

SIGN_IDS = [
    SignId.sign_01,
    SignId.sign_02,
    SignId.sign_03,
    SignId.sign_04,
    SignId.sign_05,
    SignId.sign_06,
    SignId.sign_07,
    SignId.sign_08,
    SignId.sign_09,
    SignId.sign_10,
    SignId.sign_11,
    SignId.sign_12,
]

ELEMENT_IDS = [
    WesternElementId.element_01,
    WesternElementId.element_02,
    WesternElementId.element_03,
    WesternElementId.element_04,
]

SIGN_TO_ELEMENT = {
    SignId.sign_01: WesternElementId.element_01,
    SignId.sign_02: WesternElementId.element_02,
    SignId.sign_03: WesternElementId.element_03,
    SignId.sign_04: WesternElementId.element_04,
    SignId.sign_05: WesternElementId.element_01,
    SignId.sign_06: WesternElementId.element_02,
    SignId.sign_07: WesternElementId.element_03,
    SignId.sign_08: WesternElementId.element_04,
    SignId.sign_09: WesternElementId.element_01,
    SignId.sign_10: WesternElementId.element_02,
    SignId.sign_11: WesternElementId.element_03,
    SignId.sign_12: WesternElementId.element_04,
}

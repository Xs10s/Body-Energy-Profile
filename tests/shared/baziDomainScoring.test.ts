import { describe, expect, it } from "vitest";
import { computeBaziDomainScores } from "../../shared/scoring/baziDomainScoring";
import type { EnergyProfileResult } from "../../shared/energyProfile";

function makeResult(overrides?: Partial<EnergyProfileResult["chinese_bazi"]>): EnergyProfileResult {
  return {
    birth_utc_datetime: "1990-01-01T00:00:00Z",
    birth_local_datetime_resolved: "1990-01-01T01:00:00+01:00",
    tz_offset_minutes_at_birth: 60,
    latitude: 52.3,
    longitude: 4.9,
    altitude: null,
    calc_versions: {},
    calculation_modes: {},
    western_tropical: { reference_frame_id: "", calculation_mode: {}, bodies: {}, elements: {} },
    western_sidereal: { reference_frame_id: "", calculation_mode: {}, bodies: {}, elements: {}, ayanamsha_deg: 0 },
    chinese_bazi: {
      reference_frame_id: "bazi",
      calculation_mode: {},
      pillars: {},
      day_master: { stem_id: "jia", element_id: "wood", polarity_id: "yang" },
      elements_visible: {
        wood: { count: 2, ratio: 0.4 },
        fire: { count: 1, ratio: 0.2 },
        earth: { count: 1, ratio: 0.2 },
        metal: { count: 0, ratio: 0 },
        water: { count: 1, ratio: 0.2 },
      },
      elements_total: {},
      polarity_visible: {
        yin: { count: 2, ratio: 0.4 },
        yang: { count: 3, ratio: 0.6 },
      },
      polarity_total: {},
      luck_cycles: null,
      ...overrides,
    },
  };
}

describe("computeBaziDomainScores", () => {
  it("returns complete domain scores in expected bounds", () => {
    const scores = computeBaziDomainScores(makeResult());
    expect(Object.keys(scores)).toHaveLength(7);
    for (const score of Object.values(scores)) {
      expect(score.value).toBeGreaterThanOrEqual(20);
      expect(score.value).toBeLessThanOrEqual(90);
      expect(score.spread).toBe(0);
      expect(score.timeSensitive).toBe(false);
    }
  });

  it("responds to element changes", () => {
    const waterHeavy = computeBaziDomainScores(
      makeResult({
        elements_visible: {
          wood: { count: 1, ratio: 0.1 },
          fire: { count: 0, ratio: 0.0 },
          earth: { count: 1, ratio: 0.1 },
          metal: { count: 1, ratio: 0.1 },
          water: { count: 7, ratio: 0.7 },
        },
      })
    );

    const fireHeavy = computeBaziDomainScores(
      makeResult({
        elements_visible: {
          wood: { count: 1, ratio: 0.1 },
          fire: { count: 7, ratio: 0.7 },
          earth: { count: 1, ratio: 0.1 },
          metal: { count: 1, ratio: 0.1 },
          water: { count: 0, ratio: 0.0 },
        },
      })
    );

    expect(waterHeavy.sacral.value).toBeGreaterThan(fireHeavy.sacral.value);
    expect(fireHeavy.solar.value).toBeGreaterThan(waterHeavy.solar.value);
  });

  it("works with Python API keys (element_01..05, polarity_01/02)", () => {
    const result = makeResult({
      day_master: { stem_id: "stem_01", element_id: "element_03", polarity_id: "polarity_02" },
      elements_visible: {
        element_01: { count: 1, ratio: 0.2 },
        element_02: { count: 1, ratio: 0.2 },
        element_03: { count: 2, ratio: 0.4 },
        element_04: { count: 0, ratio: 0 },
        element_05: { count: 1, ratio: 0.2 },
      },
      polarity_visible: {
        polarity_01: { count: 2, ratio: 0.4 },
        polarity_02: { count: 3, ratio: 0.6 },
      },
    });
    const scores = computeBaziDomainScores(result);
    expect(Object.keys(scores)).toHaveLength(7);
    for (const score of Object.values(scores)) {
      expect(score.value).toBeGreaterThanOrEqual(20);
      expect(score.value).toBeLessThanOrEqual(90);
    }
  });
});

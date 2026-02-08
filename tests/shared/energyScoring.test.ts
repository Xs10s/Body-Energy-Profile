import { describe, expect, it } from "vitest";
import { generateProfileByView } from "../../shared/profileBuilder";
import { scoringFromBodyProfile, scoringFromChineseResult } from "../../shared/energyScoring";
import type { EnergyProfileResult } from "../../shared/energyProfile";

const baseInput = {
  birthDate: "1990-06-15",
  birthTime: "12:00",
  timeUnknown: false,
  birthPlace: "Amsterdam",
  country: "Nederland",
  timezone: "Europe/Amsterdam",
  latitude: 52.3676,
  longitude: 4.9041,
  zodiacMode: "sidereal" as const,
};

function mockChinese(): EnergyProfileResult {
  return {
    birth_utc_datetime: "1990-06-15T10:00:00Z",
    birth_local_datetime_resolved: "1990-06-15T12:00:00+02:00",
    tz_offset_minutes_at_birth: 120,
    latitude: 52.3676,
    longitude: 4.9041,
    altitude: null,
    calc_versions: {},
    calculation_modes: {},
    western_tropical: {},
    western_sidereal: {},
    chinese_bazi: {
      reference_frame_id: "chinese",
      calculation_mode: {},
      pillars: {
        year: { stem_id: "stem_01", branch_id: "branch_01" },
        month: { stem_id: "stem_02", branch_id: "branch_02" },
        day: { stem_id: "stem_03", branch_id: "branch_03" },
        hour: { stem_id: "stem_04", branch_id: "branch_04" },
      },
      day_master: { stem_id: "stem_03", element_id: "wood", polarity_id: "yang" },
      elements_visible: {
        wood: { count: 3, ratio: 0.3 },
        fire: { count: 2, ratio: 0.2 },
        earth: { count: 2, ratio: 0.2 },
        metal: { count: 1, ratio: 0.1 },
        water: { count: 2, ratio: 0.2 },
      },
      elements_total: {},
      polarity_visible: { yin: { count: 4, ratio: 0.4 }, yang: { count: 6, ratio: 0.6 } },
      polarity_total: {},
      luck_cycles: null,
    },
  };
}

describe("energy scoring contract", () => {
  it("is deterministic for sidereal", () => {
    const p1 = scoringFromBodyProfile(generateProfileByView(baseInput, "sidereal"), "sidereal");
    const p2 = scoringFromBodyProfile(generateProfileByView(baseInput, "sidereal"), "sidereal");
    expect(p1.chartSignature).toBe(p2.chartSignature);
    expect(p1.domains[0].evidence.signals).toEqual(p2.domains[0].evidence.signals);
  });

  it("sidereal has nakshatra tags when time is provided", () => {
    const out = scoringFromBodyProfile(generateProfileByView(baseInput, "sidereal"), "sidereal");
    const tags = out.domains.flatMap((d) => d.evidence.signals.flatMap((s) => s.tags));
    expect(tags.some((tag) => tag.startsWith("nakshatra:"))).toBe(true);
  });

  it("tropical has no nakshatra tags", () => {
    const out = scoringFromBodyProfile(generateProfileByView({ ...baseInput, zodiacMode: "tropical" }, "tropical"), "tropical");
    const tags = out.domains.flatMap((d) => d.evidence.signals.flatMap((s) => s.tags));
    expect(tags.some((tag) => tag.startsWith("nakshatra:"))).toBe(false);
  });

  it("chinese bazi emits chinese+bazi tags", () => {
    const out = scoringFromChineseResult(baseInput, mockChinese(), "bazi");
    const tags = out.domains.flatMap((d) => d.evidence.signals.flatMap((s) => s.tags));
    expect(tags.some((t) => t === "system:chinese")).toBe(true);
    expect(tags.some((t) => t === "method:bazi")).toBe(true);
    expect(tags.some((t) => t.startsWith("system:sidereal"))).toBe(false);
  });

  it("chinese shengxiao emits animal and element tags deterministically", () => {
    const outA = scoringFromChineseResult(baseInput, mockChinese(), "shengxiao");
    const outB = scoringFromChineseResult(baseInput, mockChinese(), "shengxiao");
    expect(outA.chartSignature).toBe(outB.chartSignature);
    const tags = outA.domains.flatMap((d) => d.evidence.signals.flatMap((s) => s.tags));
    expect(tags.some((t) => t.startsWith("animal:"))).toBe(true);
    expect(tags.some((t) => t.startsWith("element:"))).toBe(true);
  });
});

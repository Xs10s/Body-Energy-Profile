import { describe, expect, it } from "vitest";
import { generateProfileByView, normalizeAstroView } from "../../shared/profileBuilder";

const baseInput = {
  birthDate: "1990-06-15",
  birthTime: "12:00",
  timeUnknown: false,
  birthPlace: "Amsterdam",
  country: "Nederland",
  timezone: "Europe/Amsterdam",
  latitude: 52.3676,
  longitude: 4.9041,
  zodiacMode: "sidereal"
};

const hasNakshatraTag = (profile: ReturnType<typeof generateProfileByView>) =>
  profile.chakraProfiles.some((chakra) =>
    chakra.signals.some((signal) =>
      (signal.tags || []).some((tag) => tag.startsWith("nakshatra:"))
    )
  );

describe("astro view routing", () => {
  it("defaults to sidereal when zodiacMode is missing", () => {
    expect(normalizeAstroView(undefined)).toBe("sidereal");
    expect(normalizeAstroView({ ...baseInput, zodiacMode: undefined as any })).toBe("sidereal");
  });

  it("sidereal view includes nakshatra tags", () => {
    const profile = generateProfileByView(baseInput, "sidereal");
    expect(hasNakshatraTag(profile)).toBe(true);
  });

  it("tropical view has no nakshatra tags", () => {
    const profile = generateProfileByView({ ...baseInput, zodiacMode: "tropical" }, "tropical");
    expect(hasNakshatraTag(profile)).toBe(false);
  });

  it("is deterministic for the same input + view", () => {
    const profileA = generateProfileByView(baseInput, "sidereal");
    const profileB = generateProfileByView(baseInput, "sidereal");
    expect(profileA.domainScores).toEqual(profileB.domainScores);
    expect(profileA.chakraProfiles).toEqual(profileB.chakraProfiles);
  });
});

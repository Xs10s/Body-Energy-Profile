import { describe, expect, it } from "vitest";
import { generateProfile } from "../../shared/scoring";

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

describe("generateProfile", () => {
  it("is deterministic for the same input", () => {
    const profileA = generateProfile(baseInput);
    const profileB = generateProfile(baseInput);

    expect(profileA.domainScores).toEqual(profileB.domainScores);
    expect(profileA.derived).toEqual(profileB.derived);
  });

  it("adds spread values when time is unknown", () => {
    const profile = generateProfile({
      ...baseInput,
      birthTime: undefined,
      timeUnknown: true
    });

    const spreads = Object.values(profile.domainScores).map((score) => score.spread);
    expect(spreads.some((spread) => spread > 0)).toBe(true);
  });

  it("includes nakshatra tags in sidereal signals", () => {
    const profile = generateProfile(baseInput);
    const hasNakshatraTag = profile.chakraProfiles.some((chakra) =>
      chakra.signals.some((signal) =>
        signal.tags.some((tag) => tag.startsWith("nakshatra:"))
      )
    );

    expect(hasNakshatraTag).toBe(true);
  });
});

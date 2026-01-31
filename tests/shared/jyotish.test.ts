import { describe, expect, it } from "vitest";
import { computeChart } from "../../shared/jyotish";

describe("computeChart", () => {
  it("returns expected moon and sun data for a fixed input", () => {
    const input = {
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

    const chart = computeChart(input);

    expect(chart.moon.rashiSiderealNL).toBe("Waterman");
    expect(chart.moon.nakshatraName).toBe("Shatabhisha");
    expect(chart.sun.rashiSiderealNL).toBe("Stier");
    expect(chart.lagna?.signSiderealNL).toBe("Waterman");
  });
});

import { describe, expect, it } from "vitest";
import type { TropicalChartFeatures, PlanetKey, PlanetPosition } from "../../shared/tropical";
import { computeTropicalChakraScores } from "../../shared/scoring/tropicalScoring";

const makePlanets = (sign: "Aries" | "Taurus"): Record<PlanetKey, PlanetPosition> => {
  const planets: PlanetKey[] = [
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto"
  ];

  return planets.reduce((acc, planet) => {
    acc[planet] = {
      planet,
      lon: 0,
      sign,
      house: 2,
      retrograde: false
    };
    return acc;
  }, {} as Record<PlanetKey, PlanetPosition>);
};

const makeFeatures = (elementPct: TropicalChartFeatures["elementPct"]): TropicalChartFeatures => ({
  mode: "tropical",
  houseSystem: "equal",
  planets: makePlanets("Aries"),
  aspects: [],
  elementPct,
  modalityPct: { cardinal: 0, fixed: 0, mutable: 0 },
  dignityByPlanet: {
    Sun: "neutral",
    Moon: "neutral",
    Mercury: "neutral",
    Venus: "neutral",
    Mars: "neutral",
    Jupiter: "neutral",
    Saturn: "neutral",
    Uranus: "neutral",
    Neptune: "neutral",
    Pluto: "neutral"
  },
  houseWeights: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0
  },
  stressIndex: 0
});

describe("computeTropicalChakraScores", () => {
  it("emits no nakshatra references", () => {
    const features = makeFeatures({ fire: 0.4, earth: 0.2, air: 0.2, water: 0.2 });
    const scores = computeTropicalChakraScores(features);

    for (const domain of Object.keys(scores) as Array<keyof typeof scores>) {
      const signals = scores[domain].evidence.signals;
      for (const signal of signals) {
        expect(signal.tags).toBeDefined();
        expect(signal.tags.some((tag) => tag.startsWith("nakshatra:"))).toBe(false);
        expect(signal.factor.toLowerCase()).not.toContain("nakshatra");
        expect(signal.reason.toLowerCase()).not.toContain("nakshatra");
      }
    }
  });

  it("applies element dominance to solar and root", () => {
    const fireDominant = makeFeatures({ fire: 0.4, earth: 0.2, air: 0.2, water: 0.2 });
    const fireScores = computeTropicalChakraScores(fireDominant);
    expect(fireScores.solar.value).toBeGreaterThan(50);

    const earthDominant = makeFeatures({ fire: 0.2, earth: 0.4, air: 0.2, water: 0.2 });
    const earthScores = computeTropicalChakraScores(earthDominant);
    expect(earthScores.root.value).toBeGreaterThan(50);
  });

  it("is deterministic for the same input", () => {
    const features = makeFeatures({ fire: 0.3, earth: 0.3, air: 0.2, water: 0.2 });
    const scoresA = computeTropicalChakraScores(features);
    const scoresB = computeTropicalChakraScores(features);

    expect(scoresA).toEqual(scoresB);
  });
});

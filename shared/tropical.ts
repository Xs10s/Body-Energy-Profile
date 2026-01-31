// Tropical (Western) chart feature extraction: tropical longitudes, houses, aspects, element/modality, dignity, stressIndex.
// NOTE: Keep this parallel to jyotish.ts. Do not mix sidereal logic here.

import * as Astronomy from "astronomy-engine";
import { DateTime } from "luxon";
import { computeChart } from "./jyotish";
import type { ProfileInput } from "./schema";
import type { Domain } from "./scoring/types";

export type PlanetKey =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto";

export type AspectType = "conjunction" | "opposition" | "square" | "trine" | "sextile";

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export interface PlanetPosition {
  planet: PlanetKey;
  lon: number; // 0..360 tropical longitude
  sign: ZodiacSign;
  house: number; // 1..12
  retrograde?: boolean;
}

export interface Aspect {
  a: PlanetKey;
  b: PlanetKey;
  type: AspectType;
  orbDeg: number; // absolute orb in degrees
}

export type Dignity = "domicile" | "exaltation" | "detriment" | "fall" | "neutral";

export interface TropicalChartFeatures {
  mode: "tropical";
  houseSystem: "placidus" | "equal";
  planets: Record<PlanetKey, PlanetPosition>;
  aspects: Aspect[];
  elementPct: Record<Element, number>;   // 0..1
  modalityPct: Record<Modality, number>; // 0..1
  dignityByPlanet: Record<PlanetKey, Dignity>;
  houseWeights: Record<number, number>;  // 1..12 => weighted emphasis
  stressIndex: number; // 0..1
}

export interface TropicalBuildOptions {
  houseSystemPreference?: "placidus" | "equal";
}

export interface BirthInput {
  dateISO: string;       // YYYY-MM-DD
  timeHHmm?: string;     // optional "HH:mm"
  timezone?: string;     // IANA TZ if you store it
  lat: number;
  lon: number;
}

export const HOUSE_WEIGHT: Record<PlanetKey | "Asc", number> = {
  Sun: 3,
  Moon: 3,
  Mercury: 2,
  Venus: 2,
  Mars: 2,
  Jupiter: 1.5,
  Saturn: 1.5,
  Uranus: 1,
  Neptune: 1,
  Pluto: 1,
  Asc: 3
};

const ZODIAC_SIGNS: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export function buildTropicalChartFeatures(
  input: BirthInput,
  opts: TropicalBuildOptions = {}
): TropicalChartFeatures {
  const houseSystem = opts.houseSystemPreference ?? "placidus";

  const planets = computePlanetsTropical(input, houseSystem);
  const aspects = computeMajorAspects(planets);
  const { elementPct, modalityPct } = computeElementModality(planets);
  const dignityByPlanet = computeDignities(planets);
  const houseWeights = computeHouseWeights(planets);
  const stressIndex = computeStressIndex({ aspects, houseWeights });

  return {
    mode: "tropical",
    houseSystem,
    planets,
    aspects,
    elementPct,
    modalityPct,
    dignityByPlanet,
    houseWeights,
    stressIndex
  };
}

function computePlanetsTropical(
  input: BirthInput,
  houseSystem: "placidus" | "equal"
): Record<PlanetKey, PlanetPosition> {
  const timezone = input.timezone ?? "UTC";
  const time = input.timeHHmm ?? "12:00";
  const local = DateTime.fromISO(`${input.dateISO}T${time}`, { zone: timezone });
  const utcDate = local.toUTC().toJSDate();

  const profileInput: ProfileInput = {
    birthDate: input.dateISO,
    birthTime: time,
    timeUnknown: false,
    birthPlace: "Onbekend",
    country: "Onbekend",
    timezone,
    latitude: input.lat,
    longitude: input.lon,
    zodiacMode: "tropical"
  };

  const chart = computeChart(profileInput);
  const lagnaSign = chart.lagna?.signTropical ?? 0;

  const planets: Record<PlanetKey, PlanetPosition> = {} as Record<PlanetKey, PlanetPosition>;

  const innerPlanets: Array<keyof typeof chart.planets> = [
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn"
  ];

  for (const planet of innerPlanets) {
    const data = chart.planets[planet];
    const signIndex = data.signTropical;
    const sign = ZODIAC_SIGNS[signIndex];
    const house = data.houseWholeSign ?? getHouseFromLagna(signIndex, lagnaSign);

    planets[planet as PlanetKey] = {
      planet: planet as PlanetKey,
      lon: data.lonTropicalDeg,
      sign,
      house,
      retrograde: data.retrograde
    };
  }

  const outerPlanets: PlanetKey[] = ["Uranus", "Neptune", "Pluto"];
  for (const planet of outerPlanets) {
    const { longitude, retrograde } = getTropicalLongitude(planet, utcDate);
    const signIndex = Math.floor(longitude / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex];
    const house = getHouseFromLagna(signIndex, lagnaSign);
    planets[planet] = {
      planet,
      lon: longitude,
      sign,
      house,
      retrograde
    };
  }

  return planets;
}

function getTropicalLongitude(planet: PlanetKey, date: Date) {
  const body = planet as Astronomy.Body;
  const geo = Astronomy.GeoVector(body, date, false);
  const ecliptic = Astronomy.Ecliptic(geo);

  let retrograde = false;
  if (planet !== "Sun" && planet !== "Moon") {
    const dayBefore = new Date(date.getTime() - 86400000);
    const geoBefore = Astronomy.GeoVector(body, dayBefore, false);
    const eclipticBefore = Astronomy.Ecliptic(geoBefore);
    let diff = ecliptic.elon - eclipticBefore.elon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    retrograde = diff < 0;
  }

  return { longitude: ecliptic.elon, retrograde };
}

function getHouseFromLagna(signIndex: number, lagnaSign: number): number {
  return ((signIndex - lagnaSign + 12) % 12) + 1;
}

const MAJOR_ASPECTS: Array<{ type: AspectType; angle: number }> = [
  { type: "conjunction", angle: 0 },
  { type: "sextile", angle: 60 },
  { type: "square", angle: 90 },
  { type: "trine", angle: 120 },
  { type: "opposition", angle: 180 }
];

function computeMajorAspects(
  planets: Record<PlanetKey, PlanetPosition>
): Aspect[] {
  const keys = Object.keys(planets) as PlanetKey[];
  const out: Aspect[] = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i];
      const b = keys[j];
      const d = angularDistance(planets[a].lon, planets[b].lon);
      for (const asp of MAJOR_ASPECTS) {
        const orb = Math.abs(d - asp.angle);
        if (orb <= 8) {
          out.push({ a, b, type: asp.type, orbDeg: orb });
          break;
        }
      }
    }
  }
  return out;
}

function angularDistance(lon1: number, lon2: number): number {
  let d = Math.abs(lon1 - lon2) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

export function signToElement(sign: ZodiacSign): Element {
  if (sign === "Aries" || sign === "Leo" || sign === "Sagittarius") return "fire";
  if (sign === "Taurus" || sign === "Virgo" || sign === "Capricorn") return "earth";
  if (sign === "Gemini" || sign === "Libra" || sign === "Aquarius") return "air";
  return "water";
}

export function signToModality(sign: ZodiacSign): Modality {
  if (sign === "Aries" || sign === "Cancer" || sign === "Libra" || sign === "Capricorn") return "cardinal";
  if (sign === "Taurus" || sign === "Leo" || sign === "Scorpio" || sign === "Aquarius") return "fixed";
  return "mutable";
}

function computeElementModality(planets: Record<PlanetKey, PlanetPosition>) {
  const weights: Record<PlanetKey, number> = {
    Sun: 3,
    Moon: 3,
    Mercury: 2,
    Venus: 2,
    Mars: 2,
    Jupiter: 1.5,
    Saturn: 1.5,
    Uranus: 1,
    Neptune: 1,
    Pluto: 1
  };

  const eSum: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const mSum: Record<Modality, number> = { cardinal: 0, fixed: 0, mutable: 0 };

  let total = 0;
  for (const k of Object.keys(planets) as PlanetKey[]) {
    const w = weights[k];
    total += w;
    eSum[signToElement(planets[k].sign)] += w;
    mSum[signToModality(planets[k].sign)] += w;
  }

  const elementPct = {
    fire: total ? eSum.fire / total : 0,
    earth: total ? eSum.earth / total : 0,
    air: total ? eSum.air / total : 0,
    water: total ? eSum.water / total : 0
  };

  const modalityPct = {
    cardinal: total ? mSum.cardinal / total : 0,
    fixed: total ? mSum.fixed / total : 0,
    mutable: total ? mSum.mutable / total : 0
  };

  return { elementPct, modalityPct };
}

function computeDignities(
  planets: Record<PlanetKey, PlanetPosition>
): Record<PlanetKey, Dignity> {
  const out = {} as Record<PlanetKey, Dignity>;
  for (const p of Object.keys(planets) as PlanetKey[]) {
    out[p] = dignityOfPlanetInSign(p, planets[p].sign);
  }
  return out;
}

function dignityOfPlanetInSign(planet: PlanetKey, sign: ZodiacSign): Dignity {
  const domicile: Partial<Record<PlanetKey, ZodiacSign[]>> = {
    Sun: ["Leo"],
    Moon: ["Cancer"],
    Mercury: ["Gemini", "Virgo"],
    Venus: ["Taurus", "Libra"],
    Mars: ["Aries", "Scorpio"],
    Jupiter: ["Sagittarius", "Pisces"],
    Saturn: ["Capricorn", "Aquarius"]
  };

  const detriment: Partial<Record<PlanetKey, ZodiacSign[]>> = {
    Sun: ["Aquarius"],
    Moon: ["Capricorn"],
    Mercury: ["Sagittarius", "Pisces"],
    Venus: ["Aries", "Scorpio"],
    Mars: ["Taurus", "Libra"],
    Jupiter: ["Gemini", "Virgo"],
    Saturn: ["Cancer", "Leo"]
  };

  const exalt: Partial<Record<PlanetKey, ZodiacSign[]>> = {
    Sun: ["Aries"],
    Moon: ["Taurus"],
    Mercury: ["Virgo"],
    Venus: ["Pisces"],
    Mars: ["Capricorn"],
    Jupiter: ["Cancer"],
    Saturn: ["Libra"]
  };

  const fall: Partial<Record<PlanetKey, ZodiacSign[]>> = {
    Sun: ["Libra"],
    Moon: ["Scorpio"],
    Mercury: ["Pisces"],
    Venus: ["Virgo"],
    Mars: ["Cancer"],
    Jupiter: ["Capricorn"],
    Saturn: ["Aries"]
  };

  if (domicile[planet]?.includes(sign)) return "domicile";
  if (exalt[planet]?.includes(sign)) return "exaltation";
  if (detriment[planet]?.includes(sign)) return "detriment";
  if (fall[planet]?.includes(sign)) return "fall";
  return "neutral";
}

function computeHouseWeights(planets: Record<PlanetKey, PlanetPosition>): Record<number, number> {
  const houseWeights: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) houseWeights[h] = 0;

  const weights: Record<PlanetKey, number> = {
    Sun: 3,
    Moon: 3,
    Mercury: 2,
    Venus: 2,
    Mars: 2,
    Jupiter: 1.5,
    Saturn: 1.5,
    Uranus: 1,
    Neptune: 1,
    Pluto: 1
  };

  for (const p of Object.keys(planets) as PlanetKey[]) {
    const h = planets[p].house;
    houseWeights[h] = (houseWeights[h] ?? 0) + weights[p];
  }
  return houseWeights;
}

function computeStressIndex(args: {
  aspects: Aspect[];
  houseWeights: Record<number, number>;
}): number {
  const { aspects, houseWeights } = args;

  const isHard = (t: AspectType) =>
    t === "square" || t === "opposition" || t === "conjunction";
  const has = (a: Aspect, planet: PlanetKey) => a.a === planet || a.b === planet;

  let hardSaturn = 0;
  let hardMars = 0;
  let hardNeptune = 0;

  for (const a of aspects) {
    if (!isHard(a.type)) continue;
    if (has(a, "Saturn")) hardSaturn++;
    if (has(a, "Mars")) hardMars++;
    if (has(a, "Neptune")) hardNeptune++;
  }

  const house12Weight = houseWeights[12] ?? 0;

  const raw =
    hardSaturn * 1.5 +
    hardMars * 1.0 +
    house12Weight * 0.5 +
    hardNeptune * 1.2;

  const NORMALIZER = 8;

  return clamp(raw / NORMALIZER, 0, 1);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

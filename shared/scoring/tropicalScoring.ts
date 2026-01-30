// Implements the fixed Tropical Chakra Scoring point table.
// MUST NOT emit nakshatra tags.

import type {
  TropicalChartFeatures,
  PlanetKey,
  Aspect,
  AspectType,
  Element
} from "../tropical";
import type { Domain, ChakraEvidence, ChakraSignal } from "./types";

export interface TropicalScoreResult {
  value: number;
  min: number;
  max: number;
  spread: number;
  timeSensitive: boolean;
  evidence: ChakraEvidence;
}

export type TropicalScoresMap = Record<Domain, TropicalScoreResult>;

const DOMAINS: Domain[] = ["root", "sacral", "solar", "heart", "throat", "thirdEye", "crown"];

const ELEMENT_DOMINANT = 0.35;
const ELEMENT_DEFICIENT = 0.15;

const ELEMENT_POINTS: Partial<Record<Domain, Partial<Record<Element, { dominant: number; deficient: number }>>>> = {
  root: { earth: { dominant: 8, deficient: -8 } },
  sacral: { water: { dominant: 8, deficient: -8 } },
  solar: { fire: { dominant: 8, deficient: -8 } },
  heart: { water: { dominant: 4, deficient: -4 }, air: { dominant: 4, deficient: -4 } },
  throat: { air: { dominant: 8, deficient: -8 } },
  thirdEye: { air: { dominant: 4, deficient: -4 }, water: { dominant: 4, deficient: -4 } },
  crown: { water: { dominant: 6, deficient: -6 } }
};

const HOUSE_POINTS: Record<Domain, Array<{ house: number; points: number }>> = {
  root: [
    { house: 1, points: 6 },
    { house: 6, points: 5 },
    { house: 2, points: 4 },
    { house: 12, points: -5 }
  ],
  sacral: [
    { house: 5, points: 6 },
    { house: 7, points: 6 },
    { house: 8, points: 4 },
    { house: 10, points: -4 }
  ],
  solar: [
    { house: 10, points: 7 },
    { house: 1, points: 5 },
    { house: 5, points: 5 },
    { house: 12, points: -4 }
  ],
  heart: [
    { house: 4, points: 6 },
    { house: 7, points: 6 },
    { house: 11, points: 4 },
    { house: 8, points: -4 }
  ],
  throat: [
    { house: 3, points: 7 },
    { house: 2, points: 6 },
    { house: 12, points: -5 }
  ],
  thirdEye: [
    { house: 9, points: 6 },
    { house: 11, points: 6 },
    { house: 6, points: -4 }
  ],
  crown: [
    { house: 12, points: 7 },
    { house: 9, points: 5 },
    { house: 1, points: -6 }
  ]
};

const PLANET_DOMAINS: Record<PlanetKey, Domain[]> = {
  Saturn: ["root"],
  Moon: ["sacral", "heart"],
  Venus: ["sacral", "heart"],
  Mars: ["solar"],
  Sun: ["solar"],
  Mercury: ["throat", "thirdEye"],
  Jupiter: ["heart", "crown"],
  Neptune: ["crown"],
  Uranus: ["thirdEye"],
  Pluto: ["sacral", "solar"]
};

const DIGNITY_POINTS: Record<string, number> = {
  domicile: 4,
  exaltation: 4,
  detriment: -4,
  fall: -4,
  neutral: 0
};

const ORB_MULT = (orb: number) => (orb <= 3 ? 1 : orb <= 6 ? 0.7 : orb <= 8 ? 0.4 : 0);

const HARMONIOUS: Record<AspectType, number> = {
  trine: 4,
  sextile: 3,
  conjunction: 3,
  square: 0,
  opposition: 0
};

const HARD: Record<AspectType, number> = {
  square: -5,
  opposition: -6,
  conjunction: -4,
  trine: 0,
  sextile: 0
};

const BENEFIC = new Set<PlanetKey>(["Venus", "Jupiter"]);
const MALEFIC = new Set<PlanetKey>(["Mars", "Saturn", "Pluto"]);

const ROUTES: Record<Domain, (a: PlanetKey, b: PlanetKey) => boolean> = {
  root: (a, b) =>
    includesPair([a, b], "Saturn", ["Moon", "Sun", "Mars"]) ||
    includesPair([a, b], "Saturn", ["Uranus", "Neptune", "Pluto"]) ||
    includesPair([a, b], "Saturn", ["Mercury", "Venus", "Jupiter"]),
  sacral: (a, b) =>
    includesAny([a, b], ["Moon", "Venus"]) && includesAny([a, b], ["Saturn", "Mars", "Pluto"]),
  solar: (a, b) =>
    includesAny([a, b], ["Sun", "Mars"]) && includesAny([a, b], ["Saturn", "Pluto"]),
  heart: (a, b) =>
    includesAny([a, b], ["Moon", "Venus"]) && includesAny([a, b], ["Saturn", "Pluto"]),
  throat: (a, b) =>
    includesAny([a, b], ["Mercury"]) && includesAny([a, b], ["Saturn", "Neptune", "Mars"]),
  thirdEye: (a, b) =>
    includesAny([a, b], ["Mercury"]) && includesAny([a, b], ["Neptune", "Uranus"]),
  crown: (a, b) =>
    includesAny([a, b], ["Neptune", "Jupiter"]) && includesAny([a, b], ["Saturn", "Pluto"])
};

export function computeTropicalChakraScores(features: TropicalChartFeatures): TropicalScoresMap {
  const out = {} as TropicalScoresMap;

  for (const domain of DOMAINS) {
    const signals: ChakraSignal[] = [];
    let score = 50;

    score += applyElementPoints(domain, features, signals);
    score += applyHousePoints(domain, features, signals);
    score += applyPlanetStrengthPoints(domain, features, signals);
    score += applyAspectPoints(domain, features, signals);
    score += applyStressMod(domain, features, signals);

    score = clamp(Math.round(score), 0, 100);

    const evidence: ChakraEvidence = {
      domain,
      signals: enforceEvidenceConstraints(signals),
      rawScore: score,
      adjustedScore: score,
      supportive: score >= 50
    };

    out[domain] = {
      value: score,
      min: score,
      max: score,
      spread: 0,
      timeSensitive: false,
      evidence
    };
  }

  return out;
}

function applyElementPoints(domain: Domain, f: TropicalChartFeatures, signals: ChakraSignal[]): number {
  const rule = ELEMENT_POINTS[domain];
  if (!rule) return 0;

  let delta = 0;
  for (const [el, pts] of Object.entries(rule) as Array<[Element, { dominant: number; deficient: number }]>) {
    const pct = f.elementPct[el] ?? 0;
    if (pct >= ELEMENT_DOMINANT) {
      delta += pts.dominant;
      signals.push(makeSignal({
        influence: pts.dominant >= 0 ? "supportive" : "challenging",
        weight: Math.abs(pts.dominant),
        source: "element",
        factor: `Element ${el} dominant`,
        reason: `Element ${el} is sterk aanwezig (${Math.round(pct * 100)}%).`
      }));
    } else if (pct <= ELEMENT_DEFICIENT) {
      delta += pts.deficient;
      signals.push(makeSignal({
        influence: pts.deficient >= 0 ? "supportive" : "challenging",
        weight: Math.abs(pts.deficient),
        source: "element",
        factor: `Element ${el} laag`,
        reason: `Element ${el} is relatief laag (${Math.round(pct * 100)}%).`
      }));
    }
  }
  return delta;
}

function applyHousePoints(domain: Domain, f: TropicalChartFeatures, signals: ChakraSignal[]): number {
  const isStrong = (h: number) => (f.houseWeights[h] ?? 0) >= 5;

  let delta = 0;
  for (const row of HOUSE_POINTS[domain]) {
    const h = row.house;
    if (!isStrong(h)) continue;

    delta += row.points;

    signals.push(makeSignal({
      influence: row.points >= 0 ? "supportive" : "challenging",
      weight: Math.abs(row.points),
      source: "house",
      factor: `Huis ${h} nadruk`,
      reason: `Huis ${h} heeft relatief veel planetaire nadruk (weight=${(f.houseWeights[h] ?? 0).toFixed(1)}).`
    }));
  }
  return delta;
}

function applyPlanetStrengthPoints(domain: Domain, f: TropicalChartFeatures, signals: ChakraSignal[]): number {
  let delta = 0;

  const isAngular = (h: number) => h === 1 || h === 4 || h === 7 || h === 10;

  for (const [planet, domains] of Object.entries(PLANET_DOMAINS) as Array<[PlanetKey, Domain[]]>) {
    if (!domains.includes(domain)) continue;

    const pos = f.planets[planet];
    const dignity = f.dignityByPlanet[planet];
    const dPts = DIGNITY_POINTS[dignity] ?? 0;

    let p = dPts;
    if (isAngular(pos.house)) p += 2;
    if (pos.retrograde) p -= 1;

    if (p === 0) continue;

    delta += p;

    signals.push(makeSignal({
      influence: p >= 0 ? "supportive" : "challenging",
      weight: Math.abs(p),
      source: "planet",
      factor: `${planet} sterkte`,
      reason: `Dignity: ${dignity}${isAngular(pos.house) ? ", angular" : ""}${pos.retrograde ? ", retrograde" : ""}.`
    }));
  }

  return delta;
}

function applyAspectPoints(domain: Domain, f: TropicalChartFeatures, signals: ChakraSignal[]): number {
  let delta = 0;

  for (const a of f.aspects) {
    if (!ROUTES[domain](a.a, a.b)) continue;

    const mult = ORB_MULT(a.orbDeg);
    if (mult <= 0) continue;

    const rawPts = aspectPoints(a);
    if (rawPts === 0) continue;

    const pts = rawPts * mult;
    delta += pts;

    signals.push(makeSignal({
      influence: pts >= 0 ? "supportive" : "challenging",
      weight: Math.abs(pts),
      source: "aspect",
      factor: `${a.a} ${a.type} ${a.b}`,
      reason: `Aspect ${a.type} met orb ${a.orbDeg.toFixed(1)}° (mult ${mult}).`
    }));
  }

  return delta;
}

function aspectPoints(a: Aspect): number {
  if (a.type === "conjunction") {
    const hasBenefic = BENEFIC.has(a.a) || BENEFIC.has(a.b);
    const hasMalefic = MALEFIC.has(a.a) || MALEFIC.has(a.b);

    if (hasMalefic && !hasBenefic) return HARD.conjunction;
    return HARMONIOUS.conjunction;
  }

  if (a.type === "trine" || a.type === "sextile") return HARMONIOUS[a.type];
  if (a.type === "square" || a.type === "opposition") return HARD[a.type];

  return 0;
}

function applyStressMod(domain: Domain, f: TropicalChartFeatures, signals: ChakraSignal[]): number {
  const s = f.stressIndex;

  let pts = 0;
  if (domain === "root") pts = -6 * s;
  if (domain === "sacral") pts = -5 * s;
  if (domain === "solar") pts = 3 * s;
  if (domain === "heart") pts = -4 * s;
  if (domain === "throat") pts = -3 * s;
  if (domain === "thirdEye") pts = -4 * s;
  if (domain === "crown") pts = -6 * s;

  if (Math.abs(pts) > 0.0001) {
    signals.push(makeSignal({
      influence: pts >= 0 ? "supportive" : "challenging",
      weight: Math.abs(pts),
      source: "stress",
      factor: "Stress-index modulatie",
      reason: `Stress-index ${Math.round(s * 100)}% beïnvloedt dit domein.`
    }));
  }

  if (domain === "solar" && s > 0.5) {
    signals.push(makeSignal({
      influence: "challenging",
      weight: 3,
      source: "stress",
      factor: "Overdrive-signaal",
      reason: "Hoge stress-index kan drive verhogen maar ook druk/overdrive veroorzaken."
    }));
  }

  return pts;
}

function enforceEvidenceConstraints(signals: ChakraSignal[]): ChakraSignal[] {
  const filtered = signals.filter(
    (signal) =>
      !signal.factor.toLowerCase().includes("nakshatra") &&
      !signal.reason.toLowerCase().includes("nakshatra")
  );

  return filtered
    .slice()
    .sort((a, b) => b.weight - a.weight || a.factor.localeCompare(b.factor))
    .slice(0, 8);
}

function makeSignal(args: {
  influence: ChakraSignal["influence"];
  weight: number;
  source: ChakraSignal["source"];
  factor: string;
  reason: string;
}): ChakraSignal {
  return {
    source: args.source,
    factor: args.factor,
    reason: args.reason,
    influence: args.influence,
    weight: args.weight
  };
}

function includesAny(pair: PlanetKey[], set: PlanetKey[]) {
  return set.includes(pair[0]) || set.includes(pair[1]);
}

function includesPair(pair: PlanetKey[], anchor: PlanetKey, others: PlanetKey[]) {
  const hasAnchor = pair[0] === anchor || pair[1] === anchor;
  const other = pair[0] === anchor ? pair[1] : pair[1] === anchor ? pair[0] : null;
  return !!(hasAnchor && other && others.includes(other));
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

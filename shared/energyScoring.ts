import type {
  AstroSystem,
  ChineseMethod,
  Domain,
  EnergyScoringResult,
  EnergySelection,
  EnergySignal,
  ChakraProfile,
} from "./schema";
import { DOMAINS } from "./schema";
import type { ProfileInput } from "./schema";
import type { BodyProfile } from "./schema";
import type { EnergyProfileResult } from "./energyProfile";

export type ChineseEngineKind = "bazi" | "shengxiao";

const VIEW_LABELS: Record<string, string> = {
  sidereal: "Oosters",
  tropical: "Westers",
  "chinese:bazi": "Chinees (BaZi)",
  "chinese:shengxiao": "Chinees (Shengxiao)",
};

export function chartSignatureFrom(input: ProfileInput, selection: EnergySelection): string {
  const base = JSON.stringify({
    date: input.birthDate,
    time: input.birthTime || "unknown",
    timeUnknown: !!input.timeUnknown,
    place: input.birthPlace,
    country: input.country,
    timezone: input.timezone,
    lat: input.latitude ?? null,
    lon: input.longitude ?? null,
    system: selection.system,
    method: selection.method ?? null,
  });
  let h = 5381;
  for (let i = 0; i < base.length; i++) h = ((h << 5) + h) + base.charCodeAt(i);
  return `sig_${(h >>> 0).toString(16)}`;
}

function getParityNotes(system: AstroSystem) {
  const siderealVsTropical = [
    { id: "ayanamsa", systemPair: "sidereal-vs-tropical" as const, shortNL: "Sidereaal corrigeert voor precessie via ayanamsha; tropisch niet.", tags: ["difference:ayanamsa", "difference:precession"] },
    { id: "reference-frame", systemPair: "sidereal-vs-tropical" as const, shortNL: "Sidereaal gebruikt vaste sterren; tropisch gebruikt seizoens-equinox.", tags: ["difference:reference-frame", "difference:seasonal-zodiac"] },
    { id: "nakshatra", systemPair: "sidereal-vs-tropical" as const, shortNL: "Nakshatra-signalen worden alleen in de sidereale methode gebruikt.", tags: ["difference:nakshatra"] },
  ];
  const chineseVsWestern = [
    { id: "calendar-basis", systemPair: "chinese-vs-western" as const, shortNL: "Chinees werkt met lunisolaire cycli; westers met longituden in de dierenriem.", tags: ["difference:calendar", "difference:lunisolar"] },
    { id: "pillar-model", systemPair: "chinese-vs-western" as const, shortNL: "Chinees model gebruikt pilaren en tijdblokken i.p.v. aspect/huis-geometrie.", tags: ["difference:pillars", "difference:time-segmentation"] },
    { id: "element-system", systemPair: "chinese-vs-western" as const, shortNL: "Chinees gebruikt Wu Xing (5 elementen) als primaire balans-as.", tags: ["difference:wu-xing"] },
  ];
  return system === "chinese" ? chineseVsWestern : siderealVsTropical;
}

function normalizeSignal(system: AstroSystem, domain: Domain, signal: any): EnergySignal {
  const category = signal.category ?? signal.source ?? "other";
  const tags = new Set<string>(signal.tags || []);
  tags.add(`system:${system}`);
  tags.add(`category:${category}`);
  tags.add(`domain:${domain}`);
  return {
    source: signal.source ?? category,
    influence: signal.influence,
    weight: Number(signal.weight ?? 0),
    factor: signal.factor ?? signal.source ?? "Onbekende factor",
    reason: signal.reason ?? "Geen reden beschikbaar",
    tags: Array.from(tags).sort(),
    category,
    meta: signal.meta,
  };
}

function selectSignalsDeterministic(signals: EnergySignal[], maxSignals = 9) {
  const sorted = [...signals].sort((a, b) =>
    b.weight - a.weight || a.factor.localeCompare(b.factor) || a.tags.join("|").localeCompare(b.tags.join("|"))
  );

  const selected: EnergySignal[] = [];
  const categories = new Set<string>();
  let supportiveCount = 0;
  let challengingCount = 0;

  for (const signal of sorted) {
    if (selected.length >= maxSignals) break;
    selected.push(signal);
    categories.add(signal.category);
    if (signal.influence === "supportive") supportiveCount++;
    if (signal.influence === "challenging") challengingCount++;
  }

  let usedFallback = false;
  if (selected.length > 0 && categories.size < 2 && sorted.length > selected.length) {
    const extra = sorted.find((s) => !categories.has(s.category));
    if (extra) {
      selected[selected.length - 1] = extra;
      categories.add(extra.category);
    }
  }

  if (selected.length === 0) {
    usedFallback = true;
    selected.push({
      source: "fallback",
      influence: "neutral",
      weight: 0.1,
      factor: "Fallback-signaal",
      reason: "Onvoldoende directe signalen beschikbaar; neutrale fallback toegepast.",
      tags: ["source:fallback", "category:fallback"],
      category: "fallback",
      meta: { fallback: true },
    });
  }

  return {
    selected,
    selection: {
      totalSignals: selected.length,
      supportiveCount,
      challengingCount,
      categoriesPresent: Array.from(categories).sort(),
      usedFallback,
    },
  };
}

export function scoringFromBodyProfile(profile: BodyProfile, system: "sidereal" | "tropical"): EnergyScoringResult {
  const input = profile.input;
  const signature = chartSignatureFrom(input, { system });
  const domains = DOMAINS.map((domain) => {
    const chakra = profile.chakraProfiles.find((c) => c.domain === domain) as ChakraProfile | undefined;
    const score = profile.domainScores[domain];
    const mappedSignals = (chakra?.signals ?? []).map((signal) => normalizeSignal(system, domain, signal));
    const { selected, selection } = selectSignalsDeterministic(mappedSignals);
    return {
      domainId: domain,
      score: score.value,
      scoreMin: score.min,
      scoreMax: score.max,
      spread: score.spread,
      evidence: {
        rawScore: chakra?.evidence.rawScore ?? score.value,
        adjustedScore: chakra?.evidence.adjustedScore ?? score.value,
        signals: selected,
        selection,
      },
    };
  });

  return {
    kind: "chakra",
    system,
    viewLabelNL: VIEW_LABELS[system],
    chartSignature: signature,
    time: {
      provided: !input.timeUnknown && !!input.birthTime,
      timeSensitive: !!input.timeUnknown || domains.some((d) => d.spread > 0),
      samples: input.timeUnknown ? 12 : undefined,
    },
    domains,
    explain: { parityNotes: getParityNotes(system) },
  };
}

const BAZI_ELEMENT_DOMAIN_WEIGHTS: Record<string, Partial<Record<Domain, number>>> = {
  water: { sacral: 0.45, heart: 0.25, crown: 0.3 },
  fire: { solar: 0.55, heart: 0.2, throat: 0.25 },
  earth: { root: 0.6, solar: 0.2, sacral: 0.2 },
  metal: { throat: 0.45, thirdEye: 0.4, root: 0.15 },
  wood: { heart: 0.35, solar: 0.35, crown: 0.3 },
};

function baziDomains(result: EnergyProfileResult, method: ChineseMethod) {
  const elements = result.chinese_bazi.elements_visible;
  const yin = result.chinese_bazi.polarity_visible.yin?.ratio ?? 0;
  const yang = result.chinese_bazi.polarity_visible.yang?.ratio ?? 0;
  const domains = DOMAINS.map((domain) => {
    const signals: EnergySignal[] = [];
    let raw = 35;

    for (const [element, weights] of Object.entries(BAZI_ELEMENT_DOMAIN_WEIGHTS)) {
      const ratio = elements[element]?.ratio ?? 0;
      const weight = (weights[domain] ?? 0) * ratio * 100;
      if (weight === 0) continue;
      raw += weight;
      signals.push({
        source: "element",
        influence: weight >= 0 ? "supportive" : "challenging",
        weight: Math.abs(weight),
        factor: `Element ${element}`,
        reason: `Elementratio ${element} draagt ${weight.toFixed(2)} bij aan ${domain}.`,
        tags: [`system:chinese`, `method:${method}`, `element:${element}`, `domain:${domain}`],
        category: "element",
        meta: { element, ratio },
      });
    }

    for (const [pillarId, pillar] of Object.entries(result.chinese_bazi.pillars)) {
      signals.push({
        source: "pillar",
        influence: "neutral",
        weight: 1,
        factor: `${pillarId} pillar`,
        reason: `Pijler ${pillarId}: stam ${pillar.stem_id}, tak ${pillar.branch_id}.`,
        tags: [`system:chinese`, `method:${method}`, `pillar:${pillarId}`, `stem:${pillar.stem_id}`, `branch:${pillar.branch_id}`, `domain:${domain}`],
        category: "pillar",
        meta: pillar,
      });
    }

    const polarityDelta = (yang - yin) * 8;
    raw += polarityDelta;
    signals.push({
      source: "polarity",
      influence: polarityDelta >= 0 ? "supportive" : "challenging",
      weight: Math.abs(polarityDelta),
      factor: "Yin/Yang balans",
      reason: `Yin/Yang verschil ${polarityDelta.toFixed(2)} op domeinscore.`,
      tags: [`system:chinese`, `method:${method}`, `yin:${yin.toFixed(3)}`, `yang:${yang.toFixed(3)}`, `domain:${domain}`],
      category: "polarity",
      meta: { yin, yang },
    });

    const score = Math.max(0, Math.min(100, Math.round(raw)));
    const { selected, selection } = selectSignalsDeterministic(signals);

    return {
      domainId: domain,
      score,
      scoreMin: score,
      scoreMax: score,
      spread: 0,
      evidence: { rawScore: raw, adjustedScore: score, signals: selected, selection },
    };
  });
  return domains;
}

const BRANCH_ANIMALS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "goat", "monkey", "rooster", "dog", "pig"];
const STEM_ELEMENTS = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const STEM_POLARITY = ["yang", "yin", "yang", "yin", "yang", "yin", "yang", "yin", "yang", "yin"];

function parseIdx(value: string, prefix: string, modulo: number) {
  const n = Number(value.replace(prefix, ""));
  if (!Number.isFinite(n)) return 0;
  return (n - 1 + modulo) % modulo;
}

function shengxiaoDomains(result: EnergyProfileResult) {
  const year = result.chinese_bazi.pillars.year;
  const branchIdx = parseIdx(year.branch_id, "branch_", 12);
  const stemIdx = parseIdx(year.stem_id, "stem_", 10);
  const animal = BRANCH_ANIMALS[branchIdx];
  const element = STEM_ELEMENTS[stemIdx];
  const polarity = STEM_POLARITY[stemIdx];

  const domains = DOMAINS.map((domain, idx) => {
    const seed = (branchIdx * 7 + stemIdx * 11 + idx * 13) % 31;
    const score = 45 + seed;
    const signals: EnergySignal[] = [
      {
        source: "animal",
        influence: "neutral",
        weight: 6,
        factor: `Shengxiao dier ${animal}`,
        reason: `Jaar-tak correspondeert met dier ${animal}.`,
        tags: [`system:chinese`, "method:shengxiao", `animal:${animal}`, `domain:${domain}`],
        category: "animal",
      },
      {
        source: "element",
        influence: "supportive",
        weight: 5,
        factor: `Jaar-element ${element}`,
        reason: `Jaar-stam correspondeert met element ${element}.`,
        tags: [`system:chinese`, "method:shengxiao", `element:${element}`, `domain:${domain}`],
        category: "element",
      },
      {
        source: "polarity",
        influence: "neutral",
        weight: 3,
        factor: `Jaarpolariteit ${polarity}`,
        reason: `Jaar-stam polariteit is ${polarity}.`,
        tags: [`system:chinese`, "method:shengxiao", `polarity:${polarity}`, `domain:${domain}`],
        category: "polarity",
      },
    ];
    const { selected, selection } = selectSignalsDeterministic(signals);
    return {
      domainId: domain,
      score,
      scoreMin: score,
      scoreMax: score,
      spread: 0,
      evidence: { rawScore: score, adjustedScore: score, signals: selected, selection },
    };
  });
  return { domains, animal, element, polarity };
}

export function scoringFromChineseResult(input: ProfileInput, result: EnergyProfileResult, method: ChineseMethod): EnergyScoringResult {
  const signature = chartSignatureFrom(input, { system: "chinese", method });
  if (method === "shengxiao") {
    const out = shengxiaoDomains(result);
    return {
      kind: "chakra",
      system: "chinese",
      method,
      viewLabelNL: VIEW_LABELS["chinese:shengxiao"],
      chartSignature: signature,
      time: {
        provided: !input.timeUnknown && !!input.birthTime,
        timeSensitive: !!input.timeUnknown,
        samples: input.timeUnknown ? 12 : undefined,
      },
      domains: out.domains,
      explain: { parityNotes: getParityNotes("chinese") },
    };
  }

  return {
    kind: "chakra",
    system: "chinese",
    method,
    viewLabelNL: VIEW_LABELS["chinese:bazi"],
    chartSignature: signature,
    time: {
      provided: !input.timeUnknown && !!input.birthTime,
      timeSensitive: !!input.timeUnknown,
      samples: input.timeUnknown ? 12 : undefined,
    },
    domains: baziDomains(result, method),
    explain: { parityNotes: getParityNotes("chinese") },
  };
}

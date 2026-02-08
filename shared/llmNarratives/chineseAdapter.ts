/**
 * Chinese (BaZi) profile adapter for Narrative Engine.
 * Maps EnergyProfileResult / bazi domain scores to NarrativeGenerateInput.
 * Placeholder: when Chinese features are missing, outputs generic structured profile.
 */

import type { EnergyProfileResult } from "../energyProfile";
import type { NarrativeGenerateInput, ChineseFeaturesPlaceholder } from "./types";
import type { Domain } from "../schema";
import { computeBaziDomainScores } from "../scoring/baziDomainScoring";
import { DOMAINS } from "../schema";

const ELEMENT_API_TO_NAME: Record<string, string> = {
  element_01: "wood",
  element_02: "fire",
  element_03: "earth",
  element_04: "metal",
  element_05: "water",
};

const POLARITY_API_TO_NAME: Record<string, string> = {
  polarity_01: "yin",
  polarity_02: "yang",
};

export function buildChineseFeaturesFromEnergyProfile(
  result: EnergyProfileResult
): ChineseFeaturesPlaceholder {
  const bazi = result.chinese_bazi;
  const elements: Record<string, number> = {};
  for (const [key, balance] of Object.entries(bazi.elements_visible ?? {})) {
    const name = ELEMENT_API_TO_NAME[key] ?? key;
    elements[name] = (balance as { ratio?: number })?.ratio ?? 0;
  }
  const polarity: { yin?: number; yang?: number } = {};
  for (const [key, balance] of Object.entries(bazi.polarity_visible ?? {})) {
    const name = POLARITY_API_TO_NAME[key] ?? key;
    (polarity as Record<string, number>)[name] = (balance as { ratio?: number })?.ratio ?? 0;
  }
  const dayMaster = ELEMENT_API_TO_NAME[bazi.day_master?.element_id ?? ""] ?? bazi.day_master?.element_id;
  return {
    elements: Object.keys(elements).length > 0 ? elements : undefined,
    polarity: Object.keys(polarity).length > 0 ? polarity : undefined,
    dayMaster,
    luckPillars: bazi.luck_cycles ?? undefined,
  };
}

export function buildNarrativeInputFromChinese(
  energyProfile: EnergyProfileResult,
  narrativeVersion: string,
  timeUnknown: boolean,
  locationLabel?: string,
  timezone?: string
): NarrativeGenerateInput {
  const domainScores = computeBaziDomainScores(energyProfile);
  const chineseFeatures = buildChineseFeaturesFromEnergyProfile(energyProfile);

  const hasEnoughFeatures = Boolean(
    chineseFeatures.elements && Object.keys(chineseFeatures.elements).length >= 2
  );

  const chakraScores = DOMAINS.map((domain) => {
    const score = domainScores[domain];
    const signals = buildSignalsFromChineseFeatures(
      domain,
      chineseFeatures,
      hasEnoughFeatures
    );
    return {
      domain,
      value: score.value,
      min: score.min,
      max: score.max,
      spread: score.spread,
      timeSensitive: score.timeSensitive,
      signals,
    };
  });

  return {
    systemType: "chinese",
    view: "bazi",
    narrativeVersion,
    timeUnknown,
    locationLabel,
    timezone,
    chakraScores,
    chineseFeatures: hasEnoughFeatures ? chineseFeatures : undefined,
  };
}

function buildSignalsFromChineseFeatures(
  domain: Domain,
  features: ChineseFeaturesPlaceholder,
  hasEnough: boolean
): NarrativeGenerateInput["chakraScores"][0]["signals"] {
  const signals: NarrativeGenerateInput["chakraScores"][0]["signals"] = [];

  if (!hasEnough || !features.elements) {
    signals.push({
      source: "chinese",
      factor: "Chinese kenmerken beperkt beschikbaar",
      influence: "neutral",
      weight: 1,
      reason: "Niet genoeg Chinese kenmerken beschikbaar; toon basisprofiel",
      tags: ["source:chinese", "placeholder"],
    });
    return signals;
  }

  const elements = features.elements;
  const topElements = Object.entries(elements)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  for (const [name, ratio] of topElements) {
    if (ratio > 0.15) {
      signals.push({
        source: "element",
        factor: `${name}-element (${(ratio * 100).toFixed(0)}%)`,
        influence: ratio > 0.25 ? "supportive" : "neutral",
        weight: ratio * 10,
        reason: `Elementbalans in BaZi-pillaren`,
        tags: [`source:element`, `element:${name}`, `domain:${domain}`],
      });
    }
  }

  if (features.polarity?.yin != null || features.polarity?.yang != null) {
    const yin = features.polarity.yin ?? 0;
    const yang = features.polarity.yang ?? 0;
    const dominant = yin > yang ? "yin" : "yang";
    signals.push({
      source: "polarity",
      factor: `Yin/yang-balans (${dominant} dominant)`,
      influence: "neutral",
      weight: 2,
      reason: "Polariteitsbalans uit dagpilaren",
      tags: [`source:polarity`, `polarity:${dominant}`, `domain:${domain}`],
    });
  }

  if (features.dayMaster) {
    signals.push({
      source: "dayMaster",
      factor: `Dagmeester: ${features.dayMaster}`,
      influence: "supportive",
      weight: 3,
      reason: "Dagmeester-element uit BaZi",
      tags: [`source:dayMaster`, `element:${features.dayMaster}`, `domain:${domain}`],
    });
  }

  return signals.length > 0 ? signals : [
    {
      source: "chinese",
      factor: "BaZi-domeinscores",
      influence: "neutral",
      weight: 1,
      reason: "Indicatief op basis van element- en polariteitsbalans",
      tags: ["source:chinese", `domain:${domain}`],
    },
  ];
}

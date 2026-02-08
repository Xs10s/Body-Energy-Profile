/**
 * Adapters to convert BodyProfile / EnergyProfileResult to NarrativeGenerateInput.
 */

import type { BodyProfile } from "../schema";
import type { EnergyProfileResult } from "../energyProfile";
import type { NarrativeGenerateInput } from "./types";
import type { AstroView } from "../schema";
import { buildNarrativeInputFromChinese } from "./chineseAdapter";

const NARRATIVE_VERSION = "1.0.0";

function viewToSystemType(view: AstroView): NarrativeGenerateInput["systemType"] {
  if (view === "bazi") return "chinese";
  if (view === "tropical") return "tropical";
  return "jyotish";
}

function viewToNarrativeView(view: AstroView): NarrativeGenerateInput["view"] {
  return view;
}

/**
 * Convert BodyProfile (sidereal or tropical) to NarrativeGenerateInput.
 */
export function bodyProfileToNarrativeInput(
  profile: BodyProfile,
  narrativeVersion = NARRATIVE_VERSION
): NarrativeGenerateInput {
  const view = profile.view ?? "sidereal";
  const systemType = viewToSystemType(view);

  const chakraScores = profile.chakraProfiles.map((cp) => ({
    domain: cp.domain,
    value: cp.score,
    min: cp.scoreMin,
    max: cp.scoreMax,
    spread: profile.domainScores[cp.domain]?.spread ?? 0,
    timeSensitive: cp.timeSensitive,
    signals: cp.signals.map((s) => ({
      source: s.source,
      factor: s.factor,
      influence: s.influence,
      weight: s.weight,
      reason: s.reason,
      tags: s.tags,
    })),
  }));

  const locationLabel = profile.input?.birthPlace
    ? `${profile.input.birthPlace}, ${profile.input.country ?? ""}`
    : undefined;

  return {
    systemType,
    view: viewToNarrativeView(view),
    narrativeVersion,
    timeUnknown: profile.derived?.timeUnknown ?? false,
    locationLabel,
    timezone: profile.input?.timezone,
    chakraScores,
  };
}

/**
 * Convert EnergyProfileResult (BaZi) + metadata to NarrativeGenerateInput.
 */
export function energyProfileToNarrativeInput(
  energyProfile: EnergyProfileResult,
  timeUnknown: boolean,
  locationLabel?: string,
  timezone?: string,
  narrativeVersion = NARRATIVE_VERSION
): NarrativeGenerateInput {
  return buildNarrativeInputFromChinese(
    energyProfile,
    narrativeVersion,
    timeUnknown,
    locationLabel,
    timezone
  );
}

export { NARRATIVE_VERSION };

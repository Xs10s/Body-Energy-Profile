// Single entrypoint for profile generation; only branching point for sidereal vs tropical.

import type { Domain } from "./schema";
import type { ProfileInput } from "./schema";
import type { BirthInput } from "./tropical";
import { buildTropicalChartFeatures } from "./tropical";
import { computeTropicalChakraScores, type TropicalScoresMap } from "./scoring/tropicalScoring";
import { computeChakraEvidence, type ChakraEvidence } from "./chakraScoring";
import { computeChart } from "./jyotish";
import { buildChakraProfiles } from "./chakraNarrative";

export type AstroView = "sidereal" | "tropical";

export interface GeneratedProfile {
  view: AstroView;
  chakraProfiles: ReturnType<typeof buildChakraProfiles>;
}

export function generateProfileByView(input: ProfileInput, view: AstroView): GeneratedProfile {
  if (view === "tropical") {
    const birthInput: BirthInput = {
      dateISO: input.birthDate,
      timeHHmm: input.birthTime ?? undefined,
      timezone: input.timezone,
      lat: input.latitude ?? 0,
      lon: input.longitude ?? 0
    };

    const chart = buildTropicalChartFeatures(birthInput, { houseSystemPreference: "placidus" });
    const scoresMap = computeTropicalChakraScores(chart);

    const { evidenceMap, normalizedScoresMap, signature } =
      adaptScoresToChakraProfiles(scoresMap, input);

    const chakraProfiles = buildChakraProfiles(evidenceMap, normalizedScoresMap, signature);

    return {
      view,
      chakraProfiles
    };
  }

  const chart = computeChart({ ...input, zodiacMode: "sidereal" });
  const evidenceMap = computeChakraEvidence(chart);

  const normalizedScoresMap: Record<Domain, { value: number; min: number; max: number; spread: number; timeSensitive: boolean }> =
    {} as Record<Domain, { value: number; min: number; max: number; spread: number; timeSensitive: boolean }>;

  for (const domain of Object.keys(evidenceMap) as Domain[]) {
    const score = Math.round(evidenceMap[domain].adjustedScore);
    normalizedScoresMap[domain] = {
      value: score,
      min: score,
      max: score,
      spread: 0,
      timeSensitive: false
    };
  }

  const signature = `${input.birthDate}-${input.birthPlace}-${input.birthTime || "unknown"}`;
  const chakraProfiles = buildChakraProfiles(evidenceMap, normalizedScoresMap, signature);

  return {
    view,
    chakraProfiles
  };
}

export function adaptScoresToChakraProfiles(
  scoresMap: TropicalScoresMap,
  input: ProfileInput
): {
  evidenceMap: Record<Domain, ChakraEvidence>;
  normalizedScoresMap: Record<Domain, { value: number; min: number; max: number; spread: number; timeSensitive: boolean }>;
  signature: string;
} {
  const evidenceMap: Record<Domain, ChakraEvidence> = {} as Record<Domain, ChakraEvidence>;
  const normalizedScoresMap: Record<Domain, { value: number; min: number; max: number; spread: number; timeSensitive: boolean }> =
    {} as Record<Domain, { value: number; min: number; max: number; spread: number; timeSensitive: boolean }>;

  for (const domain of Object.keys(scoresMap) as Domain[]) {
    const result = scoresMap[domain];
    evidenceMap[domain] = result.evidence;
    normalizedScoresMap[domain] = {
      value: result.value,
      min: result.min,
      max: result.max,
      spread: result.spread,
      timeSensitive: result.timeSensitive
    };
  }

  const signature = `${input.birthDate}-${input.birthPlace}-${input.birthTime || "unknown"}-tropical`;

  return { evidenceMap, normalizedScoresMap, signature };
}

// Single entrypoint for profile generation; only branching point for sidereal vs tropical.

import type { AstroView, BodyProfile, Domain, ProfileInput } from "./schema";
import type { BirthInput } from "./tropical";
import { buildTropicalChartFeatures } from "./tropical";
import { computeTropicalChakraScores, type TropicalScoresMap } from "./scoring/tropicalScoring";
import { buildChakraProfiles } from "./chakraNarrative";
import { generateProfile } from "./scoring";
import type { ChakraEvidence } from "./chakraScoring";

export function normalizeAstroView(input?: ProfileInput | null): AstroView {
  if (input?.zodiacMode === "tropical") {
    return "tropical";
  }
  return "sidereal";
}

export function getViewLabelNL(view: AstroView): string {
  return view === "tropical" ? "Westers" : "Oosters";
}

export function normalizeProfileView(profile: BodyProfile): BodyProfile {
  const view = profile.view ?? normalizeAstroView(profile.input);
  const viewLabelNL = profile.viewLabelNL ?? getViewLabelNL(view);
  return {
    ...profile,
    view,
    viewLabelNL,
    input: {
      ...profile.input,
      zodiacMode: view
    }
  };
}

export function generateProfileByView(input: ProfileInput, view: AstroView): BodyProfile {
  const normalizedView = view ?? "sidereal";
  const normalizedInput: ProfileInput = {
    ...input,
    zodiacMode: normalizedView
  };

  if (normalizedView === "tropical") {
    const baseProfile = generateProfile(normalizedInput);

    const birthInput: BirthInput = {
      dateISO: normalizedInput.birthDate,
      timeHHmm: normalizedInput.birthTime ?? undefined,
      timezone: normalizedInput.timezone,
      lat: normalizedInput.latitude ?? 0,
      lon: normalizedInput.longitude ?? 0
    };

    const chart = buildTropicalChartFeatures(birthInput, { houseSystemPreference: "placidus" });
    const scoresMap = computeTropicalChakraScores(chart);
    const { evidenceMap, normalizedScoresMap, signature } = adaptScoresToChakraProfiles(scoresMap, normalizedInput);

    const chakraProfiles = buildChakraProfiles(evidenceMap, normalizedScoresMap, signature);

    return {
      ...baseProfile,
      view: normalizedView,
      viewLabelNL: getViewLabelNL(normalizedView),
      chakraProfiles,
      input: normalizedInput,
    };
  }

  // Sidereal (default)
  const profile = generateProfile({ ...normalizedInput, zodiacMode: "sidereal" });

  return {
    ...profile,
    view: normalizedView,
    viewLabelNL: getViewLabelNL(normalizedView),
    input: normalizedInput,
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

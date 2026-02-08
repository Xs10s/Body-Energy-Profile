/**
 * Merge NarrativeJSON into BodyProfile for display.
 * Keeps scores/evidence from profile; replaces text with narrative when available.
 */

import type { BodyProfile, ChakraProfile, ChakraSignal } from "../schema";
import type { NarrativeJSON, ChakraNarrativeItem } from "./types";

function evidenceBulletsToSignals(bullets: string[]): ChakraSignal[] {
  return bullets.map((b) => ({
    source: "narrative",
    factor: b,
    influence: "neutral" as const,
    weight: 1,
    reason: "",
    tags: [],
  }));
}

export function mergeNarrativeIntoProfile(
  profile: BodyProfile,
  narrative: NarrativeJSON
): BodyProfile {
  const chakraSection = narrative.sections.find((s) => s.id === "chakraProfile");
  if (!chakraSection || !("items" in chakraSection)) {
    return profile;
  }

  const items = (chakraSection as { items: ChakraNarrativeItem[] }).items;
  const itemsByDomain = new Map(items.map((i) => [i.chakraDomain, i]));

  const mergedChakraProfiles: ChakraProfile[] = profile.chakraProfiles.map(
    (cp) => {
      const item = itemsByDomain.get(cp.domain);
      if (!item) return cp;

      return {
        ...cp,
        naturalTrend: item.naturalTrendNL,
        balanced: item.balancedNL,
        imbalanced: item.imbalancedNL,
        practicalResets: item.practicalResetsNL,
        signals:
          item.evidenceBulletsNL?.length > 0
            ? evidenceBulletsToSignals(item.evidenceBulletsNL)
            : cp.signals,
      };
    }
  );

  const bulletsBySection = new Map<string, string[]>();
  for (const s of narrative.sections) {
    if ("bulletsNL" in s) {
      bulletsBySection.set(s.id, s.bulletsNL);
    }
  }

  const sectionMap: Record<string, { bullets: string[]; paragraph: string; nextStep: string }> = {
    strengths: profile.sections.strengths,
    weaknesses: profile.sections.weaknesses,
    base: profile.sections.base,
    nutrition: profile.sections.nutrition,
    movement: profile.sections.movement,
    strengthBuilding: profile.sections.strengthBuilding,
    flexibility: profile.sections.flexibility,
    functionality: profile.sections.functionality,
  };

  const idToKey: Record<string, keyof BodyProfile["sections"]> = {
    strengths: "strengths",
    weaknesses: "weaknesses",
    nutrition: "nutrition",
    movement: "movement",
    strengthBuild: "strengthBuilding",
    flexibility: "flexibility",
    functionality: "functionality",
  };

  const mergedSections = { ...profile.sections };
  for (const [id, key] of Object.entries(idToKey)) {
    const bullets = bulletsBySection.get(id);
    if (bullets && sectionMap[key]) {
      mergedSections[key] = {
        ...sectionMap[key],
        bullets,
      };
    }
  }

  return {
    ...profile,
    chakraProfiles: mergedChakraProfiles,
    sections: mergedSections,
    disclaimer: {
      ...profile.disclaimer,
      text: narrative.disclaimerNL,
    },
  };
}

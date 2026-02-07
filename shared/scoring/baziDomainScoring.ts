import type { Domain, DomainScore } from "../schema";
import type { EnergyProfileResult } from "../energyProfile";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const elementRatio = (
  elements: EnergyProfileResult["chinese_bazi"]["elements_visible"],
  elementId: string
) => elements[elementId]?.ratio ?? 0;

const polarityRatio = (
  polarity: EnergyProfileResult["chinese_bazi"]["polarity_visible"],
  polarityId: string
) => polarity[polarityId]?.ratio ?? 0;

export function computeBaziDomainScores(result: EnergyProfileResult): Record<Domain, DomainScore> {
  const elements = result.chinese_bazi.elements_visible;
  const polarity = result.chinese_bazi.polarity_visible;
  const dayMaster = result.chinese_bazi.day_master.element_id;

  const water = elementRatio(elements, "water");
  const wood = elementRatio(elements, "wood");
  const fire = elementRatio(elements, "fire");
  const earth = elementRatio(elements, "earth");
  const metal = elementRatio(elements, "metal");

  const yin = polarityRatio(polarity, "yin");
  const yang = polarityRatio(polarity, "yang");

  const baseRatios: Record<Domain, number> = {
    root: earth * 0.6 + water * 0.4,
    sacral: water * 0.55 + wood * 0.45,
    solar: fire * 0.6 + earth * 0.4,
    heart: fire * 0.55 + wood * 0.45,
    throat: metal * 0.65 + water * 0.35,
    thirdEye: water * 0.5 + metal * 0.3 + wood * 0.2,
    crown: fire * 0.35 + wood * 0.35 + metal * 0.3,
  };

  const polarityModifiers: Record<Domain, number> = {
    root: (yang - yin) * 0.05,
    sacral: (yin - yang) * 0.03,
    solar: (yang - yin) * 0.06,
    heart: (yin - yang) * 0.02,
    throat: (yin - yang) * 0.02,
    thirdEye: (yin - yang) * 0.05,
    crown: (yin - yang) * 0.06,
  };

  const dayMasterDomainBoost: Partial<Record<Domain, number>> = {
    ...(dayMaster === "earth" ? { root: 0.04, solar: 0.03 } : {}),
    ...(dayMaster === "water" ? { sacral: 0.04, thirdEye: 0.03 } : {}),
    ...(dayMaster === "fire" ? { heart: 0.04, solar: 0.03 } : {}),
    ...(dayMaster === "wood" ? { sacral: 0.03, heart: 0.03, crown: 0.03 } : {}),
    ...(dayMaster === "metal" ? { throat: 0.04, crown: 0.03 } : {}),
  };

  const toScore = (domain: Domain): DomainScore => {
    const ratio = baseRatios[domain] + polarityModifiers[domain] + (dayMasterDomainBoost[domain] ?? 0);
    const value = clamp(Math.round(25 + ratio * 70), 20, 90);
    return {
      value,
      min: value,
      max: value,
      spread: 0,
      timeSensitive: false,
    };
  };

  return {
    root: toScore("root"),
    sacral: toScore("sacral"),
    solar: toScore("solar"),
    heart: toScore("heart"),
    throat: toScore("throat"),
    thirdEye: toScore("thirdEye"),
    crown: toScore("crown"),
  };
}

import type { EnergyScoringResult, EnergySelection, ProfileInput } from "@shared/schema";
import { generateProfileByView } from "@shared/profileBuilder";
import { scoringFromBodyProfile, scoringFromChineseResult } from "@shared/energyScoring";
import { calculateEnergyProfile } from "./energyProfile";

export async function generateEnergyProfile(input: ProfileInput, selection: EnergySelection): Promise<EnergyScoringResult> {
  if (selection.system === "sidereal") {
    const profile = generateProfileByView({ ...input, zodiacMode: "sidereal" }, "sidereal");
    return scoringFromBodyProfile(profile, "sidereal");
  }

  if (selection.system === "tropical") {
    const profile = generateProfileByView({ ...input, zodiacMode: "tropical" }, "tropical");
    return scoringFromBodyProfile(profile, "tropical");
  }

  const chineseMethod = selection.method ?? "bazi";
  const chineseResult = await calculateEnergyProfile(input);
  return scoringFromChineseResult(input, chineseResult, chineseMethod);
}

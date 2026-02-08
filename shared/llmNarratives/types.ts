/**
 * Narrative Engine types and contracts.
 * Uniform JSON shape for Jyotish, Tropical, and Chinese profiles.
 */

import type { Domain } from "../schema";

export type SystemType = "jyotish" | "tropical" | "chinese";
export type NarrativeView = "sidereal" | "tropical" | "bazi";

export interface EvidenceSignal {
  source: string;
  factor: string;
  influence: "supportive" | "challenging" | "neutral";
  weight: number;
  reason: string;
  tags?: string[];
}

export interface ChakraScoreInput {
  domain: Domain;
  value: number;
  min: number;
  max: number;
  spread: number;
  timeSensitive: boolean;
  signals: EvidenceSignal[];
}

export interface ChineseFeaturesPlaceholder {
  elements?: Record<string, number>;
  polarity?: { yin?: number; yang?: number };
  animalSign?: string;
  dayMaster?: string;
  luckPillars?: unknown;
}

export interface NarrativeQualityInput {
  seed: string;
  inputSignature: string;
  usedSignalCount: number;
  timeUnknown: boolean;
}

export interface NarrativeGenerateInput {
  systemType: SystemType;
  view: NarrativeView;
  narrativeVersion: string;
  timeUnknown: boolean;
  locationLabel?: string;
  timezone?: string;
  chakraScores: ChakraScoreInput[];
  chineseFeatures?: ChineseFeaturesPlaceholder;
  /** Set by enrichInputWithQuality */
  quality?: NarrativeQualityInput;
}

export interface ChakraNarrativeItem {
  chakraDomain: Domain;
  scoreTextNL: string;
  naturalTrendNL: string;
  balancedNL: string[];
  imbalancedNL: string[];
  practicalResetsNL: string[];
  evidenceBulletsNL: string[];
}

export interface BulletsSection {
  id: "strengths" | "weaknesses" | "nutrition" | "movement" | "strengthBuild" | "flexibility" | "functionality";
  titleNL: string;
  bulletsNL: string[];
}

export interface ChakraProfileSection {
  id: "chakraProfile";
  titleNL: string;
  items: ChakraNarrativeItem[];
}

export type NarrativeSection = ChakraProfileSection | BulletsSection;

export interface SummaryNL {
  oneLiner: string;
  keyThemes: string[];
  howToUse: string;
}

export interface NarrativeQuality {
  seed: string;
  inputSignature: string;
  usedSignalCount: number;
  timeUnknown: boolean;
}

export interface NarrativeJSON {
  narrativeVersion: string;
  systemType: SystemType;
  viewLabelNL: string;
  disclaimerNL: string;
  summaryNL: SummaryNL;
  sections: NarrativeSection[];
  quality: NarrativeQuality;
}

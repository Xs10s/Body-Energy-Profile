/**
 * Zod schema validators for Narrative JSON output.
 * Enforces strict JSON structure and length constraints.
 */

import { z } from "zod";
import { DOMAINS } from "../schema";

const domainSchema = z.enum(DOMAINS);

const chakraNarrativeItemSchema = z.object({
  chakraDomain: domainSchema,
  scoreTextNL: z.string().max(200),
  naturalTrendNL: z.string().max(300),
  balancedNL: z.array(z.string().max(200)).min(5).max(7),
  imbalancedNL: z.array(z.string().max(200)).min(5).max(7),
  practicalResetsNL: z.array(z.string().max(200)).min(4).max(4),
  evidenceBulletsNL: z.array(z.string().max(200)).min(4).max(6),
});

const chakraProfileSectionSchema = z.object({
  id: z.literal("chakraProfile"),
  titleNL: z.string(),
  items: z.array(chakraNarrativeItemSchema),
});

const bulletsSectionSchema = z.object({
  id: z.enum([
    "strengths",
    "weaknesses",
    "nutrition",
    "movement",
    "strengthBuild",
    "flexibility",
    "functionality",
  ]),
  titleNL: z.string(),
  bulletsNL: z.array(z.string().max(250)).min(5).max(8),
});

const narrativeSectionSchema = z.union([
  chakraProfileSectionSchema,
  bulletsSectionSchema,
]);

const summaryNLSchema = z.object({
  oneLiner: z.string().max(160),
  keyThemes: z.array(z.string().max(100)).length(5),
  howToUse: z.string().max(300),
});

const qualitySchema = z.object({
  seed: z.string(),
  inputSignature: z.string(),
  usedSignalCount: z.number().int().min(0),
  timeUnknown: z.boolean(),
});

export const narrativeJSONSchema = z.object({
  narrativeVersion: z.string(),
  systemType: z.enum(["jyotish", "tropical", "chinese"]),
  viewLabelNL: z.string(),
  disclaimerNL: z.string().min(50),
  summaryNL: summaryNLSchema,
  sections: z.array(narrativeSectionSchema),
  quality: qualitySchema,
});

export type NarrativeJSONValidated = z.infer<typeof narrativeJSONSchema>;

/**
 * Validates raw LLM output. Strips markdown code fences if present.
 */
export function parseAndValidateNarrative(raw: string): NarrativeJSONValidated {
  let cleaned = raw.trim();
  const markdownMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (markdownMatch) {
    cleaned = markdownMatch[1].trim();
  }
  const parsed = JSON.parse(cleaned);
  return narrativeJSONSchema.parse(parsed);
}

/**
 * Basic regex patterns that indicate medical claims (wellness safety).
 */
export const MEDICAL_CLAIMS_PATTERNS = [
  /\b(behandel|genees|diagnos|therapie|voorschrift|medicijn|ziekte)\b/i,
  /\b(u moet|u zou moeten|raadpleeg uw arts)\b/i,
  /\b(voorschrijven|dosering)\b/i,
];

export function containsMedicalClaims(text: string): boolean {
  return MEDICAL_CLAIMS_PATTERNS.some((re) => re.test(text));
}

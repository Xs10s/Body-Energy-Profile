import { describe, it, expect, beforeEach } from "vitest";
import {
  narrativeJSONSchema,
  parseAndValidateNarrative,
  containsMedicalClaims,
  buildMockNarrative,
  enrichInputWithQuality,
  generateNarrative,
} from "@shared/llmNarratives";
import type { NarrativeGenerateInput } from "@shared/llmNarratives";

const validNarrativeJSON = `{
  "narrativeVersion": "1.0.0",
  "systemType": "jyotish",
  "viewLabelNL": "Oosters",
  "disclaimerNL": "Dit profiel is geen medisch advies. Raadpleeg een professional bij gezondheidsvragen of twijfels over je welzijn.",
  "summaryNL": {
    "oneLiner": "Je energieprofiel laat een mix van sterke en uitdagende domeinen zien.",
    "keyThemes": ["gronding", "flow", "kracht", "verbinding", "expressie"],
    "howToUse": "Gebruik dit profiel als startpunt voor bewustwording."
  },
  "sections": [
    {
      "id": "chakraProfile",
      "titleNL": "Chakra Profiel",
      "items": [
        {
          "chakraDomain": "root",
          "scoreTextNL": "De Wortel toont een sterke basis.",
          "naturalTrendNL": "Je systeem heeft hier natuurlijke steun.",
          "balancedNL": ["a", "b", "c", "d", "e"],
          "imbalancedNL": ["a", "b", "c", "d", "e"],
          "practicalResetsNL": ["x", "y", "z", "w"],
          "evidenceBulletsNL": ["Mars in Ram", "Saturn in Steenbok", "huis 1", "element aarde"]
        }
      ]
    },
    { "id": "strengths", "titleNL": "Sterktes", "bulletsNL": ["s1", "s2", "s3", "s4", "s5"] },
    { "id": "weaknesses", "titleNL": "Zwaktes", "bulletsNL": ["w1", "w2", "w3", "w4", "w5"] },
    { "id": "nutrition", "titleNL": "Voeding", "bulletsNL": ["n1", "n2", "n3", "n4", "n5"] },
    { "id": "movement", "titleNL": "Beweging", "bulletsNL": ["m1", "m2", "m3", "m4", "m5"] },
    { "id": "strengthBuild", "titleNL": "Krachtopbouw", "bulletsNL": ["sb1", "sb2", "sb3", "sb4", "sb5"] },
    { "id": "flexibility", "titleNL": "Flexibiliteit", "bulletsNL": ["f1", "f2", "f3", "f4", "f5"] },
    { "id": "functionality", "titleNL": "Functionaliteit", "bulletsNL": ["fu1", "fu2", "fu3", "fu4", "fu5"] }
  ],
  "quality": {
    "seed": "abc123",
    "inputSignature": "xyz789",
    "usedSignalCount": 4,
    "timeUnknown": false
  }
}`;

const baseInput: NarrativeGenerateInput = {
  systemType: "jyotish",
  view: "sidereal",
  narrativeVersion: "1.0.0",
  timeUnknown: false,
  chakraScores: [
    {
      domain: "root",
      value: 65,
      min: 60,
      max: 70,
      spread: 10,
      timeSensitive: true,
      signals: [
        {
          source: "planet",
          factor: "Mars in Ram",
          influence: "supportive",
          weight: 5,
          reason: "Mars sterk",
          tags: ["planet:Mars", "domain:root"],
        },
      ],
    },
  ],
};

describe("llmNarratives", () => {
  describe("Zod schema validation", () => {
    it("parses valid narrative JSON", () => {
      const parsed = JSON.parse(validNarrativeJSON);
      const result = narrativeJSONSchema.safeParse(parsed);
      expect(result.success).toBe(true);
    });

    it("rejects narrative with markdown code fence when using parseAndValidateNarrative", () => {
      const withFence = "```json\n" + validNarrativeJSON + "\n```";
      const result = parseAndValidateNarrative(withFence);
      expect(result.narrativeVersion).toBe("1.0.0");
      expect(result.systemType).toBe("jyotish");
    });

    it("validates oneLiner max 160 chars", () => {
      const bad = { ...JSON.parse(validNarrativeJSON), summaryNL: { ...JSON.parse(validNarrativeJSON).summaryNL, oneLiner: "x".repeat(200) } };
      const result = narrativeJSONSchema.safeParse(bad);
      expect(result.success).toBe(false);
    });

    it("validates keyThemes length 5", () => {
      const bad = { ...JSON.parse(validNarrativeJSON), summaryNL: { ...JSON.parse(validNarrativeJSON).summaryNL, keyThemes: ["a", "b"] } };
      const result = narrativeJSONSchema.safeParse(bad);
      expect(result.success).toBe(false);
    });
  });

  describe("No markdown / strict JSON", () => {
    it("parseAndValidateNarrative strips markdown and returns valid object", () => {
      const raw = "```\n" + validNarrativeJSON + "\n```";
      const out = parseAndValidateNarrative(raw);
      expect(out).toHaveProperty("narrativeVersion");
      expect(out).toHaveProperty("sections");
      expect(typeof out.summaryNL.oneLiner).toBe("string");
    });
  });

  describe("Determinism", () => {
    it("mock narrative: same input + seed => identical output", async () => {
      const enriched = enrichInputWithQuality(baseInput);
      const a = buildMockNarrative(enriched);
      const b = buildMockNarrative(enriched);
      expect(a.summaryNL.oneLiner).toBe(b.summaryNL.oneLiner);
      expect(a.disclaimerNL).toBe(b.disclaimerNL);
      expect(a.sections[0]).toEqual(b.sections[0]);
    });

    it("generateNarrative in mock mode returns deterministic result", async () => {
      const prevKey = process.env.NARRATIVE_API_KEY;
      delete process.env.NARRATIVE_API_KEY;
      const a = await generateNarrative(baseInput);
      const b = await generateNarrative(baseInput);
      expect(a.summaryNL.oneLiner).toBe(b.summaryNL.oneLiner);
      expect(a.quality.seed).toBe(b.quality.seed);
      if (prevKey) process.env.NARRATIVE_API_KEY = prevKey;
    });
  });

  describe("Safety: no medical claims", () => {
    it("containsMedicalClaims detects medical patterns", () => {
      expect(containsMedicalClaims("Raadpleeg een arts bij klachten.")).toBe(false);
      expect(containsMedicalClaims("U moet deze medicatie voorschrijven.")).toBe(true);
      expect(containsMedicalClaims("Dit geneest de ziekte.")).toBe(true);
      expect(containsMedicalClaims("Diagnose: depressie.")).toBe(true);
    });

    it("valid disclaimer does not contain medical claims", () => {
      const disclaimer = "Dit profiel is geen medisch advies. Raadpleeg een professional bij gezondheidsvragen.";
      expect(containsMedicalClaims(disclaimer)).toBe(false);
    });
  });
});

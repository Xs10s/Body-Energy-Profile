/**
 * Prompt builders for the Narrative Engine.
 * Two-layer approach: system instruction + user prompt.
 */

import type { NarrativeGenerateInput, EvidenceSignal } from "./types";

const SYSTEM_INSTRUCTION = `Je bent een welzijnscoach die gepersonaliseerde Energy Profiles genereert op basis van horoscoopgegevens.
Je output is ALLEEN geldig JSON. Geen markdown, geen uitleg, geen andere tekst.

REGLES (STRICT):
1. Output uitsluitend een geldig JSON-object volgens het exacte schema.
2. Schrijf alle teksten in het Nederlands.
3. Geef nooit medisch advies, diagnoses of behandelingsadviezen. Gebruik wellness-gerichte taal.
4. Verzin geen astrologische feiten. Gebruik alleen de aangeleverde signalen (tags, categorieën, gewichten).
5. Als het Jyotish (oosters) is, mag je nakshatra noemen. Bij Tropical (westers) GEEN nakshatra-referenties.
6. Bij ontbrekende geboortetijd: vermeld onzekerheid waar tijdgevoelig.
7. Minimaal 70% van de bullets moet een concreet thema tag of categorie noemen (element/huis/aspect/planeet/modality/stress/nakshatra).
8. Kies variaties op basis van het meegegeven seed voor reproduceerbare output.`;

function signalsToPrompt(signals: EvidenceSignal[], seed: string): string {
  return signals
    .map((s) => {
      const tags = s.tags?.length ? ` [tags: ${s.tags.join(", ")}]` : "";
      return `  - ${s.factor}: ${s.influence}, gewicht ${s.weight.toFixed(1)}, reden: ${s.reason}${tags}`;
    })
    .join("\n");
}

function buildChakraPayload(input: NarrativeGenerateInput): string {
  const lines: string[] = [];
  for (const cs of input.chakraScores) {
    lines.push(`\n### ${cs.domain} (score: ${cs.value}, min: ${cs.min}, max: ${cs.max}, tijdgevoelig: ${cs.timeSensitive})`);
    lines.push("Signalen:");
    lines.push(signalsToPrompt(cs.signals.slice(0, 8), input.quality?.seed ?? "0"));
  }
  return lines.join("\n");
}

export function buildUserPrompt(input: NarrativeGenerateInput): string {
  const chakraPayload = buildChakraPayload(input);
  const viewLabel =
    input.systemType === "jyotish"
      ? "Oosters (Sidereaal)"
      : input.systemType === "tropical"
        ? "Westers (Tropisch)"
        : "Chinees (BaZi)";

  const chineseNote =
    input.systemType === "chinese"
      ? `
Chinese kenmerken:
${input.chineseFeatures ? JSON.stringify(input.chineseFeatures, null, 2) : "Niet beschikbaar - gebruik algemeen basisprofiel."}
`
      : "";

  return `Genereer een volledig Energy Profile in JSON. Systeem: ${input.systemType}, view: ${viewLabel}.

Metadata:
- timeUnknown: ${input.timeUnknown}
- locatie: ${input.locationLabel ?? "onbekend"}
- timezone: ${input.timezone ?? "onbekend"}
- seed: ${(input as { quality?: { seed: string } }).quality?.seed ?? "0"}
- narrativeVersion: ${input.narrativeVersion}
${chineseNote}

Chakra-scores en signalen:${chakraPayload}

VEREISTE JSON-structuur:
{
  "narrativeVersion": "${input.narrativeVersion}",
  "systemType": "${input.systemType}",
  "viewLabelNL": "${viewLabel}",
  "disclaimerNL": "Dit profiel is geen medisch advies. Raadpleeg een professional bij gezondheidsvragen.",
  "summaryNL": {
    "oneLiner": "max 160 tekens",
    "keyThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
    "howToUse": "korte instructie"
  },
  "sections": [
    {
      "id": "chakraProfile",
      "titleNL": "Chakra Profiel",
      "items": [
        {
          "chakraDomain": "root|sacral|solar|heart|throat|thirdEye|crown",
          "scoreTextNL": "beschrijving score",
          "naturalTrendNL": "trend op basis van signalen",
          "balancedNL": ["5-7 bullets"],
          "imbalancedNL": ["5-7 bullets"],
          "practicalResetsNL": ["exact 4 bullets"],
          "evidenceBulletsNL": ["4-6 bullets, ALLEEN uit meegegeven signalen"]
        }
      ]
    },
    { "id": "strengths", "titleNL": "Sterktes", "bulletsNL": ["5-8 items"] },
    { "id": "weaknesses", "titleNL": "Zwaktes", "bulletsNL": ["5-8 items"] },
    { "id": "nutrition", "titleNL": "Voeding", "bulletsNL": ["5-8 items"] },
    { "id": "movement", "titleNL": "Beweging", "bulletsNL": ["5-8 items"] },
    { "id": "strengthBuild", "titleNL": "Krachtopbouw", "bulletsNL": ["5-8 items"] },
    { "id": "flexibility", "titleNL": "Flexibiliteit", "bulletsNL": ["5-8 items"] },
    { "id": "functionality", "titleNL": "Functionaliteit", "bulletsNL": ["5-8 items"] }
  ],
  "quality": {
    "seed": "<seed>",
    "inputSignature": "<signature>",
    "usedSignalCount": <number>,
    "timeUnknown": ${input.timeUnknown}
  }
}

Antwoord uitsluitend met het JSON-object. Geen markdown, geen andere tekst.`;
}

export function getSystemInstruction(): string {
  return SYSTEM_INSTRUCTION;
}

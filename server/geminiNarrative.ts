/**
 * Gemini-powered narrative personalization for chakra profiles.
 * Uses Google's Gemini API (free tier) to generate score-aware Dutch text.
 * Falls back to original profiles when API key is missing or on error.
 */

import { GoogleGenAI } from "@google/genai";
import type { ChakraProfile } from "@shared/schema";

const GEMINI_MODEL = "gemini-2.0-flash";
const ENV_KEYS = ["GOOGLE_AI_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY"] as const;

function getApiKey(): string | undefined {
  for (const key of ENV_KEYS) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Enhance chakra profiles with AI-generated personalized naturalTrend text.
 * Returns original profiles unchanged when API key is missing or on error.
 */
export async function enhanceChakraProfilesWithGemini(
  profiles: ChakraProfile[]
): Promise<ChakraProfile[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return profiles;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const payload = profiles.map((p) => ({
      domain: p.domain,
      label: p.labelNL,
      score: p.score,
      signals: p.signals.slice(0, 4).map((s) => ({
        factor: s.factor,
        influence: s.influence,
      })),
      originalTrend: p.naturalTrend,
    }));

    const prompt = `Je bent een vriendelijke wellness-coach. Genereer gepersonaliseerde "natuurlijke trend" zinnen in het Nederlands voor elk chakra, op basis van de score en horoscoopsignalen.

Regels:
- Schrijf exact 1 zin per chakra (max 25 woorden).
- Toon warmte en empathie, geen medisch advies.
- Sluit aan bij de score: hoge score (60+) = bevestigend, lage score (<45) = ondersteunend en voorzichtig.
- Gebruik de signalen om de tekst persoonlijk te maken.
- Output: JSON object met keys root, sacral, solar, heart, throat, thirdEye, crown. Elke value is één string.

Input data:
${JSON.stringify(payload, null, 2)}

Antwoord uitsluitend met geldig JSON, geen andere tekst.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (!text) return profiles;

    // Parse JSON (handle potential markdown code block)
    let parsed: Record<string, string>;
    try {
      const cleaned = text.replace(/^```json?\s*|\s*```$/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return profiles;
    }

    return profiles.map((p) => {
      const enhanced = parsed[p.domain];
      if (
        typeof enhanced === "string" &&
        enhanced.length > 10 &&
        enhanced.length < 300
      ) {
        return { ...p, naturalTrend: enhanced.trim() };
      }
      return p;
    });
  } catch (err) {
    console.warn("[Gemini] Narrative enhancement skipped:", (err as Error).message);
    return profiles;
  }
}

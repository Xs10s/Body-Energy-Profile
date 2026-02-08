/**
 * Provider-agnostic LLM client for Narrative Engine.
 * Supports: openai, anthropic, local. Mock mode when no API key.
 */

import type { NarrativeGenerateInput, NarrativeJSON, ChakraNarrativeItem } from "./types";
import { parseAndValidateNarrative } from "./validators";
import { buildUserPrompt, getSystemInstruction } from "./prompt";
import { buildMockNarrative } from "./mockNarrative";

const PROVIDERS = ["openai", "anthropic", "local"] as const;
export type NarrativeProvider = (typeof PROVIDERS)[number];

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-3-haiku-20240307";
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export interface NarrativeEngineConfig {
  provider: NarrativeProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

function getConfig(): NarrativeEngineConfig {
  const provider = (process.env.NARRATIVE_PROVIDER ?? "openai") as NarrativeProvider;
  return {
    provider: PROVIDERS.includes(provider) ? provider : "openai",
    apiKey: process.env.NARRATIVE_API_KEY?.trim(),
    model: process.env.NARRATIVE_MODEL?.trim() || (provider === "anthropic" ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_MODEL),
    baseUrl: process.env.NARRATIVE_BASE_URL?.trim(),
  };
}

function createInputSignature(input: NarrativeGenerateInput): string {
  const core = [
    input.systemType,
    input.view,
    input.narrativeVersion,
    input.timeUnknown ? "1" : "0",
    ...input.chakraScores.map(
      (c) => `${c.domain}:${c.value}:${c.signals.map((s) => s.factor).join("|")}`
    ),
  ].join("::");
  return simpleHash(core);
}

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h &= 0x7fffffff;
  }
  return h.toString(36);
}

function createSeed(input: NarrativeGenerateInput): string {
  const sig = createInputSignature(input);
  return `${sig}-${input.narrativeVersion}`;
}

export function enrichInputWithQuality(input: NarrativeGenerateInput): NarrativeGenerateInput & { quality: { seed: string; inputSignature: string; usedSignalCount: number; timeUnknown: boolean } } {
  const inputSignature = createInputSignature(input);
  const seed = createSeed(input);
  const usedSignalCount = input.chakraScores.reduce((acc, c) => acc + c.signals.length, 0);
  return {
    ...input,
    quality: {
      seed,
      inputSignature,
      usedSignalCount,
      timeUnknown: input.timeUnknown,
    },
  };
}

function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  return fn().catch((err) => {
    if (retries <= 0) throw err;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        withRetry(fn, retries - 1).then(resolve, reject);
      }, RETRY_DELAY_MS);
    });
  });
}

async function callOpenAI(config: NarrativeEngineConfig, system: string, user: string): Promise<string> {
  const fetchOpts: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  };
  const url = config.baseUrl ?? "https://api.openai.com/v1/chat/completions";
  const res = await fetch(url, fetchOpts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("No content in OpenAI response");
  return content;
}

async function callAnthropic(config: NarrativeEngineConfig, system: string, user: string): Promise<string> {
  const fetchOpts: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  };
  const url = config.baseUrl ?? "https://api.anthropic.com/v1/messages";
  const res = await fetch(url, fetchOpts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json.content?.[0]?.text;
  if (typeof content !== "string") throw new Error("No content in Anthropic response");
  return content;
}

async function callLocal(config: NarrativeEngineConfig, system: string, user: string): Promise<string> {
  const url = config.baseUrl ?? "http://localhost:11434/v1/chat/completions";
  const fetchOpts: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model || "llama3",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      stream: false,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  };
  const res = await fetch(url, fetchOpts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Local API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? json.message?.content;
  if (typeof content !== "string") throw new Error("No content in local response");
  return content;
}

async function callLLM(config: NarrativeEngineConfig, system: string, user: string): Promise<string> {
  switch (config.provider) {
    case "openai":
      return callOpenAI(config, system, user);
    case "anthropic":
      return callAnthropic(config, system, user);
    case "local":
      return callLocal(config, system, user);
    default:
      return callOpenAI(config, system, user);
  }
}

/**
 * Generate narrative using LLM or mock mode.
 */
export async function generateNarrative(input: NarrativeGenerateInput): Promise<NarrativeJSON> {
  const enriched = enrichInputWithQuality(input);
  const config = getConfig();

  // Use mock only when API key is required but missing (openai/anthropic). Local provider (Ollama) needs no key.
  const useMock =
    (config.provider === "openai" || config.provider === "anthropic") && !config.apiKey;
  if (useMock) {
    return buildMockNarrative(enriched);
  }

  try {
    const system = getSystemInstruction();
    const user = buildUserPrompt(enriched);
    const raw = await withRetry(() => callLLM(config, system, user));
    const validated = parseAndValidateNarrative(raw);
    return {
      ...validated,
      quality: {
        ...validated.quality,
        seed: enriched.quality.seed,
        inputSignature: enriched.quality.inputSignature,
        usedSignalCount: enriched.quality.usedSignalCount,
        timeUnknown: enriched.quality.timeUnknown,
      },
    };
  } catch (err) {
    console.warn("[Narrative Engine] LLM failed, falling back to mock:", (err as Error).message);
    return buildMockNarrative(enriched);
  }
}

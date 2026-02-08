# Narrative Engine – Change Report

## Summary

Implemented an LLM-powered Narrative Engine that generates all user-facing Dutch texts for energy profiles across three systems: Jyotish (sidereal), Tropical (western), and Chinese (BaZi).

## Files Changed / Added

### New Files

| Path | Description |
|------|-------------|
| `shared/llmNarratives/types.ts` | Contracts, `NarrativeGenerateInput`, `NarrativeJSON`, etc. |
| `shared/llmNarratives/validators.ts` | Zod schema validators, `parseAndValidateNarrative`, `containsMedicalClaims` |
| `shared/llmNarratives/prompt.ts` | System instruction + user prompt builders |
| `shared/llmNarratives/engine.ts` | Provider-agnostic LLM client (openai, anthropic, local), retry, mock fallback |
| `shared/llmNarratives/mockNarrative.ts` | Deterministic mock narrative for offline/dev |
| `shared/llmNarratives/chineseAdapter.ts` | Chinese (BaZi) adapter, element/polarity/dayMaster mapping |
| `shared/llmNarratives/payloadAdapter.ts` | `bodyProfileToNarrativeInput`, `energyProfileToNarrativeInput` |
| `shared/llmNarratives/mergeNarrative.ts` | Merge `NarrativeJSON` into `BodyProfile` for display |
| `shared/llmNarratives/cache.ts` | In-memory cache, `buildCacheKey`, get/set |
| `shared/llmNarratives/index.ts` | Public exports |
| `client/src/hooks/useNarrative.ts` | React hook for fetching narrative |
| `tests/shared/llmNarratives.test.ts` | Zod validation, no markdown, determinism, safety tests |

### Modified Files

| Path | Changes |
|------|---------|
| `server/routes.ts` | Added `POST /api/narratives/generate`, cache integration; fixed `zodiacMode` for bazi view |
| `client/src/pages/Results.tsx` | Narrative fetch via `useNarrative`, merge into display, loading state |
| `README.md` | New section "Narrative Engine (LLM)" with env vars, mock mode, API, caching, extend guide |

## How to Run Locally

```bash
npm install
npm run dev
```

- Without `NARRATIVE_API_KEY`: mock mode, deterministic Dutch text from evidence.
- With API key: set `NARRATIVE_PROVIDER` and `NARRATIVE_API_KEY`.

## How to Enable LLM Provider

```bash
# OpenAI (default)
export NARRATIVE_PROVIDER=openai
export NARRATIVE_API_KEY=sk-...

# Anthropic
export NARRATIVE_PROVIDER=anthropic
export NARRATIVE_API_KEY=sk-ant-...

# Local (e.g. Ollama)
export NARRATIVE_PROVIDER=local
export NARRATIVE_BASE_URL=http://localhost:11434/v1/chat/completions
export NARRATIVE_MODEL=llama3
```

## Example Request / Response (Redacted)

**Request:**
```json
{
  "profile": {
    "view": "sidereal",
    "chakraProfiles": [...],
    "domainScores": {...},
    "derived": { "timeUnknown": false },
    "input": { "birthDate": "1990-01-15", "birthPlace": "Amsterdam", ... }
  }
}
```

**Response:**
```json
{
  "narrativeVersion": "1.0.0",
  "systemType": "jyotish",
  "viewLabelNL": "Oosters",
  "disclaimerNL": "Dit profiel is geen medisch advies...",
  "summaryNL": {
    "oneLiner": "Je energieprofiel laat een mix van sterke en uitdagende domeinen zien.",
    "keyThemes": ["gronding", "flow", "kracht", "verbinding", "expressie"],
    "howToUse": "Gebruik dit profiel als startpunt voor bewustwording."
  },
  "sections": [
    { "id": "chakraProfile", "titleNL": "Chakra Profiel", "items": [...] },
    { "id": "strengths", "titleNL": "Sterktes", "bulletsNL": [...] },
    ...
  ],
  "quality": { "seed": "abc123", "inputSignature": "xyz789", "usedSignalCount": 24, "timeUnknown": false }
}
```

## Patch Export

If push is blocked, export a patch:

```bash
git diff > narrative-engine.patch
```

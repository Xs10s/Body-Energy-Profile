# Body-Energy-Profile

Nederlandstalige wellness-app die een "Body Energy Profile" genereert op basis van geboortegegevens (Jyotish). De app geeft geen medisch advies.

## Lokale ontwikkeling

### Vereisten
- Node.js 20+
- npm 10+
- (Optioneel) PostgreSQL voor persistente opslag

### Installatie
```bash
npm install
```

### Ontwikkelserver
```bash
npm run dev
```

## Tests en checks

### Lokale runs
```bash
npm ci
npm test
npm run typecheck
npm run build
```

### Beperkte omgevingen (zoals deze sandbox)
Als `vitest` niet beschikbaar is, kun je tijdelijk tests overslaan met:
```bash
ALLOW_TEST_SKIP=1 npm test
```
CI is de bron van waarheid en zal tests altijd afdwingen.

## Persistente opslag (PostgreSQL)

De app gebruikt standaard `MemStorage`. Zet `DATABASE_URL` om de Drizzle/Postgres opslag te activeren.

### Voorbeeld (lokale Postgres)
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/body_energy_profile"
```

### Migraties uitvoeren
```bash
npm run db:generate
npm run db:migrate
```

### Fallback
Als `DATABASE_URL` ontbreekt of de verbinding faalt, schakelt de server automatisch terug naar `MemStorage`.

## Gepersonaliseerde teksten (optioneel)

Voor score-gerelateerde personalisatie van chakra-narratieven kun je de Google Gemini API (gratis tier) gebruiken.

### Setup
1. Maak een API-sleutel aan op [Google AI Studio](https://aistudio.google.com/apikey)
2. Stel een van deze omgevingsvariabelen in:
   - `GOOGLE_AI_API_KEY`
   - `GOOGLE_API_KEY`
   - `GEMINI_API_KEY`

```bash
export GOOGLE_AI_API_KEY="jouw-api-sleutel"
```

Zonder API-sleutel worden standaard template-teksten gebruikt.

## Narrative Engine (LLM)

De Narrative Engine genereert alle gebruikersgerichte Nederlandse teksten voor Energy Profiles via een enkele LLM-aanroep per profiel. Ondersteunde systemen: Jyotish (sidereal), Tropical (westers), Chinees (BaZi).

### Vereisten

- Node.js 20+
- Optioneel: API-sleutel voor OpenAI, Anthropic of lokale LLM

### Omgevingsvariabelen

| Variabele | Beschrijving | Standaard |
|-----------|--------------|-----------|
| `NARRATIVE_PROVIDER` | Provider: `openai`, `anthropic`, `local` | `openai` |
| `NARRATIVE_API_KEY` | API-sleutel voor de provider | - |
| `NARRATIVE_MODEL` | Modelnaam (bv. `gpt-4o-mini`) | Provider-specifiek |
| `NARRATIVE_BASE_URL` | Optioneel; voor lokale of custom endpoints | - |

### Mock mode

Als `NARRATIVE_API_KEY` ontbreekt, gebruikt de engine een deterministische mock-narratief op basis van de meegegeven signalen. De output valideert tegen hetzelfde Zod-schema en is reproduceerbaar (zelfde input ⇒zelfde tekst).

### API

**POST** `/api/narratives/generate`

**Request (voorbeeld):**
```json
{
  "profile": { /* BodyProfile */ }
}
```
Of voor Chinese (BaZi):
```json
{
  "energyProfile": { /* EnergyProfileResult */ },
  "profileInput": { /* ProfileInput */ }
}
```

**Response:** Valide `NarrativeJSON` met `summaryNL`, `sections`, `quality`, etc.

### Caching

Narratieven worden gecached op `chartSignature::systemType::view::narrativeVersion`. Standaard in-memory; optioneel via `setNarrativeCacheStorage()` voor DB-opslag.

### Uitbreiden

- **Nieuwe secties:** Voeg secties toe in `validators.ts` en `prompt.ts`.
- **Chinees profiel:** Pas `chineseAdapter.ts` aan om meer `chineseFeatures` te mappen (element balance, yin/yang, animal sign, luck pillars).
## Energy system selection & scoring contract

De engine ondersteunt nu een model-onafhankelijke scoring contract voor drie systemen:

- `sidereal`
- `tropical`
- `chinese` met methodes `bazi` en `shengxiao`

Nieuwe API-route:

```bash
POST /api/energy-scoring
```

Payload:

```json
{
  "input": { "birthDate": "...", "birthPlace": "..." },
  "selection": { "system": "chinese", "method": "bazi" }
}
```

Output volgt `EnergyScoringResult` (zie `shared/schema.ts`) met:
- deterministische `chartSignature`
- domeinscores met `score/scoreMin/scoreMax/spread`
- compacte feitelijke signalen met `tags`, `category`, `meta`
- parity-notes (waarom systemen kunnen verschillen)

### Wat lokaal wordt berekend

- Astronomische chart features en domeinscores (sidereal/tropical)
- Chinese scoring mapping (BaZi/Shengxiao) op basis van gestructureerde signalen
- Deterministische evidence-selectie voor LLM input

### Wat de LLM consumeert

De LLM ontvangt géén narratief templates uit deze scoringlaag, maar gestructureerde evidence:
- `domains[].evidence.signals[]`
- `signals[].tags`
- `signals[].category`
- `explain.parityNotes[]`

Zo blijft de tekstgeneratie model-agnostisch en reproduceerbaar.

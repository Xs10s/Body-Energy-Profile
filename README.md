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

# REA voor Body-Energy-Profile

Optionele ontwikkeltool, vastgepind op `rea-agents@6.4.0`. Geen dependency van de
Express-server, React-client of narrative engine. De bestaande app kan Node 20
blijven gebruiken; voer deze tool uit met een aparte Node 24.11+ runtime
(of Node 22.19+, 26+). Er is geen installatie in de app-root nodig.

## Gebruik

Voer vanuit deze map uit:

```sh
npm test
npm run analyze -- /absolute/path/to/staged-app
```

De eerste analyse downloadt de exact genoemde npm-versie naar de npm-cache.
Dat vereist netwerktoegang; de analyse zelf draait lokaal. npm bepaalt de
transitieve dependencies van die publicatie: deze package-runner is geen
volledig gelockte of offline dependency-installatie.

Maak eerst een aparte staging-map met uitsluitend de JS/TS-bronbestanden of
gebouwde JS-bundels die je wilt onderzoeken. Gebruik bijvoorbeeld
`client/src`, `server` en `shared` uit een schone checkout. Kopieer geen
`.env`, databases, logboeken, echte profielen, backups, Git-metagegevens of
sleutels. Deze wrapper maakt geen staging-kopie en filtert bestanden niet.
Analyseer daarom niet de productie-directory of de volledige VPS-home.

Sla de JSON-output buiten de staging-map op (de evidence kan groot zijn):

```sh
mkdir -p evidence
npm run --silent analyze -- /absolute/path/to/staged-app > evidence/app.json
```

Exitcode 0 betekent dat de operatie voltooid is; de evidence kan nog steeds
onzekerheden of gedeeltelijke resultaten bevatten. Een foutcode blijft behouden.

## MCP voor een ontwikkelagent

`npm run --silent mcp` start dezelfde versie via stdio. Gebruik
`mcp.example.json` als voorbeeld voor een agent die dit JSON-formaat ondersteunt;
voeg de entry samen met diens bestaande configuratie. Op Windows kan de client
een `cmd.exe /d /c npx ...`-wrapper voor het npx-commandbestand nodig hebben.
De voorbeeldconfiguratie is niet automatisch actief.

Een lokaal taalmodel alleen is geen MCP-client. Een agent/orchestrator moet
REA's toolcatalogus laden, tool calls uitvoeren en resultaten aan het model
teruggeven. Koppel dit uitsluitend aan een afzonderlijke ontwikkelagent.
Een lokale modelserver hoeft daarvoor geen REA-code te importeren.

De wrapper biedt alleen statische analyse en stdio MCP; MCP zelf heeft een
bredere toolcatalogus, inclusief runtimeacties. Beperk de agent met een
afzonderlijke OS-gebruiker/container, minimale mounts en expliciete toolkeuze.
Een configvoorbeeld is geen sandbox of autorisatiegrens.

## OVH: ontwikkelomgeving naast de bestaande astrologie-AI

1. Gebruik een afzonderlijke Linux-gebruiker of container met Node 24.11+ en npm.
   Geef alleen een staging-kopie toegang, geen productievolumes of credentials.
2. Houd REA via stdio; publiceer geen REA-, debugger- of modelpoort op internet.
   Een SSH-sessie of agent die op de VPS draait kan de lokale MCP-server starten.
3. Begin met statische JS/TS-analyse. Die heeft geen Hopper, Ghidra, IDA of browser
   nodig. Native analyse vereist later een afzonderlijke provider en diens
   dependencies/licentie. Browseranalyse vereist een Chrome-familie browser.
4. Bewaar evidence lokaal met beperkte bestandstoegang. Deel alleen beoordeelde
   fragmenten met een agent; een extern model kan die fragmenten alsnog ontvangen.
5. Meet geheugen, CPU en schijfruimte op een kleine staging-kopie voordat je een
   grotere analyse draait. VPS-specificaties zijn niet bekend; geen sizing belofte.
6. Er is geen automatische deployment, production hook of app-API voor REA.

## Bestaande lokale tekstgeneratie

`shared/llmNarratives/engine.ts` ondersteunt de lokale provider al:

```dotenv
NARRATIVE_PROVIDER=local
NARRATIVE_BASE_URL=http://127.0.0.1:11434/v1/chat/completions
NARRATIVE_MODEL=your-installed-model-name
```

Vervang de modelnaam door een geïnstalleerd model. De base URL is de volledige
chat-completions URL, niet alleen `/v1`. In een container wijst 127.0.0.1 naar
die container; gebruik daar de private servicenaam van de modelserver.
De huidige lokale client stuurt geen Authorization-header. Een authenticatie
vereisend endpoint heeft dus een aparte adapterwijziging nodig.

`POST /api/narratives/generate` gebruikt de bestaande validatie en fallback op
mockteksten bij een mislukte modelaanroep. Test op staging met synthetische
geboortegegevens en controleer modelserverlogs om echte generatie te onderscheiden
van de fallback. `server/geminiNarrative.ts` is een aparte Gemini-route; dit
REA-voorstel verandert die niet. REA berekent geen horoscopen en vervangt geen LLM.

## Onderzoek en licenties (11 oktober 2026)

REA staat voor **Reverse Engineer Anything**: CLI/MCP voor bewijsgerichte
analyse van binaries, JavaScript/Electron-apps, websites en runtimegedrag.
De repository en installatiedocumentatie vermelden versie 6.4.0; main kan
functionaliteit bevatten die nog niet in de npm-publicatie zit.

- [README](https://github.com/morluto/rea/blob/main/README.md)
- [Installatie en releasegrens](https://github.com/morluto/rea/blob/main/docs/installation.md)
- [CLI en evidence](https://github.com/morluto/rea/blob/main/docs/cli.md)
- [Dependency-manifest](https://github.com/morluto/rea/blob/main/package.json)
- [MIT-licentie](https://github.com/morluto/rea/blob/main/LICENSE)

De MIT-licentie staat gebruik, wijziging en distributie toe; behoud copyright
en licentietekst bij distributie van REA-code of substantiële delen.
Externe providers en meegeleverde third-party onderdelen hebben eigen voorwaarden.

Belangrijkste directe dependencies: Babel parser/types, Electron ASAR,
MCP client/server, Zod/AJV, Playwright-core, ws, XML/plist/ZIP-parsers,
node-pty en xterm voor runtimeobservatie, isomorphic-git en logging/configparsers.
De volledige lijst en exacte versies staan in het upstream manifest; deze
integratie importeert ze niet in de app. De wrapper gebruikt alleen Node built-ins.

Gekozen repository: Body-Energy-Profile bevat React/TypeScript, Express,
astronomy-engine, Python-rekenonderdelen en de lokale narrative-provider.
`Xs10s/A` is hoofdzakelijk een Python/FastAPI-rekenmotor; `Xs10s/Astro`
staat als leeg geregistreerd. De actieve productieversie en OVH-installatie
zijn niet vastgesteld. Dit voorstel is daarom een optionele ontwikkelintegratie.

## Validatiegrens

De wrappertests toetsen runtimes, toegestane commando's, argumenten met spaties,
ontbrekende targets en doorgeven van fouten. Ze downloaden REA niet.
Een echte REA-analyse en live MCP/modelverbinding moeten afzonderlijk op staging
worden gecontroleerd. Het voorstel claimt geen productie- of VPS-verificatie.

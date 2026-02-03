# Calculation Core (Python)

## Integratie-optie

**Gekozen optie:** option_02 – interne Python service (subprocess) aangeroepen door de Node/TS server. Dit past bij de bestaande Node-architectuur en vereist geen extra runtime-service, terwijl de berekeningskern in Python blijft en via een stabiele JSON-interface benaderd wordt.

## Calculation modes

### Western tropical (frame_01)
- `mode_version`: v1
- `mode_id`: mode_01
- `house_system`: system_01

### Western sidereal (frame_02)
- `mode_version`: v1
- `mode_id`: mode_01
- `house_system`: system_01
- `ayanamsha_mode`: mode_01

### Chinese BaZi (frame_03)
- `mode_version`: v1
- `year_boundary_mode`: mode_01
- `month_system_mode`: mode_01
- `day_boundary_mode`: mode_01
- `include_hidden_stems`: true
- `luck_cycles_enabled`: false

## Solar terms aanpak

**Benadering:** lokale benadering zonder externe API. De engine gebruikt een deterministische zonlengte-benadering (gebaseerd op een eenvoudige astronomische formule) en vindt 15°-overgangen via bisection. Hiermee worden de major terms (12 grenzen) bepaald voor jaar- en maandpilaren.

## Placeholder IDs → UI labels

De Python core levert uitsluitend placeholder IDs (bijv. `planet_01`, `sign_01`, `stem_01`). UI-teksten horen buiten de core te leven, zodat labels of talen kunnen wisselen zonder de berekeningen te beïnvloeden. In de UI kan een aparte mappinglaag deze IDs vertalen naar gewenste labels.

## Luck cycles activeren (zonder breaking changes)

1. Zet `luck_cycles_enabled` naar `true` in `BaziCalcMode`.
2. Voeg een `luck_cycles`-map toe in het outputschema; behoud het bestaande veld zodat `null` geldig blijft.
3. Houd de bestaande output-structuur stabiel door dezelfde keys en IDs te blijven gebruiken.

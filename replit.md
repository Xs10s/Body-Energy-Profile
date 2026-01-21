# Body Energy Profile (Jyotish-based)

## Overview

A Dutch-language wellness web application that generates personalized "body energy profiles" based on Vedic astrology (Jyotish). Users enter their birth date, optional birth time, birth place, and country to receive insights across 8 wellness sections: Strengths, Weaknesses, Base, Nutrition, Movement, Strength Building, Flexibility, and Functionality.

The app uses Jyotish calculations with the astronomy-engine library to compute planetary positions, then scores 7 chakra-based energy domains (root, sacral, solar, heart, throat, thirdEye, crown) based on planet dignity/strength and house placements. When birth time is unknown, the system aggregates 12 time samples and shows confidence levels with score ranges.

**Important**: This is explicitly not medical advice - prominent disclaimers are displayed throughout the application.

**Version**: 2.1.0 (Chakra Profile as primary output)

## User Preferences

- Preferred communication style: Simple, everyday language
- Language: Dutch (nl-NL) throughout the application
- Font: Inter family for all typography

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **State Management**: TanStack React Query for server state, localStorage for profile persistence between pages
- **Form Handling**: React Hook Form with Zod validation

Key pages:
- `/` - Home page with birth data input form + geocoding
- `/result` - Generated profile results display with Jyotish data
- `/history` - Saved profiles listing

### Backend Architecture
- **Runtime**: Node.js with Express
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **Development**: tsx for TypeScript execution

API endpoints:
- `GET /api/geocode?place=&country=` - Resolve lat/lon from place name (cached)
- `GET /api/profiles` - List all saved profiles
- `GET /api/profiles/:id` - Get specific profile
- `POST /api/profiles` - Save a new profile
- `DELETE /api/profiles/:id` - Delete a profile
- `POST /api/profiles/pdf` - Generate downloadable PDF report

### Jyotish Computation Engine
Located in `shared/jyotish.ts`:
- Uses astronomy-engine library for planetary position calculations
- Computes positions for 9 planets: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu
- Lahiri ayanamsa for tropical-to-sidereal conversion
- Whole sign house system (each sign = one house)
- Nakshatra calculation with pada for Moon
- Lunar nodes (Rahu/Ketu) computed using mean node formula

### Scoring Engine
Located in `shared/scoring.ts`:
1. Starts each of 7 domains at baseline score (50)
2. Applies planet strength modifiers (dignity from exaltation/debilitation/own sign + house placement)
3. Uses domain-to-planet weight mappings (e.g., root: Saturn 1.2, Mars 1.0)
4. Adds element modifiers based on Moon/Sun/Lagna signs (fire/earth/air/water)
5. Applies contrast amplification (1.25-1.35x) for non-neutral differentiation
6. For unknown birth time: aggregates 12 samples (every 2 hours) showing mean/min/max/spread
7. Generates natural language content for each of the 8 output sections

### Data Flow
1. User enters birth data on Home page
2. Geocoding resolves lat/lon from place + country
3. Input stored in localStorage, redirects to Results page
4. Jyotish chart computed with planetary positions
5. Profile generated client-side using shared scoring logic
6. User can save profile to backend or download as PDF

### Data Storage
- **Current**: In-memory storage (`MemStorage` class) - profiles lost on server restart
- **Schema Ready**: Drizzle ORM configured with PostgreSQL dialect for future database integration
- Shared Zod schemas in `shared/schema.ts` define all data types

## Key Types (shared/schema.ts)

- `ProfileInput`: Birth data including lat/lon/timezone
- `ChartData`: Complete Jyotish chart with planets, lagna, moon/sun positions
- `PlanetData`: Individual planet data (tropical/sidereal longitude, sign, house, nakshatra, strength)
- `LagnaData`: Ascendant/rising sign data
- `ChartHighlights`: Strongest/weakest planets and domain explanations
- `DerivedFeatures`: Moon sign, nakshatra, Sun sign, Lagna, ayanamsa value
- `DomainScore`: Score value with min/max/spread for unknown time scenarios

## External Dependencies

### Astronomy Library
- `astronomy-engine` - High-precision astronomical calculations

### Geocoding
- OpenStreetMap Nominatim API for place-to-coordinates resolution
- Server-side caching to minimize API calls

### UI Component Library
- shadcn/ui with Radix UI primitives
- Full component set in `client/src/components/ui/`

### PDF Generation
- PDFKit for server-side PDF report generation
- Sharp library for SVG-to-PNG conversion for chart embedding

### Horoscope Chart Visualization
Located in `client/src/components/`:
- `NorthIndianChart.tsx`: SVG component for Jyotish diamond-style chart layout
  - Fixed house positions: House 1 at top, House 4 at left, House 7 at bottom, House 10 at right
  - Dutch planet abbreviations (Zo, Ma, Mr, Me, Ju, Ve, Sa, Ra, Ke)
  - Retrograde planets shown with "R" suffix in amber color
  - Sign abbreviations in each house, optional house numbers toggle
- `WheelChart.tsx`: SVG component for circular Western-style chart
  - Ascendant-based rotation with zodiac symbols
  - Planet symbols (☉, ☽, ♂, ☿, ♃, ♀, ♄, ☊, ☋) positioned by longitude
  - Ascendant line marker
- `ChartLegend.tsx`: Collapsible legend with Dutch planet/sign translations
- `HoroscopeSection.tsx`: Container component with chart type toggle
  - Supports switching between diamond and wheel chart styles
  - Shows time-unknown warning badge when applicable
  - Displays zodiac mode, ayanamsa value, and house system badges

### Key NPM Packages
- `astronomy-engine` - Planetary position calculations
- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` + `@hookform/resolvers` - Form management
- `zod` + `drizzle-zod` - Schema validation
- `date-fns` - Date manipulation
- `wouter` - Client routing
- `lucide-react` - Icons
- `pdfkit` + `@types/pdfkit` - PDF generation
- `sharp` - SVG to PNG conversion for PDF chart embedding

### Fonts
- Inter font loaded from Google Fonts CDN

### Replit-specific
- `@replit/vite-plugin-runtime-error-modal` - Error display
- `@replit/vite-plugin-cartographer` - Development tooling
- `@replit/vite-plugin-dev-banner` - Development banner

## Recent Changes

- **2026-01-16**: Horoscope chart visualization
  - Created NorthIndianChart.tsx for Jyotish diamond-style chart rendering
  - Created WheelChart.tsx for circular Western-style chart rendering
  - Created ChartLegend.tsx with Dutch translations for planets and signs
  - Added HoroscopeSection.tsx with chart type toggle (diamond/wheel)
  - Updated Results page to display charts between summary and domain scores
  - Updated PDF export to include chart image using Sharp for SVG-to-PNG conversion
  - Charts respect active zodiac mode (sidereal/tropical) from profile settings

- **2026-01-16**: Dual zodiac mode support and timezone/DST fixes
  - Added zodiac mode selector: Sidereal (Jyotish) or Tropical (Western) systems
  - Replaced static timezone offsets with Luxon library for proper DST handling
  - Created DebugPanel component showing all intermediate calculation values
  - Updated schema with ZodiacMode type, DebugInfo interface, and dual zodiac fields
  - PlanetData/LagnaData now include both tropical and sidereal positions
  - Scoring engine updated to work with both zodiac modes
  - Input form includes zodiac mode selector with explanatory text
  - SummaryHeader shows active zodiac mode badge
  - Critical fix: astronomically correct datetime conversion using Luxon

- **2026-01-16**: Major upgrade from numerology to Jyotish (Vedic astrology) calculations
  - Replaced life path number scoring with planetary position-based scoring
  - Added astronomy-engine for planetary calculations
  - Implemented Lahiri ayanamsa, sidereal zodiac, whole sign houses
  - Added geocoding endpoint for lat/lon resolution
  - Updated UI to show Moon/Sun/Lagna signs and nakshatra
  - Added chart highlights section in methodology
  - Multi-sample aggregation for unknown birth time
  - Version bumped to 2.0.0

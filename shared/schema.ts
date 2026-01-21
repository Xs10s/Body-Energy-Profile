import { z } from "zod";

export const DOMAINS = ['root', 'sacral', 'solar', 'heart', 'throat', 'thirdEye', 'crown'] as const;
export type Domain = typeof DOMAINS[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  root: 'Wortel',
  sacral: 'Sacraal',
  solar: 'Zonnevlecht',
  heart: 'Hart',
  throat: 'Keel',
  thirdEye: 'Derde Oog',
  crown: 'Kruin'
};

export const DOMAIN_DESCRIPTIONS: Record<Domain, string> = {
  root: 'Gronding, slaapritme, benen/voeten, routine',
  sacral: 'Hydratatie, heupen/bekken, emotioneel eten, flow',
  solar: 'Spijsvertering-stress, core, tempo/grenzen',
  heart: 'Adem/herstel, borst/upper back, veerkracht',
  throat: 'Nek/schouders/kaak, expressie-spanning',
  thirdEye: 'Overdenken, schermmoeheid, hoofddruk',
  crown: 'Overprikkeling, stiltebehoefte'
};

export const COUNTRIES = [
  'Nederland',
  'België',
  'Duitsland',
  'Frankrijk',
  'Verenigd Koninkrijk',
  'Verenigde Staten',
  'Spanje',
  'Italië',
  'Oostenrijk',
  'Zwitserland',
  'Anders'
] as const;

export const TIMEZONES = [
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Vienna',
  'Europe/Zurich'
] as const;

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
export type Planet = typeof PLANETS[number];

export const SIGNS = [
  'Ram', 'Stier', 'Tweelingen', 'Kreeft', 'Leeuw', 'Maagd',
  'Weegschaal', 'Schorpioen', 'Boogschutter', 'Steenbok', 'Waterman', 'Vissen'
] as const;
export type Sign = typeof SIGNS[number];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
] as const;
export type Nakshatra = typeof NAKSHATRAS[number];

export const ZODIAC_MODES = ['sidereal', 'tropical'] as const;
export type ZodiacMode = typeof ZODIAC_MODES[number];

export const ZODIAC_MODE_LABELS: Record<ZodiacMode, string> = {
  sidereal: 'Sidereaal (Jyotish – Lahiri)',
  tropical: 'Tropisch (Westers)'
};

export const profileInputSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().min(1, 'Geboortedatum is verplicht'),
  birthTime: z.string().optional(),
  timeUnknown: z.boolean().default(false),
  birthPlace: z.string().min(1, 'Geboorteplaats is verplicht'),
  country: z.string().min(1, 'Land is verplicht'),
  timezone: z.string().default('Europe/Amsterdam'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  placeId: z.string().nullable().optional(),
  zodiacMode: z.enum(['sidereal', 'tropical']).default('sidereal')
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export interface PlanetData {
  lonTropicalDeg: number;
  lonSiderealDeg: number;
  signTropical: number;
  signTropicalNL: string;
  signSidereal: number;
  signSiderealNL: string;
  houseWholeSign: number | null;
  housePlacidus: number | null;
  nakshatra: {
    index: number;
    name: string;
    pada: number;
  } | null;
  retrograde: boolean;
  strength: number;
}

export interface LagnaData {
  lonTropicalDeg: number;
  lonSiderealDeg: number;
  signTropical: number;
  signTropicalNL: string;
  signSidereal: number;
  signSiderealNL: string;
}

export interface DebugInfo {
  inputLocal: {
    date: string;
    time: string;
    place: string;
  };
  interpreted: {
    timezone: string;
    isDST: boolean;
    localDatetimeISO: string;
    utcDatetimeISO: string;
    latitude: number;
    longitude: number;
    offsetMinutes: number;
  };
  astroConfig: {
    zodiacMode: ZodiacMode;
    ayanamsaDegrees: number | null;
    houseSystem: string;
  };
  results: {
    sunLonTropical: number;
    sunLonSidereal: number;
    sunSignTropical: string;
    sunSignSidereal: string;
    moonLonTropical: number;
    moonLonSidereal: number;
    moonSignTropical: string;
    moonSignSidereal: string;
    ascLonTropical: number | null;
    ascLonSidereal: number | null;
    ascSignTropical: string | null;
    ascSignSidereal: string | null;
  };
  warnings: string[];
}

export interface ChartData {
  datetimeUtcISO: string;
  timezone: string;
  lat: number;
  lon: number;
  zodiacMode: ZodiacMode;
  ayanamsa: {
    name: string;
    valueDegrees: number;
  } | null;
  planets: Record<Planet, PlanetData>;
  lagna: LagnaData | null;
  housesSystem: string;
  moon: {
    rashiSignTropical: number;
    rashiTropicalNL: string;
    rashiSignSidereal: number;
    rashiSiderealNL: string;
    nakshatraName: string;
    pada: number;
  };
  sun: {
    rashiSignTropical: number;
    rashiTropicalNL: string;
    rashiSignSidereal: number;
    rashiSiderealNL: string;
  };
  debugInfo: DebugInfo;
}

export interface ChartHighlights {
  moonSign: string;
  moonNakshatra: string;
  sunSign: string;
  lagnaSign: string | null;
  strongestPlanets: Array<{ planet: string; reason: string }>;
  stressedPlanets: Array<{ planet: string; reason: string }>;
  topDomains: Array<{ domain: string; reason: string }>;
  lowDomains: Array<{ domain: string; reason: string }>;
}

export interface LagnaOption {
  sign: string;
  probability: number;
}

export interface DomainScore {
  value: number;
  min: number;
  max: number;
  spread: number;
  timeSensitive: boolean;
}

export interface ProfileSection {
  bullets: string[];
  paragraph: string;
  nextStep: string;
}

export interface DerivedFeatures {
  zodiacMode: ZodiacMode;
  moonSign: string;
  moonSignTropical: string;
  moonSignSidereal: string;
  moonNakshatra: string;
  moonPada: number;
  sunSign: string;
  sunSignTropical: string;
  sunSignSidereal: string;
  lagnaSign: string | null;
  lagnaSignTropical: string | null;
  lagnaSignSidereal: string | null;
  lagnaOptions: LagnaOption[] | null;
  timeUnknown: boolean;
  ayanamsa: number | null;
}

export interface Confidence {
  level: 'high' | 'medium' | 'low';
  notes: string[];
}

export interface Methodology {
  short: string;
  details: string[];
  chartHighlights: ChartHighlights | null;
}

export interface Disclaimer {
  text: string;
  whenToConsult: string[];
}

export interface ChakraSignal {
  source: string;
  factor: string;
  influence: 'supportive' | 'challenging' | 'neutral';
  weight: number;
  reason: string;
}

export interface ChakraEvidence {
  domain: Domain;
  signals: ChakraSignal[];
  rawScore: number;
  adjustedScore: number;
  supportive: boolean;
}

export interface ChakraProfile {
  domain: Domain;
  labelNL: string;
  sanskritName: string;
  score: number;
  scoreMin: number;
  scoreMax: number;
  timeSensitive: boolean;
  evidence: ChakraEvidence;
  signals: ChakraSignal[];
  naturalTrend: string;
  balanced: string[];
  imbalanced: string[];
  practicalResets: string[];
}

export interface BodyProfile {
  version: string;
  locale: string;
  generatedAt: string;
  input: ProfileInput;
  derived: DerivedFeatures;
  confidence: Confidence;
  domainScores: Record<Domain, DomainScore>;
  sections: {
    strengths: ProfileSection;
    weaknesses: ProfileSection;
    base: ProfileSection;
    nutrition: ProfileSection;
    movement: ProfileSection;
    strengthBuilding: ProfileSection;
    flexibility: ProfileSection;
    functionality: ProfileSection;
  };
  methodology: Methodology;
  disclaimer: Disclaimer;
  chartData?: ChartData;
  chakraProfiles: ChakraProfile[];
  debugInfo: DebugInfo;
}

export interface SavedProfile {
  id: string;
  profile: BodyProfile;
  createdAt: string;
}

export const geocodeResultSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  displayName: z.string(),
  placeId: z.string().optional()
});

export type GeocodeResult = z.infer<typeof geocodeResultSchema>;

export const saveProfileRequestSchema = z.object({
  profile: z.object({
    version: z.string(),
    locale: z.string(),
    generatedAt: z.string(),
    input: profileInputSchema,
    derived: z.object({
      moonSign: z.string(),
      moonNakshatra: z.string(),
      moonPada: z.number(),
      sunSign: z.string(),
      lagnaSign: z.string().nullable(),
      lagnaOptions: z.array(z.object({
        sign: z.string(),
        probability: z.number()
      })).nullable(),
      timeUnknown: z.boolean(),
      ayanamsa: z.number()
    }),
    confidence: z.object({
      level: z.enum(['high', 'medium', 'low']),
      notes: z.array(z.string())
    }),
    domainScores: z.record(z.object({
      value: z.number(),
      min: z.number(),
      max: z.number(),
      spread: z.number(),
      timeSensitive: z.boolean()
    })),
    sections: z.record(z.object({
      bullets: z.array(z.string()),
      paragraph: z.string(),
      nextStep: z.string()
    })),
    methodology: z.object({
      short: z.string(),
      details: z.array(z.string()),
      chartHighlights: z.object({
        moonSign: z.string(),
        moonNakshatra: z.string(),
        sunSign: z.string(),
        lagnaSign: z.string().nullable(),
        strongestPlanets: z.array(z.object({
          planet: z.string(),
          reason: z.string()
        })),
        stressedPlanets: z.array(z.object({
          planet: z.string(),
          reason: z.string()
        })),
        topDomains: z.array(z.object({
          domain: z.string(),
          reason: z.string()
        })),
        lowDomains: z.array(z.object({
          domain: z.string(),
          reason: z.string()
        }))
      }).nullable()
    }),
    disclaimer: z.object({
      text: z.string(),
      whenToConsult: z.array(z.string())
    }),
    chartData: z.any().optional()
  })
});

export type SaveProfileRequest = z.infer<typeof saveProfileRequestSchema>;

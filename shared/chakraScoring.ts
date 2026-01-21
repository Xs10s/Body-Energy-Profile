import type { ChartData, Domain, Planet } from './schema';
import { DOMAINS, DOMAIN_LABELS, SIGNS, NAKSHATRAS } from './schema';

export interface ChakraEvidence {
  domain: Domain;
  signals: ChakraSignal[];
  rawScore: number;
  adjustedScore: number;
  supportive: boolean;
}

export interface ChakraSignal {
  source: string;
  factor: string;
  influence: 'supportive' | 'challenging' | 'neutral';
  weight: number;
  reason: string;
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

export const CHAKRA_NAMES_SANSKRIT: Record<Domain, string> = {
  root: 'Muladhara',
  sacral: 'Svadhisthana',
  solar: 'Manipura',
  heart: 'Anahata',
  throat: 'Vishuddha',
  thirdEye: 'Ajna',
  crown: 'Sahasrara'
};

export const CHAKRA_PLANET_WEIGHTS: Record<Domain, Record<Planet, number>> = {
  root: { Saturn: 1.3, Mars: 1.0, Sun: 0.3, Moon: 0.2, Mercury: 0.1, Jupiter: 0.1, Venus: 0.1, Rahu: 0.2, Ketu: 0.1 },
  sacral: { Venus: 1.3, Moon: 1.0, Rahu: 0.5, Saturn: 0.1, Mars: 0.3, Sun: 0.1, Mercury: 0.2, Jupiter: 0.2, Ketu: 0.1 },
  solar: { Sun: 1.3, Mars: 1.0, Saturn: 0.4, Moon: 0.1, Mercury: 0.2, Jupiter: 0.3, Venus: 0.1, Rahu: 0.2, Ketu: 0.1 },
  heart: { Jupiter: 1.1, Venus: 0.9, Moon: 0.9, Saturn: 0.1, Mars: 0.1, Sun: 0.3, Mercury: 0.2, Rahu: 0.1, Ketu: 0.3 },
  throat: { Mercury: 1.3, Venus: 0.5, Saturn: 0.3, Moon: 0.2, Mars: 0.1, Sun: 0.2, Jupiter: 0.3, Rahu: 0.2, Ketu: 0.1 },
  thirdEye: { Jupiter: 0.9, Rahu: 1.1, Mercury: 0.7, Saturn: 0.2, Mars: 0.1, Sun: 0.3, Moon: 0.4, Venus: 0.2, Ketu: 0.5 },
  crown: { Ketu: 1.3, Jupiter: 0.9, Saturn: 0.3, Moon: 0.2, Mars: 0.1, Sun: 0.2, Mercury: 0.2, Venus: 0.1, Rahu: 0.2 }
};

export const CHAKRA_HOUSE_WEIGHTS: Record<Domain, number[]> = {
  root: [1, 6],
  sacral: [7, 8],
  solar: [5, 10],
  heart: [4],
  throat: [2, 3],
  thirdEye: [9, 11],
  crown: [12]
};

const ELEMENT_CHAKRA_EFFECTS: Record<string, Record<Domain, number>> = {
  fire: { solar: 7, root: -2, sacral: 0, heart: 1, throat: 3, thirdEye: 1, crown: -1 },
  earth: { root: 7, solar: 2, sacral: 1, heart: 0, throat: 0, thirdEye: -1, crown: -2 },
  air: { thirdEye: 7, throat: 3, sacral: -2, root: 0, solar: 0, heart: 1, crown: 2 },
  water: { heart: 7, sacral: 3, solar: -2, root: 0, throat: 0, thirdEye: 1, crown: 2 }
};

const SIGN_ELEMENTS: string[] = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water'];

const PLANET_NAMES_NL: Record<Planet, string> = {
  Sun: 'Zon',
  Moon: 'Maan',
  Mars: 'Mars',
  Mercury: 'Mercurius',
  Jupiter: 'Jupiter',
  Venus: 'Venus',
  Saturn: 'Saturnus',
  Rahu: 'Rahu',
  Ketu: 'Ketu'
};

const SIGNS_NL = ['Ram', 'Stier', 'Tweelingen', 'Kreeft', 'Leeuw', 'Maagd', 'Weegschaal', 'Schorpioen', 'Boogschutter', 'Steenbok', 'Waterman', 'Vissen'];

function getElement(signIndex: number): string {
  return SIGN_ELEMENTS[signIndex];
}

function getSignNL(index: number): string {
  return SIGNS_NL[index] || 'onbekend';
}

function getPlanetNL(planet: string): string {
  return PLANET_NAMES_NL[planet as Planet] || planet;
}

export function computeChakraEvidence(chart: ChartData): Record<Domain, ChakraEvidence> {
  const evidence: Record<Domain, ChakraEvidence> = {} as Record<Domain, ChakraEvidence>;
  const rawScores: Record<Domain, number> = {} as Record<Domain, number>;
  
  for (const domain of DOMAINS) {
    const signals: ChakraSignal[] = [];
    let rawScore = 50;

    const planetWeights = CHAKRA_PLANET_WEIGHTS[domain];
    for (const [planet, weight] of Object.entries(planetWeights)) {
      const planetData = chart.planets[planet as Planet];
      if (!planetData) continue;

      const strength = planetData.strength;
      const contribution = strength * weight * 2;
      rawScore += contribution;

      if (Math.abs(contribution) > 1) {
        const signNL = chart.zodiacMode === 'sidereal' ? planetData.signSiderealNL : planetData.signTropicalNL;
        const influence: 'supportive' | 'challenging' | 'neutral' = 
          contribution > 2 ? 'supportive' : contribution < -2 ? 'challenging' : 'neutral';
        
        let reasonDetail = '';
        if (strength > 5) reasonDetail = `verhoogd (${signNL})`;
        else if (strength > 2) reasonDetail = `sterk (${signNL})`;
        else if (strength < -5) reasonDetail = `verzwakt (${signNL})`;
        else if (strength < -2) reasonDetail = `uitgedaagd (${signNL})`;
        else reasonDetail = `neutraal (${signNL})`;

        signals.push({
          source: 'planet',
          factor: `${getPlanetNL(planet)} in ${signNL}`,
          influence,
          weight: Math.abs(contribution),
          reason: `${getPlanetNL(planet)} ${reasonDetail}`
        });
      }
    }

    if (chart.lagna) {
      const domainHouses = CHAKRA_HOUSE_WEIGHTS[domain];
      for (const [planet, data] of Object.entries(chart.planets)) {
        if (data.houseWholeSign && domainHouses.includes(data.houseWholeSign)) {
          const houseContribution = data.strength * 0.8;
          rawScore += houseContribution;

          const signNL = chart.zodiacMode === 'sidereal' ? data.signSiderealNL : data.signTropicalNL;
          signals.push({
            source: 'house',
            factor: `${getPlanetNL(planet)} in huis ${data.houseWholeSign}`,
            influence: houseContribution > 0 ? 'supportive' : 'challenging',
            weight: Math.abs(houseContribution),
            reason: `versterkt door positie in huis ${data.houseWholeSign}`
          });
        }
      }
    }

    const moonSign = chart.zodiacMode === 'sidereal' ? chart.moon.rashiSignSidereal : chart.moon.rashiSignTropical;
    const moonElement = getElement(moonSign);
    const moonElementEffect = ELEMENT_CHAKRA_EFFECTS[moonElement][domain];
    rawScore += moonElementEffect * 1.0;
    
    if (Math.abs(moonElementEffect) > 2) {
      signals.push({
        source: 'element',
        factor: `Maan in ${getSignNL(moonSign)} (${moonElement === 'fire' ? 'vuur' : moonElement === 'earth' ? 'aarde' : moonElement === 'air' ? 'lucht' : 'water'})`,
        influence: moonElementEffect > 0 ? 'supportive' : 'challenging',
        weight: Math.abs(moonElementEffect),
        reason: `${moonElement === 'fire' ? 'vuur' : moonElement === 'earth' ? 'aarde' : moonElement === 'air' ? 'lucht' : 'water'}-element van Maan`
      });
    }

    const sunSign = chart.zodiacMode === 'sidereal' ? chart.sun.rashiSignSidereal : chart.sun.rashiSignTropical;
    const sunElement = getElement(sunSign);
    const sunElementEffect = ELEMENT_CHAKRA_EFFECTS[sunElement][domain] * 0.5;
    rawScore += sunElementEffect;

    if (Math.abs(sunElementEffect) > 1.5) {
      signals.push({
        source: 'element',
        factor: `Zon in ${getSignNL(sunSign)} (${sunElement === 'fire' ? 'vuur' : sunElement === 'earth' ? 'aarde' : sunElement === 'air' ? 'lucht' : 'water'})`,
        influence: sunElementEffect > 0 ? 'supportive' : 'challenging',
        weight: Math.abs(sunElementEffect),
        reason: `${sunElement === 'fire' ? 'vuur' : sunElement === 'earth' ? 'aarde' : sunElement === 'air' ? 'lucht' : 'water'}-element van Zon`
      });
    }

    if (chart.lagna) {
      const lagnaSign = chart.zodiacMode === 'sidereal' ? chart.lagna.signSidereal : chart.lagna.signTropical;
      const lagnaElement = getElement(lagnaSign);
      const lagnaElementEffect = ELEMENT_CHAKRA_EFFECTS[lagnaElement][domain] * 0.7;
      rawScore += lagnaElementEffect;

      if (Math.abs(lagnaElementEffect) > 1.5) {
        const lagnaSignNL = chart.zodiacMode === 'sidereal' ? chart.lagna.signSiderealNL : chart.lagna.signTropicalNL;
        signals.push({
          source: 'lagna',
          factor: `Ascendant in ${lagnaSignNL} (${lagnaElement === 'fire' ? 'vuur' : lagnaElement === 'earth' ? 'aarde' : lagnaElement === 'air' ? 'lucht' : 'water'})`,
          influence: lagnaElementEffect > 0 ? 'supportive' : 'challenging',
          weight: Math.abs(lagnaElementEffect),
          reason: `Lagna-element beïnvloedt ${DOMAIN_LABELS[domain]}`
        });
      }
    }

    if (domain === 'heart' || domain === 'thirdEye' || domain === 'crown') {
      const nakshatra = chart.moon.nakshatraName;
      const spiritualNakshatras = ['Ashwini', 'Pushya', 'Revati', 'Mula', 'Jyeshtha', 'Shravana'];
      if (spiritualNakshatras.includes(nakshatra)) {
        rawScore += 3;
        signals.push({
          source: 'nakshatra',
          factor: `Maan in ${nakshatra}`,
          influence: 'supportive',
          weight: 3,
          reason: `spirituele nakshatra versterkt hoger bewustzijn`
        });
      }
    }

    signals.sort((a, b) => b.weight - a.weight);

    rawScores[domain] = rawScore;
    evidence[domain] = {
      domain,
      signals: signals.slice(0, 8),
      rawScore,
      adjustedScore: rawScore,
      supportive: rawScore >= 50
    };
  }

  const values = Object.values(rawScores);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  let multiplier = 1.25;
  const adjusted: Record<Domain, number> = {} as Record<Domain, number>;
  for (const domain of DOMAINS) {
    adjusted[domain] = mean + (rawScores[domain] - mean) * multiplier;
  }
  
  const adjustedValues = Object.values(adjusted);
  const maxVal = Math.max(...adjustedValues);
  const minVal = Math.min(...adjustedValues);
  
  if (maxVal < 65 || minVal > 45) {
    multiplier = 1.35;
    for (const domain of DOMAINS) {
      adjusted[domain] = mean + (rawScores[domain] - mean) * multiplier;
    }
  }
  
  for (const domain of DOMAINS) {
    const clampedScore = Math.max(0, Math.min(100, Math.round(adjusted[domain])));
    evidence[domain].adjustedScore = clampedScore;
    evidence[domain].supportive = clampedScore >= 50;
  }
  
  return evidence;
}

export function aggregateChakraEvidence(
  allEvidence: Record<Domain, ChakraEvidence>[]
): Record<Domain, { evidence: ChakraEvidence; min: number; max: number; spread: number; timeSensitive: boolean }> {
  const result: Record<Domain, { evidence: ChakraEvidence; min: number; max: number; spread: number; timeSensitive: boolean }> = 
    {} as Record<Domain, { evidence: ChakraEvidence; min: number; max: number; spread: number; timeSensitive: boolean }>;
  
  for (const domain of DOMAINS) {
    const scores = allEvidence.map(e => e[domain].adjustedScore);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const mean = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const spread = max - min;

    const allSignals: ChakraSignal[] = [];
    for (const ev of allEvidence) {
      allSignals.push(...ev[domain].signals);
    }
    
    const signalsByFactor = new Map<string, ChakraSignal[]>();
    for (const sig of allSignals) {
      const existing = signalsByFactor.get(sig.factor) || [];
      existing.push(sig);
      signalsByFactor.set(sig.factor, existing);
    }
    
    const aggregatedSignals: ChakraSignal[] = [];
    Array.from(signalsByFactor.entries()).forEach(([factor, sigs]) => {
      const avgWeight = sigs.reduce((acc: number, sig: ChakraSignal) => acc + sig.weight, 0) / sigs.length;
      aggregatedSignals.push({
        ...sigs[0],
        weight: avgWeight
      });
    });
    aggregatedSignals.sort((a, b) => b.weight - a.weight);

    result[domain] = {
      evidence: {
        domain,
        signals: aggregatedSignals.slice(0, 6),
        rawScore: mean,
        adjustedScore: mean,
        supportive: mean >= 50
      },
      min,
      max,
      spread,
      timeSensitive: spread >= 12
    };
  }
  
  return result;
}

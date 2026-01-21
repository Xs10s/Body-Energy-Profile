import type { 
  BodyProfile, 
  ProfileInput, 
  Domain, 
  DomainScore, 
  DerivedFeatures, 
  Confidence,
  Methodology,
  Disclaimer,
  ProfileSection,
  ChartData,
  ChartHighlights,
  LagnaOption,
  ZodiacMode,
  ChakraProfile
} from './schema';
import { DOMAINS, DOMAIN_LABELS } from './schema';
import { 
  computeChart, 
  computeChartsForUnknownTime, 
  getLagnaDistribution,
  SIGNS_NL,
  PLANET_NAMES_NL
} from './jyotish';
import { computeChakraEvidence, aggregateChakraEvidence } from './chakraScoring';
import { buildChakraProfiles } from './chakraNarrative';

function getActiveSign(chart: ChartData, signTropical: number, signSidereal: number): number {
  return chart.zodiacMode === 'sidereal' ? signSidereal : signTropical;
}

function getActiveSignName(chart: ChartData, signTropicalNL: string, signSiderealNL: string): string {
  return chart.zodiacMode === 'sidereal' ? signSiderealNL : signTropicalNL;
}

function getMoonSign(chart: ChartData): number {
  return chart.zodiacMode === 'sidereal' ? chart.moon.rashiSignSidereal : chart.moon.rashiSignTropical;
}

function getMoonSignNL(chart: ChartData): string {
  return chart.zodiacMode === 'sidereal' ? chart.moon.rashiSiderealNL : chart.moon.rashiTropicalNL;
}

function getSunSignNL(chart: ChartData): string {
  return chart.zodiacMode === 'sidereal' ? chart.sun.rashiSiderealNL : chart.sun.rashiTropicalNL;
}

function getLagnaSign(chart: ChartData): number | null {
  if (!chart.lagna) return null;
  return chart.zodiacMode === 'sidereal' ? chart.lagna.signSidereal : chart.lagna.signTropical;
}

function getLagnaSignNL(chart: ChartData): string | null {
  if (!chart.lagna) return null;
  return chart.zodiacMode === 'sidereal' ? chart.lagna.signSiderealNL : chart.lagna.signTropicalNL;
}

function getPlanetSignNL(chart: ChartData, planetName: string): string {
  const planet = chart.planets[planetName as keyof typeof chart.planets];
  if (!planet) return 'onbekend';
  return chart.zodiacMode === 'sidereal' ? planet.signSiderealNL : planet.signTropicalNL;
}

const DOMAIN_PLANET_WEIGHTS: Record<Domain, Record<string, number>> = {
  root: { Saturn: 1.2, Mars: 1.0, Sun: 0.3 },
  sacral: { Venus: 1.2, Moon: 0.8, Rahu: 0.4 },
  solar: { Sun: 1.2, Mars: 0.8, Saturn: 0.4 },
  heart: { Moon: 0.8, Venus: 0.8, Jupiter: 1.0 },
  throat: { Mercury: 1.2, Venus: 0.4, Saturn: 0.2 },
  thirdEye: { Mercury: 0.6, Jupiter: 0.8, Rahu: 1.0 },
  crown: { Jupiter: 0.8, Ketu: 1.2, Saturn: 0.2 }
};

const DOMAIN_HOUSE_WEIGHTS: Record<Domain, number[]> = {
  root: [1, 6],
  sacral: [7, 8],
  solar: [5, 10],
  heart: [4],
  throat: [2, 3],
  thirdEye: [9, 11],
  crown: [12]
};

const ELEMENT_DOMAINS: Record<string, Record<Domain, number>> = {
  fire: { solar: 6, throat: 2, root: -2, sacral: 0, heart: 0, thirdEye: 0, crown: -1 },
  earth: { root: 6, solar: 2, crown: -2, sacral: 0, heart: 0, throat: 0, thirdEye: 0 },
  air: { thirdEye: 6, throat: 2, sacral: -2, root: 0, solar: 0, heart: 0, crown: 0 },
  water: { heart: 6, sacral: 2, solar: -2, root: 0, throat: 0, thirdEye: 0, crown: 0 }
};

const SIGN_ELEMENTS: string[] = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water'];

function getElement(signIndex: number): string {
  return SIGN_ELEMENTS[signIndex];
}

function calculateDomainScoresFromChart(chart: ChartData): Record<Domain, number> {
  const scores: Record<Domain, number> = {
    root: 50,
    sacral: 50,
    solar: 50,
    heart: 50,
    throat: 50,
    thirdEye: 50,
    crown: 50
  };

  for (const domain of DOMAINS) {
    const planetWeights = DOMAIN_PLANET_WEIGHTS[domain];
    
    for (const [planet, weight] of Object.entries(planetWeights)) {
      const planetData = chart.planets[planet as keyof typeof chart.planets];
      if (planetData) {
        scores[domain] += planetData.strength * weight * 2;
      }
    }

    if (chart.lagna) {
      const domainHouses = DOMAIN_HOUSE_WEIGHTS[domain];
      for (const [planet, data] of Object.entries(chart.planets)) {
        if (data.houseWholeSign && domainHouses.includes(data.houseWholeSign)) {
          scores[domain] += data.strength * 0.8;
        }
      }
    }
  }

  const moonSign = getMoonSign(chart);
  const moonElement = getElement(moonSign);
  for (const domain of DOMAINS) {
    scores[domain] += ELEMENT_DOMAINS[moonElement][domain] * 1.0;
  }

  if (chart.lagna) {
    const lagnaSign = getLagnaSign(chart);
    if (lagnaSign !== null) {
      const lagnaElement = getElement(lagnaSign);
      for (const domain of DOMAINS) {
        scores[domain] += ELEMENT_DOMAINS[lagnaElement][domain] * 0.7;
      }
    }
  }

  const sunSign = chart.zodiacMode === 'sidereal' ? chart.sun.rashiSignSidereal : chart.sun.rashiSignTropical;
  const sunElement = getElement(sunSign);
  for (const domain of DOMAINS) {
    scores[domain] += ELEMENT_DOMAINS[sunElement][domain] * 0.5;
  }

  return scores;
}

function applyContrastAmplification(scores: Record<Domain, number>): Record<Domain, number> {
  const values = Object.values(scores);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  let multiplier = 1.25;
  
  const adjusted: Record<Domain, number> = { ...scores };
  for (const domain of DOMAINS) {
    adjusted[domain] = mean + (scores[domain] - mean) * multiplier;
  }
  
  const adjustedValues = Object.values(adjusted);
  const maxVal = Math.max(...adjustedValues);
  const minVal = Math.min(...adjustedValues);
  
  if (maxVal < 65 || minVal > 45) {
    multiplier = 1.35;
    for (const domain of DOMAINS) {
      adjusted[domain] = mean + (scores[domain] - mean) * multiplier;
    }
  }
  
  for (const domain of DOMAINS) {
    adjusted[domain] = Math.max(0, Math.min(100, Math.round(adjusted[domain])));
  }
  
  return adjusted;
}

function aggregateScores(allScores: Record<Domain, number>[]): Record<Domain, DomainScore> {
  const result: Record<Domain, DomainScore> = {} as Record<Domain, DomainScore>;
  
  for (const domain of DOMAINS) {
    const values = allScores.map(s => s[domain]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const spread = max - min;
    
    result[domain] = {
      value: mean,
      min,
      max,
      spread,
      timeSensitive: spread >= 12
    };
  }
  
  return result;
}

function getChartHighlights(chart: ChartData, domainScores: Record<Domain, DomainScore>): ChartHighlights {
  const planetStrengths = Object.entries(chart.planets)
    .map(([name, data]) => ({ 
      name, 
      strength: data.strength, 
      signNL: getActiveSignName(chart, data.signTropicalNL, data.signSiderealNL)
    }))
    .sort((a, b) => b.strength - a.strength);
  
  const strongestPlanets = planetStrengths.slice(0, 3).map(p => ({
    planet: PLANET_NAMES_NL[p.name as keyof typeof PLANET_NAMES_NL] || p.name,
    reason: `sterk in ${p.signNL}`
  }));
  
  const stressedPlanets = planetStrengths.slice(-3).reverse().map(p => ({
    planet: PLANET_NAMES_NL[p.name as keyof typeof PLANET_NAMES_NL] || p.name,
    reason: `verzwakt in ${p.signNL}`
  }));
  
  const domainRanked = DOMAINS
    .map(d => ({ domain: d, value: domainScores[d].value, label: DOMAIN_LABELS[d] }))
    .sort((a, b) => b.value - a.value);
  
  const topDomains = domainRanked.slice(0, 2).map(d => ({
    domain: d.label,
    reason: getTopDomainReason(d.domain, chart)
  }));
  
  const lowDomains = domainRanked.slice(-2).reverse().map(d => ({
    domain: d.label,
    reason: getLowDomainReason(d.domain, chart)
  }));
  
  return {
    moonSign: getMoonSignNL(chart),
    moonNakshatra: chart.moon.nakshatraName,
    sunSign: getSunSignNL(chart),
    lagnaSign: getLagnaSignNL(chart),
    strongestPlanets,
    stressedPlanets,
    topDomains,
    lowDomains
  };
}

function getTopDomainReason(domain: Domain, chart: ChartData): string {
  const planetWeights = DOMAIN_PLANET_WEIGHTS[domain];
  const strongPlanets = Object.entries(planetWeights)
    .filter(([p]) => chart.planets[p as keyof typeof chart.planets]?.strength > 3)
    .map(([p]) => PLANET_NAMES_NL[p as keyof typeof PLANET_NAMES_NL]);
  
  if (strongPlanets.length > 0) {
    return `sterke ${strongPlanets.join(', ')} ondersteunen dit domein`;
  }
  
  const moonSign = getMoonSign(chart);
  const element = getElement(moonSign);
  return `Maan in ${element === 'water' ? 'water' : element === 'fire' ? 'vuur' : element === 'earth' ? 'aarde' : 'lucht'} teken versterkt dit`;
}

function getLowDomainReason(domain: Domain, chart: ChartData): string {
  const planetWeights = DOMAIN_PLANET_WEIGHTS[domain];
  const weakPlanets = Object.entries(planetWeights)
    .filter(([p]) => chart.planets[p as keyof typeof chart.planets]?.strength < -3)
    .map(([p]) => PLANET_NAMES_NL[p as keyof typeof PLANET_NAMES_NL]);
  
  if (weakPlanets.length > 0) {
    return `verzwakte ${weakPlanets.join(', ')} beperken dit domein`;
  }
  
  return `weinig planetaire ondersteuning voor dit thema`;
}

function generateSections(domainScores: Record<Domain, DomainScore>, chart: ChartData): BodyProfile['sections'] {
  const sorted = DOMAINS
    .map(d => ({ domain: d, value: domainScores[d].value, label: DOMAIN_LABELS[d] }))
    .sort((a, b) => b.value - a.value);
  
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3);

  return {
    strengths: {
      bullets: top3.map(d => `${d.label}: natuurlijke energie (${d.value}/100)`),
      paragraph: `Je ${top3[0].label.toLowerCase()} energie is bijzonder sterk ontwikkeld. Dit kan zich uiten in een natuurlijke vaardigheid voor ${getStrengthDescription(top3[0].domain)}.`,
      nextStep: `Benut je ${top3[0].label.toLowerCase()} kracht door bewust aandacht te geven aan ${getStrengthActivity(top3[0].domain)}.`
    },
    weaknesses: {
      bullets: bottom3.map(d => `${d.label}: vraagt extra aandacht (${d.value}/100)`),
      paragraph: `Je ${bottom3[0].label.toLowerCase()} domein kan extra ondersteuning gebruiken. Dit neigt naar uitdagingen met ${getWeaknessDescription(bottom3[0].domain)}.`,
      nextStep: `Geef bewust aandacht aan ${getWeaknessActivity(bottom3[0].domain)} om dit domein te versterken.`
    },
    base: generateBaseSection(domainScores, chart),
    nutrition: generateNutritionSection(domainScores, chart),
    movement: generateMovementSection(domainScores, chart),
    strengthBuilding: generateStrengthSection(domainScores, chart),
    flexibility: generateFlexibilitySection(domainScores, chart),
    functionality: generateFunctionalitySection(domainScores, chart)
  };
}

function getStrengthDescription(domain: Domain): string {
  const descriptions: Record<Domain, string> = {
    root: 'stabiliteit en consistentie',
    sacral: 'creativiteit en emotionele flow',
    solar: 'wilskracht en persoonlijke kracht',
    heart: 'compassie en verbinding',
    throat: 'communicatie en expressie',
    thirdEye: 'intuïtie en inzicht',
    crown: 'spirituele verbinding en begrip'
  };
  return descriptions[domain];
}

function getStrengthActivity(domain: Domain): string {
  const activities: Record<Domain, string> = {
    root: 'grondende activiteiten zoals wandelen in de natuur',
    sacral: 'creatieve expressie en waterrijke voeding',
    solar: 'doelgerichte activiteiten en kernspieraandacht',
    heart: 'hartopening en ademhalingsoefeningen',
    throat: 'vocale expressie en nekontspanning',
    thirdEye: 'meditatieve praktijken en intuïtief werk',
    crown: 'stilte en contemplatieve praktijken'
  };
  return activities[domain];
}

function getWeaknessDescription(domain: Domain): string {
  const descriptions: Record<Domain, string> = {
    root: 'gronding en stabiliteit',
    sacral: 'emotionele balans en creativiteit',
    solar: 'zelfvertrouwen en spijsvertering',
    heart: 'emotioneel herstel en veerkracht',
    throat: 'expressie en spanning in nek/schouders',
    thirdEye: 'mentale rust en focus',
    crown: 'overprikkeling en rust'
  };
  return descriptions[domain];
}

function getWeaknessActivity(domain: Domain): string {
  const activities: Record<Domain, string> = {
    root: 'dagelijkse routines en grondende oefeningen',
    sacral: 'waterinname en creatieve outlets',
    solar: 'stapsgewijze doelen en buikademhaling',
    heart: 'hartcoherentieoefeningen en zelfcompassie',
    throat: 'nekstretches en bewuste communicatie',
    thirdEye: 'digitale detox en oogontspanning',
    crown: 'stiltepraktijken en vereenvoudiging'
  };
  return activities[domain];
}

function generateBaseSection(scores: Record<Domain, DomainScore>, chart: ChartData): ProfileSection {
  const rootScore = scores.root.value;
  const saturnStrength = chart.planets.Saturn?.strength || 0;
  
  return {
    bullets: [
      `Slaapritme: ${rootScore > 60 ? 'van nature stabiel' : 'kan baat hebben bij meer regelmaat'}`,
      `Gronding: ${saturnStrength > 0 ? 'sterke basis door Saturnus' : 'vraagt bewuste aandacht'}`,
      `Routine: ${rootScore > 50 ? 'past goed bij vaste patronen' : 'flexibeler met structuur'}`
    ],
    paragraph: `Je basisenergie wordt beïnvloed door ${getMoonSignNL(chart)} Maan en ${getSunSignNL(chart)} Zon. ${rootScore > 60 ? 'Dit geeft een stevige fundatie.' : 'Bewuste aandacht voor stabiliteit kan helpen.'}`,
    nextStep: `Begin met een consistent ${rootScore > 50 ? 'avond' : 'ochtend'}ritueel van 10 minuten.`
  };
}

function generateNutritionSection(scores: Record<Domain, DomainScore>, chart: ChartData): ProfileSection {
  const sacralScore = scores.sacral.value;
  const solarScore = scores.solar.value;
  const moonSign = getMoonSign(chart);
  const moonElement = getElement(moonSign);
  
  return {
    bullets: [
      `Hydratatie: ${sacralScore > 55 ? 'goede natuurlijke regulatie' : 'let extra op waterinname'}`,
      `Spijsvertering: ${solarScore > 55 ? 'van nature robuust' : 'kan gevoelig zijn voor stress'}`,
      `Element voorkeur: ${moonElement === 'fire' ? 'koelende voeding helpt' : moonElement === 'water' ? 'warmende voeding ondersteunt' : 'gebalanceerd eten past'}`
    ],
    paragraph: `Met je Maan in ${getMoonSignNL(chart)} ${moonElement === 'water' ? 'neig je naar emotioneel eten. Warmende kruiden kunnen ondersteunen.' : moonElement === 'fire' ? 'kan je snel oververhit raken. Koelende voeding en rust tijdens maaltijden helpt.' : 'heb je een adaptief spijsverteringssysteem.'}`,
    nextStep: `Focus op ${solarScore < 50 ? 'rustiger eten en goed kauwen' : 'luisteren naar je lichaam en variatie'}.`
  };
}

function generateMovementSection(scores: Record<Domain, DomainScore>, chart: ChartData): ProfileSection {
  const solarScore = scores.solar.value;
  const rootScore = scores.root.value;
  const marsStrength = chart.planets.Mars?.strength || 0;
  
  return {
    bullets: [
      `Energie niveau: ${marsStrength > 0 ? 'van nature actief door sterke Mars' : 'doserend bewegen past beter'}`,
      `Bewegingstype: ${solarScore > 55 ? 'intensievere training kan' : 'gentler movement wordt aanbevolen'}`,
      `Timing: ${rootScore > 50 ? 'vaste tijden werken goed' : 'flexibel aansluiten bij energieniveau'}`
    ],
    paragraph: `Je Mars in ${getPlanetSignNL(chart, 'Mars')} beïnvloedt je fysieke expressie. ${marsStrength > 3 ? 'Je hebt een natuurlijke drive voor beweging.' : marsStrength < -3 ? 'Doseren en opbouwen past beter bij jou.' : 'Een gebalanceerde aanpak werkt het beste.'}`,
    nextStep: `Probeer ${marsStrength > 0 ? 'interval of krachtige beweging' : 'yoga of wandelen'} als vast onderdeel van je week.`
  };
}

function generateStrengthSection(scores: Record<Domain, DomainScore>, chart: ChartData): ProfileSection {
  const solarScore = scores.solar.value;
  const rootScore = scores.root.value;
  const sunStrength = chart.planets.Sun?.strength || 0;
  
  return {
    bullets: [
      `Core sterkte: ${solarScore > 55 ? 'natuurlijk aanwezig' : 'opbouwen verdient aandacht'}`,
      `Uithoudingsvermogen: ${rootScore > 50 && sunStrength > 0 ? 'goed fundament' : 'stapsgewijs ontwikkelen'}`,
      `Herstel: ${sunStrength > 3 ? 'snel herstellend' : 'extra rusttijd nodig'}`
    ],
    paragraph: `Je Zon in ${getSunSignNL(chart)} bepaalt mede je vitaliteit en kracht. ${sunStrength > 0 ? 'Dit geeft een sterke basis voor krachtopbouw.' : 'Geduldig opbouwen en goed herstellen is essentieel.'}`,
    nextStep: `${solarScore > 55 ? 'Daag jezelf uit met progressieve overload.' : 'Begin met lichte weerstandstraining 2x per week.'}`
  };
}

function generateFlexibilitySection(scores: Record<Domain, DomainScore>, chart: ChartData): ProfileSection {
  const throatScore = scores.throat.value;
  const heartScore = scores.heart.value;
  const venusStrength = chart.planets.Venus?.strength || 0;
  
  return {
    bullets: [
      `Nek/schouders: ${throatScore < 50 ? 'aandachtspunt - kan spanning vasthouden' : 'relatief ontspannen'}`,
      `Borstkas: ${heartScore > 55 ? 'open houding van nature' : 'kan baat hebben bij openers'}`,
      `Algehele souplesse: ${venusStrength > 0 ? 'van nature flexibel' : 'vraagt consistent werk'}`
    ],
    paragraph: `Met Venus in ${getPlanetSignNL(chart, 'Venus')} en een ${heartScore > 50 ? 'open' : 'meer gesloten'} hartdomein, ${venusStrength > 0 ? 'kom je waarschijnlijk snel in flexibele posities.' : 'kan regelmatig stretchen veel opleveren.'}`,
    nextStep: `Neem dagelijks ${throatScore < 50 ? 'nekstretches' : 'een korte stretchroutine'} op in je dag.`
  };
}

function generateFunctionalitySection(scores: Record<Domain, DomainScore>, chart: ChartData): ProfileSection {
  const thirdEyeScore = scores.thirdEye.value;
  const crownScore = scores.crown.value;
  const mercuryStrength = chart.planets.Mercury?.strength || 0;
  const jupiterStrength = chart.planets.Jupiter?.strength || 0;
  
  return {
    bullets: [
      `Mentale helderheid: ${mercuryStrength > 0 ? 'van nature scherp' : 'kan fluctueren'}`,
      `Overzicht: ${jupiterStrength > 0 ? 'goed in grote lijnen' : 'details kunnen overweldigen'}`,
      `Prikkelbaarheid: ${crownScore < 45 ? 'gevoelig voor overprikkeling' : 'redelijk veerkrachtig'}`
    ],
    paragraph: `Je Mercurius in ${getPlanetSignNL(chart, 'Mercury')} en Jupiter in ${getPlanetSignNL(chart, 'Jupiter')} beïnvloeden je cognitieve functie. ${thirdEyeScore > 55 ? 'Je hebt een scherp analytisch vermogen.' : 'Mentale rust praktijken kunnen helpen.'}`,
    nextStep: `${crownScore < 50 ? 'Plan dagelijks stiltemomenten in.' : 'Benut je mentale kracht met bewuste focus.'}`
  };
}

function generateMethodology(chart: ChartData, hasTime: boolean): Methodology {
  const isSidereal = chart.zodiacMode === 'sidereal';
  const zodiacLabel = isSidereal ? 'siderische dierenriem (Jyotish) met Lahiri ayanamsa' : 'tropische dierenriem (Westers)';
  const ayanamsaInfo = isSidereal && chart.ayanamsa 
    ? `Ayanamsa: Lahiri (${chart.ayanamsa.valueDegrees.toFixed(2)}°) - correctie van tropisch naar siderisch`
    : 'Ayanamsa: niet toegepast (tropisch systeem)';
  
  return {
    short: `Dit profiel is berekend met ${isSidereal ? 'Jyotish (Vedische astrologie)' : 'westerse astrologie'}, gebruikmakend van de ${zodiacLabel}.`,
    details: [
      ayanamsaInfo,
      `Huizensysteem: ${chart.housesSystem}`,
      `Maan positie: ${getMoonSignNL(chart)}, nakshatra ${chart.moon.nakshatraName} pada ${chart.moon.pada}`,
      `Zon positie: ${getSunSignNL(chart)}`,
      hasTime ? `Ascendant (Lagna): ${getLagnaSignNL(chart)}` : 'Ascendant: onbekend (geboortetijd niet ingevoerd)',
      'Startscore per domein: 50, aangepast op basis van planeetkracht en huisposities',
      'Contrastamplificatie: 1.25-1.35x voor duidelijke differentiatie',
      hasTime ? 'Betrouwbaarheid: Hoog (exacte geboortetijd bekend)' : 'Betrouwbaarheid: Gemiddeld (12 tijdstippen gesimuleerd)'
    ],
    chartHighlights: null
  };
}

function generateDisclaimer(): Disclaimer {
  return {
    text: 'Dit profiel is uitsluitend bedoeld voor persoonlijke reflectie en wellness-inzichten. Het is geen medische diagnose of behandeladvies. De Jyotish-berekeningen zijn gebaseerd op astronomische posities en traditionele interpretaties, niet op wetenschappelijk bewijs.',
    whenToConsult: [
      'Bij aanhoudende fysieke klachten of pijn',
      'Bij zorgen over je mentale gezondheid',
      'Voordat je grote veranderingen aanbrengt in dieet of beweging',
      'Als je onder behandeling bent voor een aandoening'
    ]
  };
}

export function generateProfile(input: ProfileInput): BodyProfile {
  const hasTime = !input.timeUnknown && !!input.birthTime;
  
  let domainScores: Record<Domain, DomainScore>;
  let derived: DerivedFeatures;
  let confidence: Confidence;
  let methodology: Methodology;
  let primaryChart: ChartData;
  let chartHighlights: ChartHighlights | null = null;
  let lagnaOptions: LagnaOption[] | null = null;
  let chakraProfiles: ChakraProfile[] = [];

  if (hasTime) {
    primaryChart = computeChart(input);
    const rawScores = calculateDomainScoresFromChart(primaryChart);
    const amplifiedScores = applyContrastAmplification(rawScores);
    
    domainScores = {} as Record<Domain, DomainScore>;
    for (const domain of DOMAINS) {
      domainScores[domain] = {
        value: amplifiedScores[domain],
        min: amplifiedScores[domain],
        max: amplifiedScores[domain],
        spread: 0,
        timeSensitive: false
      };
    }
    
    chartHighlights = getChartHighlights(primaryChart, domainScores);
    
    const chakraEvidence = computeChakraEvidence(primaryChart);
    const chartSignature = `${input.birthDate}-${input.birthPlace}-${input.birthTime || 'unknown'}`;
    const scoresMap: Record<Domain, { value: number; min: number; max: number; spread: number; timeSensitive: boolean }> = {} as any;
    for (const domain of DOMAINS) {
      scoresMap[domain] = {
        value: chakraEvidence[domain].adjustedScore,
        min: chakraEvidence[domain].adjustedScore,
        max: chakraEvidence[domain].adjustedScore,
        spread: 0,
        timeSensitive: false
      };
    }
    chakraProfiles = buildChakraProfiles(chakraEvidence, scoresMap, chartSignature);
    
    confidence = {
      level: 'high',
      notes: [
        'Exacte geboortetijd bekend - nauwkeurige Lagna berekening',
        'Huisposities volledig berekend',
        'Planeetkrachten met volledige context'
      ]
    };
  } else {
    const charts = computeChartsForUnknownTime(input);
    primaryChart = charts[6];
    
    const allScores = charts.map(c => {
      const raw = calculateDomainScoresFromChart(c);
      return applyContrastAmplification(raw);
    });
    
    domainScores = aggregateScores(allScores);
    lagnaOptions = getLagnaDistribution(charts, input.zodiacMode || 'sidereal');
    chartHighlights = getChartHighlights(primaryChart, domainScores);
    
    const allChakraEvidence = charts.map(c => computeChakraEvidence(c));
    const aggregatedChakra = aggregateChakraEvidence(allChakraEvidence);
    const chartSignature = `${input.birthDate}-${input.birthPlace}-unknown`;
    const evidenceMap: Record<Domain, any> = {} as any;
    const scoresMap: Record<Domain, { value: number; min: number; max: number; spread: number; timeSensitive: boolean }> = {} as any;
    for (const domain of DOMAINS) {
      evidenceMap[domain] = aggregatedChakra[domain].evidence;
      scoresMap[domain] = {
        value: aggregatedChakra[domain].evidence.adjustedScore,
        min: aggregatedChakra[domain].min,
        max: aggregatedChakra[domain].max,
        spread: aggregatedChakra[domain].spread,
        timeSensitive: aggregatedChakra[domain].timeSensitive
      };
    }
    chakraProfiles = buildChakraProfiles(evidenceMap, scoresMap, chartSignature);
    
    confidence = {
      level: 'medium',
      notes: [
        'Geboortetijd onbekend - 12 tijdstippen gesimuleerd',
        'Maan en Zon posities zijn betrouwbaar',
        'Lagna en huisposities zijn geschat op basis van meest waarschijnlijke scenario\'s',
        lagnaOptions.length > 0 ? `Meest waarschijnlijke Lagna: ${lagnaOptions[0].sign} (${lagnaOptions[0].probability}%)` : ''
      ].filter(Boolean)
    };
  }

  derived = {
    zodiacMode: primaryChart.zodiacMode,
    moonSign: getMoonSignNL(primaryChart),
    moonSignTropical: primaryChart.moon.rashiTropicalNL,
    moonSignSidereal: primaryChart.moon.rashiSiderealNL,
    moonNakshatra: primaryChart.moon.nakshatraName,
    moonPada: primaryChart.moon.pada,
    sunSign: getSunSignNL(primaryChart),
    sunSignTropical: primaryChart.sun.rashiTropicalNL,
    sunSignSidereal: primaryChart.sun.rashiSiderealNL,
    lagnaSign: getLagnaSignNL(primaryChart),
    lagnaSignTropical: primaryChart.lagna?.signTropicalNL || null,
    lagnaSignSidereal: primaryChart.lagna?.signSiderealNL || null,
    lagnaOptions,
    timeUnknown: !hasTime,
    ayanamsa: primaryChart.ayanamsa?.valueDegrees ?? null
  };

  methodology = generateMethodology(primaryChart, hasTime);
  methodology.chartHighlights = chartHighlights;

  const sections = generateSections(domainScores, primaryChart);

  return {
    version: '2.1.0',
    locale: 'nl-NL',
    generatedAt: new Date().toISOString(),
    input,
    derived,
    confidence,
    domainScores,
    sections,
    methodology,
    disclaimer: generateDisclaimer(),
    chartData: primaryChart,
    chakraProfiles,
    debugInfo: primaryChart.debugInfo
  };
}

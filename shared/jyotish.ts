import * as Astronomy from 'astronomy-engine';
import { DateTime } from 'luxon';
import type { ChartData, Planet, PlanetData, LagnaData, ProfileInput, DebugInfo, ZodiacMode } from './schema';

const SIGNS_NL = [
  'Ram', 'Stier', 'Tweelingen', 'Kreeft', 'Leeuw', 'Maagd',
  'Weegschaal', 'Schorpioen', 'Boogschutter', 'Steenbok', 'Waterman', 'Vissen'
] as const;

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
] as const;

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

export function getLahiriAyanamsa(date: Date): number {
  const jd = getJulianDay(date);
  const T = (jd - 2451545.0) / 36525.0;
  const lahiri = 23.85 + (50.2564 / 3600.0) * (jd - 2415020.0) / 36525.0 * 100;
  return Math.min(Math.max(lahiri, 22), 25);
}

export function tropicalToSidereal(tropicalDeg: number, ayanamsa: number): number {
  let sidereal = tropicalDeg - ayanamsa;
  if (sidereal < 0) sidereal += 360;
  if (sidereal >= 360) sidereal -= 360;
  return sidereal;
}

export function getSignIndex(longitude: number): number {
  return Math.floor(longitude / 30) % 12;
}

export function getNakshatra(siderealDeg: number): { index: number; name: string; pada: number } {
  const nakshatraSpan = 360 / 27;
  const index = Math.floor(siderealDeg / nakshatraSpan) % 27;
  const posInNakshatra = siderealDeg % nakshatraSpan;
  const pada = Math.floor(posInNakshatra / (nakshatraSpan / 4)) + 1;
  
  return {
    index,
    name: NAKSHATRA_NAMES[index],
    pada: Math.min(4, Math.max(1, pada))
  };
}

interface DignityInfo {
  exaltation: number;
  debilitation: number;
  ownSigns: number[];
  friendlySigns: number[];
  enemySigns: number[];
}

const PLANET_DIGNITIES: Record<string, DignityInfo> = {
  Sun: {
    exaltation: 0,
    debilitation: 6,
    ownSigns: [4],
    friendlySigns: [0, 3, 8, 11],
    enemySigns: [5, 6, 9, 10]
  },
  Moon: {
    exaltation: 1,
    debilitation: 7,
    ownSigns: [3],
    friendlySigns: [1, 5, 10],
    enemySigns: [7, 9]
  },
  Mars: {
    exaltation: 9,
    debilitation: 3,
    ownSigns: [0, 7],
    friendlySigns: [4, 8, 11],
    enemySigns: [1, 2, 5, 6]
  },
  Mercury: {
    exaltation: 5,
    debilitation: 11,
    ownSigns: [2, 5],
    friendlySigns: [1, 6, 9, 10],
    enemySigns: [3, 8, 11]
  },
  Jupiter: {
    exaltation: 3,
    debilitation: 9,
    ownSigns: [8, 11],
    friendlySigns: [0, 3, 4, 7],
    enemySigns: [1, 2, 5, 6, 9, 10]
  },
  Venus: {
    exaltation: 11,
    debilitation: 5,
    ownSigns: [1, 6],
    friendlySigns: [2, 9, 10],
    enemySigns: [0, 4, 7]
  },
  Saturn: {
    exaltation: 6,
    debilitation: 0,
    ownSigns: [9, 10],
    friendlySigns: [1, 2, 5, 6, 11],
    enemySigns: [0, 3, 4, 7, 8]
  },
  Rahu: {
    exaltation: 2,
    debilitation: 8,
    ownSigns: [10],
    friendlySigns: [1, 2, 5, 6, 9],
    enemySigns: [0, 4, 7, 8, 11]
  },
  Ketu: {
    exaltation: 8,
    debilitation: 2,
    ownSigns: [7],
    friendlySigns: [0, 3, 4, 8, 11],
    enemySigns: [1, 2, 5, 6, 9, 10]
  }
};

export function getDignityScore(planet: string, signIndex: number): number {
  const dignity = PLANET_DIGNITIES[planet];
  if (!dignity) return 0;
  
  if (signIndex === dignity.exaltation) return 8;
  if (signIndex === dignity.debilitation) return -8;
  if (dignity.ownSigns.includes(signIndex)) return 6;
  if (dignity.friendlySigns.includes(signIndex)) return 3;
  if (dignity.enemySigns.includes(signIndex)) return -3;
  return 0;
}

export function getHouseScore(house: number | null): number {
  if (house === null) return 0;
  
  if (house === 1 || house === 5 || house === 9) return 4;
  if (house === 4 || house === 7 || house === 10) return 3;
  if (house === 3 || house === 6 || house === 11) return 2;
  if (house === 8 || house === 12) return -4;
  if (house === 2) return -1;
  return 0;
}

export function calculatePlanetStrength(planet: string, signIndex: number, house: number | null, retrograde: boolean = false): number {
  let strength = getDignityScore(planet, signIndex);
  strength += getHouseScore(house);
  
  if (retrograde && planet !== 'Sun' && planet !== 'Moon') {
    strength += 1;
  }
  
  return Math.max(-10, Math.min(10, strength));
}

function getPlanetLongitude(planet: string, date: Date): { tropical: number; retrograde: boolean } {
  const body = planet as Astronomy.Body;
  
  try {
    const geo = Astronomy.GeoVector(body, date, false);
    const ecliptic = Astronomy.Ecliptic(geo);
    
    let retrograde = false;
    if (planet !== 'Sun' && planet !== 'Moon') {
      const dayBefore = new Date(date.getTime() - 86400000);
      const geoBefore = Astronomy.GeoVector(body, dayBefore, false);
      const eclipticBefore = Astronomy.Ecliptic(geoBefore);
      
      let diff = ecliptic.elon - eclipticBefore.elon;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      retrograde = diff < 0;
    }
    
    return { tropical: ecliptic.elon, retrograde };
  } catch (e) {
    console.error(`Error calculating ${planet} position:`, e);
    return { tropical: 0, retrograde: false };
  }
}

function calculateMeanLunarNode(date: Date): number {
  const jd = getJulianDay(date);
  const T = (jd - 2451545.0) / 36525.0;
  
  let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000;
  
  omega = omega % 360;
  if (omega < 0) omega += 360;
  
  return omega;
}

function calculateAscendant(date: Date, lat: number, lon: number): number {
  const lstHours = calculateLocalSiderealTime(date, lon);
  const lstDeg = lstHours * 15;
  
  const obliquity = 23.4393;
  const latRad = lat * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;
  const lstRad = lstDeg * Math.PI / 180;
  
  const y = -Math.cos(lstRad);
  const x = Math.sin(oblRad) * Math.tan(latRad) + Math.cos(oblRad) * Math.sin(lstRad);
  
  let ascendant = Math.atan2(y, x) * 180 / Math.PI;
  
  if (ascendant < 0) ascendant += 360;
  
  return ascendant;
}

function calculateLocalSiderealTime(date: Date, longitude: number): number {
  const jd = getJulianDay(date);
  const T = (jd - 2451545.0) / 36525.0;
  
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
    0.000387933 * T * T - T * T * T / 38710000;
  
  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;
  
  let lst = gmst + longitude;
  lst = lst % 360;
  if (lst < 0) lst += 360;
  
  return lst / 15;
}

function getJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24 + B - 1524.5;
}

function parseLocalTimeToUTC(birthDate: string, birthTime: string, timezone: string): { utcDate: Date; localDt: DateTime; warnings: string[] } {
  const warnings: string[] = [];
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = (birthTime || '12:00').split(':').map(Number);
  
  const localDt = DateTime.fromObject(
    { year, month, day, hour, minute, second: 0 },
    { zone: timezone }
  );
  
  if (!localDt.isValid) {
    warnings.push(`Ongeldige datum/tijd combinatie: ${localDt.invalidReason}`);
    const fallback = new Date(Date.UTC(year, month - 1, day, hour, minute));
    return { utcDate: fallback, localDt: DateTime.utc(year, month, day, hour, minute), warnings };
  }
  
  const utcDt = localDt.toUTC();
  const utcDate = utcDt.toJSDate();
  
  return { utcDate, localDt, warnings };
}

function checkSignBoundary(longitude: number, signName: string): string | null {
  const degInSign = longitude % 30;
  if (degInSign <= 0.5 || degInSign >= 29.5) {
    return `${signName} ligt dicht bij tekenovergang (${degInSign.toFixed(1)}°); kleine tijdafwijking kan teken veranderen.`;
  }
  return null;
}

export function computeChart(input: ProfileInput, specificTime?: Date): ChartData {
  const lat = input.latitude ?? 52.37;
  const lon = input.longitude ?? 4.89;
  const zodiacMode: ZodiacMode = input.zodiacMode || 'sidereal';
  const warnings: string[] = [];
  
  let dateTime: Date;
  let localDt: DateTime;
  let isDST = false;
  let offsetMinutes = 0;
  
  if (specificTime) {
    dateTime = specificTime;
    localDt = DateTime.fromJSDate(specificTime, { zone: input.timezone });
    isDST = localDt.isInDST;
    offsetMinutes = localDt.offset;
  } else {
    const parsed = parseLocalTimeToUTC(input.birthDate, input.birthTime || '12:00', input.timezone);
    dateTime = parsed.utcDate;
    localDt = parsed.localDt;
    isDST = localDt.isInDST;
    offsetMinutes = localDt.offset;
    warnings.push(...parsed.warnings);
  }
  
  const ayanamsa = getLahiriAyanamsa(dateTime);
  
  const hasTime = !input.timeUnknown && !!input.birthTime;
  
  if (!input.latitude || !input.longitude) {
    warnings.push('Coördinaten niet expliciet opgegeven; standaardwaarden gebruikt.');
  }
  
  let lagna: LagnaData | null = null;
  if (hasTime) {
    const tropicalAsc = calculateAscendant(dateTime, lat, lon);
    const siderealAsc = tropicalToSidereal(tropicalAsc, ayanamsa);
    const tropicalSign = getSignIndex(tropicalAsc);
    const siderealSign = getSignIndex(siderealAsc);
    
    const tropicalBoundary = checkSignBoundary(tropicalAsc, SIGNS_NL[tropicalSign]);
    const siderealBoundary = checkSignBoundary(siderealAsc, SIGNS_NL[siderealSign]);
    if (tropicalBoundary) warnings.push(`Tropische Ascendant: ${tropicalBoundary}`);
    if (siderealBoundary) warnings.push(`Sidereale Ascendant: ${siderealBoundary}`);
    
    lagna = {
      lonTropicalDeg: tropicalAsc,
      lonSiderealDeg: siderealAsc,
      signTropical: tropicalSign,
      signTropicalNL: SIGNS_NL[tropicalSign],
      signSidereal: siderealSign,
      signSiderealNL: SIGNS_NL[siderealSign]
    };
  }
  
  const planets: Record<Planet, PlanetData> = {} as Record<Planet, PlanetData>;
  
  const astronomyPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  
  for (const planet of astronomyPlanets) {
    const { tropical, retrograde } = getPlanetLongitude(planet, dateTime);
    const sidereal = tropicalToSidereal(tropical, ayanamsa);
    const tropicalSign = getSignIndex(tropical);
    const siderealSign = getSignIndex(sidereal);
    const nakshatra = getNakshatra(sidereal);
    
    const activeSign = zodiacMode === 'sidereal' ? siderealSign : tropicalSign;
    
    let houseWholeSign: number | null = null;
    let housePlacidus: number | null = null;
    if (lagna) {
      const lagnaSign = zodiacMode === 'sidereal' ? lagna.signSidereal : lagna.signTropical;
      houseWholeSign = ((activeSign - lagnaSign + 12) % 12) + 1;
    }
    
    const strength = calculatePlanetStrength(planet, activeSign, houseWholeSign, retrograde);
    
    planets[planet as Planet] = {
      lonTropicalDeg: tropical,
      lonSiderealDeg: sidereal,
      signTropical: tropicalSign,
      signTropicalNL: SIGNS_NL[tropicalSign],
      signSidereal: siderealSign,
      signSiderealNL: SIGNS_NL[siderealSign],
      houseWholeSign,
      housePlacidus,
      nakshatra,
      retrograde,
      strength
    };
  }
  
  const rahuTropical = calculateMeanLunarNode(dateTime);
  const rahuSidereal = tropicalToSidereal(rahuTropical, ayanamsa);
  const rahuTropicalSign = getSignIndex(rahuTropical);
  const rahuSiderealSign = getSignIndex(rahuSidereal);
  const rahuActiveSign = zodiacMode === 'sidereal' ? rahuSiderealSign : rahuTropicalSign;
  let rahuHouse: number | null = null;
  if (lagna) {
    const lagnaSign = zodiacMode === 'sidereal' ? lagna.signSidereal : lagna.signTropical;
    rahuHouse = ((rahuActiveSign - lagnaSign + 12) % 12) + 1;
  }
  
  planets.Rahu = {
    lonTropicalDeg: rahuTropical,
    lonSiderealDeg: rahuSidereal,
    signTropical: rahuTropicalSign,
    signTropicalNL: SIGNS_NL[rahuTropicalSign],
    signSidereal: rahuSiderealSign,
    signSiderealNL: SIGNS_NL[rahuSiderealSign],
    houseWholeSign: rahuHouse,
    housePlacidus: null,
    nakshatra: getNakshatra(rahuSidereal),
    retrograde: true,
    strength: calculatePlanetStrength('Rahu', rahuActiveSign, rahuHouse, true)
  };
  
  const ketuTropical = (rahuTropical + 180) % 360;
  const ketuSidereal = (rahuSidereal + 180) % 360;
  const ketuTropicalSign = getSignIndex(ketuTropical);
  const ketuSiderealSign = getSignIndex(ketuSidereal);
  const ketuActiveSign = zodiacMode === 'sidereal' ? ketuSiderealSign : ketuTropicalSign;
  let ketuHouse: number | null = null;
  if (lagna) {
    const lagnaSign = zodiacMode === 'sidereal' ? lagna.signSidereal : lagna.signTropical;
    ketuHouse = ((ketuActiveSign - lagnaSign + 12) % 12) + 1;
  }
  
  planets.Ketu = {
    lonTropicalDeg: ketuTropical,
    lonSiderealDeg: ketuSidereal,
    signTropical: ketuTropicalSign,
    signTropicalNL: SIGNS_NL[ketuTropicalSign],
    signSidereal: ketuSiderealSign,
    signSiderealNL: SIGNS_NL[ketuSiderealSign],
    houseWholeSign: ketuHouse,
    housePlacidus: null,
    nakshatra: getNakshatra(ketuSidereal),
    retrograde: true,
    strength: calculatePlanetStrength('Ketu', ketuActiveSign, ketuHouse, true)
  };
  
  const moonData = planets.Moon;
  const sunData = planets.Sun;
  
  const debugInfo: DebugInfo = {
    inputLocal: {
      date: input.birthDate,
      time: input.birthTime || '12:00',
      place: input.birthPlace
    },
    interpreted: {
      timezone: input.timezone,
      isDST,
      localDatetimeISO: localDt.toISO() || '',
      utcDatetimeISO: dateTime.toISOString(),
      latitude: lat,
      longitude: lon,
      offsetMinutes
    },
    astroConfig: {
      zodiacMode,
      ayanamsaDegrees: zodiacMode === 'sidereal' ? ayanamsa : null,
      houseSystem: zodiacMode === 'sidereal' ? 'Whole Sign' : 'Placidus'
    },
    results: {
      sunLonTropical: sunData.lonTropicalDeg,
      sunLonSidereal: sunData.lonSiderealDeg,
      sunSignTropical: sunData.signTropicalNL,
      sunSignSidereal: sunData.signSiderealNL,
      moonLonTropical: moonData.lonTropicalDeg,
      moonLonSidereal: moonData.lonSiderealDeg,
      moonSignTropical: moonData.signTropicalNL,
      moonSignSidereal: moonData.signSiderealNL,
      ascLonTropical: lagna?.lonTropicalDeg ?? null,
      ascLonSidereal: lagna?.lonSiderealDeg ?? null,
      ascSignTropical: lagna?.signTropicalNL ?? null,
      ascSignSidereal: lagna?.signSiderealNL ?? null
    },
    warnings
  };
  
  return {
    datetimeUtcISO: dateTime.toISOString(),
    timezone: input.timezone,
    lat,
    lon,
    zodiacMode,
    ayanamsa: zodiacMode === 'sidereal' ? {
      name: 'Lahiri',
      valueDegrees: ayanamsa
    } : null,
    planets,
    lagna,
    housesSystem: zodiacMode === 'sidereal' ? 'Whole Sign' : 'Placidus',
    moon: {
      rashiSignTropical: moonData.signTropical,
      rashiTropicalNL: moonData.signTropicalNL,
      rashiSignSidereal: moonData.signSidereal,
      rashiSiderealNL: moonData.signSiderealNL,
      nakshatraName: moonData.nakshatra?.name || 'Onbekend',
      pada: moonData.nakshatra?.pada || 1
    },
    sun: {
      rashiSignTropical: sunData.signTropical,
      rashiTropicalNL: sunData.signTropicalNL,
      rashiSignSidereal: sunData.signSidereal,
      rashiSiderealNL: sunData.signSiderealNL
    },
    debugInfo
  };
}

export function computeChartsForUnknownTime(input: ProfileInput): ChartData[] {
  const charts: ChartData[] = [];
  const [year, month, day] = input.birthDate.split('-').map(Number);
  
  for (let localHour = 0; localHour < 24; localHour += 2) {
    const localDt = DateTime.fromObject(
      { year, month, day, hour: localHour, minute: 30 },
      { zone: input.timezone }
    );
    const sampleTime = localDt.toUTC().toJSDate();
    
    const modifiedInput = { 
      ...input, 
      timeUnknown: false, 
      birthTime: `${localHour.toString().padStart(2, '0')}:30` 
    };
    const chart = computeChart(modifiedInput, sampleTime);
    charts.push(chart);
  }
  
  return charts;
}

export function getLagnaDistribution(charts: ChartData[], zodiacMode: ZodiacMode): Array<{ sign: string; probability: number }> {
  const lagnaCounts: Record<string, number> = {};
  
  for (const chart of charts) {
    if (chart.lagna) {
      const sign = zodiacMode === 'sidereal' ? chart.lagna.signSiderealNL : chart.lagna.signTropicalNL;
      lagnaCounts[sign] = (lagnaCounts[sign] || 0) + 1;
    }
  }
  
  const total = charts.length;
  const distribution = Object.entries(lagnaCounts)
    .map(([sign, count]) => ({
      sign,
      probability: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.probability - a.probability);
  
  return distribution.slice(0, 3);
}

export { SIGNS_NL, NAKSHATRA_NAMES, PLANET_NAMES_NL };

/**
 * Deterministic mock narrative for development when API key is absent.
 * Same input + same seed => identical output.
 */

import type {
  NarrativeGenerateInput,
  NarrativeJSON,
  ChakraNarrativeItem,
  NarrativeSection,
  NarrativeQualityInput,
} from "./types";
import { DOMAIN_LABELS } from "../schema";

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h &= 0x7fffffff;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: string): T {
  const idx = hash(seed) % arr.length;
  return arr[idx];
}

function pickN<T>(arr: T[], seed: string, n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n && arr.length > 0; i++) {
    const idx = hash(`${seed}:${i}`) % arr.length;
    out.push(arr[idx]);
  }
  return out;
}

const DISCLAIMERS = [
  "Dit profiel is gebaseerd op astrologische indicatoren en is geen medisch advies. Raadpleeg een professional bij gezondheidsvragen.",
  "Deze informatie is wellness-gericht en vervangt geen professioneel advies. Bij klachten: raadpleeg een arts.",
];

const ONE_LINERS = [
  "Je energieprofiel laat een mix van sterke en uitdagende domeinen zien; gerichte aandacht kan balans verbeteren.",
  "Op basis van je horoscoopgegevens zie je hier je chakra- en energiedomeinen in kaart gebracht.",
  "Dit overzicht biedt inzicht in je energiebalans vanuit astrologisch perspectief—gebruik het als inspiratie.",
];

const HOW_TO_USE = [
  "Gebruik dit profiel als startpunt voor bewustwording. Pas adviezen aan op je eigen ervaring.",
  "Neem de suggesties mee in je dagelijkse routine; experimenteer en kijk wat werkt.",
];

const KEY_THEMES_POOL = [
  "gronding",
  "flow",
  "kracht",
  "verbinding",
  "expressie",
  "intuïtie",
  "rust",
  "ritme",
  "structuur",
  "hydratatie",
  "adem",
  "grenzen",
  "beweging",
  "voeding",
  "herstel",
];

function buildChakraItems(input: NarrativeGenerateInput): ChakraNarrativeItem[] {
  const seed = input.quality?.seed ?? "mock";
  return input.chakraScores.map((cs) => {
    const domainLabel = DOMAIN_LABELS[cs.domain as keyof typeof DOMAIN_LABELS] ?? cs.domain;
    const scoreText =
      cs.value >= 65
        ? `De ${domainLabel} toont een sterke basis.`
        : cs.value >= 50
          ? `De ${domainLabel} is in redelijke balans.`
          : `De ${domainLabel} vraagt om extra aandacht.`;

    const trendBase =
      cs.value >= 60
        ? "Je systeem heeft hier natuurlijke steun vanuit de horoscoop."
        : cs.value >= 45
          ? "Er is ruimte voor verfijning; kleine aanpassingen kunnen helpen."
          : "Dit domein kan baat hebben bij gerichte oefening en aandacht.";

    const timeNote = input.timeUnknown ? " (Let op: geboortetijd onbekend—sommige punten kunnen variëren.)" : "";
    const naturalTrendNL = trendBase + timeNote;

    const evidenceBulletsNL = cs.signals
      .slice(0, 5)
      .map((s) => `${s.factor}: ${s.reason}`);

    const balancedPool = [
      "Je voelt je stabiel in dit gebied.",
      "Er is ruimte voor groei.",
      "Je kunt hier op bouwen.",
      "Balans is bereikbaar.",
      "Je hebt natuurlijke aanleg.",
      "Ritme ondersteunt je hier.",
      "Je bent gevoelig voor de juiste prikkels.",
    ];

    const imbalancedPool = [
      "Spanning kan hier oplopen.",
      "Extra aandacht helpt.",
      "Stress kan zich hier manifesteren.",
      "Rust en regelmaat zijn belangrijk.",
      "Grenzen stellen helpt.",
      "Overprikkeling kan optreden.",
      "Herstel vraagt bewuste keuzes.",
    ];

    const resetsPool = [
      "Neem korte pauzes gedurende de dag.",
      "Ademhalingsoefeningen kunnen helpen.",
      "Lichte beweging ondersteunt dit domein.",
      "Structuur in je dag geeft rust.",
    ];

    return {
      chakraDomain: cs.domain as ChakraNarrativeItem["chakraDomain"],
      scoreTextNL: scoreText,
      naturalTrendNL,
      balancedNL: pickN(balancedPool, `${seed}:${cs.domain}:bal`, 6),
      imbalancedNL: pickN(imbalancedPool, `${seed}:${cs.domain}:imb`, 6),
      practicalResetsNL: pickN(resetsPool, `${seed}:${cs.domain}:res`, 4),
      evidenceBulletsNL: evidenceBulletsNL.length >= 4 ? evidenceBulletsNL : [
        ...evidenceBulletsNL,
        ...Array.from({ length: 4 - evidenceBulletsNL.length }, (_, i) => `Signaal ${i + 1} (zie horoscoop)`),
      ].slice(0, 6),
    };
  });
}

function buildBulletsSection(
  id: "strengths" | "weaknesses" | "nutrition" | "movement" | "strengthBuild" | "flexibility" | "functionality",
  titleNL: string,
  seed: string,
  count: number = 6
): { id: typeof id; titleNL: string; bulletsNL: string[] } {
  const pools: Record<string, string[]> = {
    strengths: ["Natuurlijke veerkracht.", "Aanpassingsvermogen.", "Doorzettingsvermogen.", "Gevoeligheid voor ritme.", "Aandacht voor lichaam.", "Empathie.", "Structuurgevoel.", "Creativiteit."],
    weaknesses: ["Spanning kan oplopen.", "Overprikkeling mogelijk.", "Rust is belangrijk.", "Grenzen helpen.", "Structuur ondersteunt.", "Herstel vraagt tijd.", "Balans zoeken.", "Pauzes nemen."],
    nutrition: ["Eet regelmatig en gevarieerd.", "Let op hydratatie.", "Warme maaltijden ondersteunen.", "Vermijd zware maaltijden laat.", "Kies voedzame snacks.", "Luister naar je lichaam.", "Ritme in eten helpt.", "Variatie is goed."],
    movement: ["Lichte beweging dagelijks.", "Wandelen ondersteunt.", "Ritmische activiteit helpt.", "Pauzes met beweging.", "Rekken en strekken.", "Adem tijdens bewegen.", "Bouw rustig op.", "Consistentie werkt."],
    strengthBuild: ["Progressieve belasting.", "Core-oefeningen helpen.", "Rust tussen sets.", "Ademhaling begeleiden.", "Structuur in schema.", "Luister naar signalen.", "Bouw langzaam op.", "Focus op vorm."],
    flexibility: ["Rekken na beweging.", "Yoga of stretchen.", "Adem mee bij stretch.", "Niet forceren.", "Regelmatigheid telt.", "Ontspanning integreren.", "Pauzes tussen oefeningen.", "Langzaam opbouwen."],
    functionality: ["Praktische dagelijkse beweging.", "Ritme in activiteiten.", "Grenzen respecteren.", "Herstel inbouwen.", "Variatie in taken.", "Structuur helpt.", "Luister naar lichaam.", "Kleine aanpassingen."],
  };
  const pool = pools[id] ?? pools.strengths;
  const bulletsNL = pickN(pool, `${seed}:${id}`, count);
  return { id, titleNL, bulletsNL };
}

export function buildMockNarrative(input: NarrativeGenerateInput & { quality: NarrativeQualityInput }): NarrativeJSON {
  const seed = input.quality.seed;
  const viewLabelNL =
    input.systemType === "jyotish"
      ? "Oosters"
      : input.systemType === "tropical"
        ? "Westers"
        : "Chinees";

  const disclaimerNL = pick(DISCLAIMERS, seed);
  const oneLiner = pick(ONE_LINERS, seed);
  const keyThemes = pickN(KEY_THEMES_POOL, seed, 5);
  const howToUse = pick(HOW_TO_USE, seed);

  const chakraItems = buildChakraItems(input);
  const chakraSection: NarrativeSection = {
    id: "chakraProfile",
    titleNL: "Chakra Profiel",
    items: chakraItems,
  };

  const bulletsSections: NarrativeSection[] = [
    buildBulletsSection("strengths", "Sterktes", seed),
    buildBulletsSection("weaknesses", "Zwaktes", seed),
    buildBulletsSection("nutrition", "Voeding", seed),
    buildBulletsSection("movement", "Beweging", seed),
    buildBulletsSection("strengthBuild", "Krachtopbouw", seed),
    buildBulletsSection("flexibility", "Flexibiliteit", seed),
    buildBulletsSection("functionality", "Functionaliteit", seed),
  ];

  const sections: NarrativeSection[] = [chakraSection, ...bulletsSections];

  return {
    narrativeVersion: input.narrativeVersion,
    systemType: input.systemType,
    viewLabelNL,
    disclaimerNL,
    summaryNL: {
      oneLiner,
      keyThemes,
      howToUse,
    },
    sections,
    quality: {
      seed: input.quality.seed,
      inputSignature: input.quality.inputSignature,
      usedSignalCount: input.quality.usedSignalCount,
      timeUnknown: input.quality.timeUnknown,
    },
  };
}

import type { Domain } from './schema';
import { DOMAIN_LABELS } from './schema';
import type { ChakraEvidence, ChakraSignal, ChakraProfile } from './chakraScoring';
import { CHAKRA_NAMES_SANSKRIT } from './chakraScoring';

interface NarrativeBlock {
  horoscoopSignals: string[];
  naturalTrend: string;
  balanced: string[];
  imbalanced: string[];
  practicalResets: string[];
}

/**
 * ✅ Belangrijk verschil met de oude versie:
 * - Niet langer “vaste lijsten per chakra” met alleen shuffle.
 * - We maken eerst een “theme fingerprint” op basis van echte signals (planet/element/house/lagna/nakshatra).
 * - Daarna kiezen we tekstfragmenten die passen bij DIE fingerprint (supportive/challenging) + score.
 * - Variatie is deterministisch op basis van chartSignature, zodat het persoonlijk voelt maar reproduceerbaar blijft.
 *
 * Dit houdt het plug-and-play: dezelfde exports en types blijven bestaan.
 */

/* ----------------------------- Utilities ----------------------------- */

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function pickVariant<T>(items: T[], seed: string): T {
  if (items.length === 0) throw new Error('pickVariant: empty items');
  const idx = hashString(seed) % items.length;
  return items[idx];
}

function pickSome<T>(items: T[], seed: string, count: number): T[] {
  if (items.length <= count) return [...items];
  // deterministic shuffle
  const scored = items.map((item, i) => ({
    item,
    score: hashString(`${seed}::${i}::${String(item)}`)
  }));
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, count).map(s => s.item);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function uniqKeepOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const key = it.trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function getAdjectiveForScore(score: number): string {
  if (score >= 75) return 'zeer sterke';
  if (score >= 65) return 'sterke';
  if (score >= 55) return 'solide';
  if (score >= 45) return 'wisselende';
  return 'uitgedaagde';
}

function influenceToPolarity(influence: ChakraSignal['influence']): 'supportive' | 'challenging' | 'neutral' {
  if (influence === 'supportive') return 'supportive';
  if (influence === 'challenging') return 'challenging';
  return 'neutral';
}

/* ----------------------------- Theme Engine ----------------------------- */

/**
 * We werken met “themes” (motieven) die getriggerd worden door signal-tekst.
 * Dit is bewust pragmatisch: ChakraSignal heeft geen tags, dus we detecteren via regex.
 *
 * Als je later ChakraSignal uitbreidt met tags, kun je deze module eenvoudiger maken.
 */

type ThemePolarity = 'supportive' | 'challenging' | 'balancing';
type ThemeId =
  | 'structure_safety'
  | 'control_hold'
  | 'drive_heat'
  | 'soft_flow'
  | 'pleasure_permission'
  | 'service_perfection'
  | 'analysis_overdrive'
  | 'truth_boundary'
  | 'heart_opening'
  | 'duty_love'
  | 'stillness_need'
  | 'overstimulation'
  | 'intuition_trust'
  | 'social_field'
  | 'transform_depth'
  | 'communication_precision'
  | 'grounding_body';

interface ThemeRule {
  id: ThemeId;
  polarity: ThemePolarity;
  domains: Domain[]; // where it matters most
  match: (s: ChakraSignal) => boolean;
  // Text fragments that can be used in narrative assembly
  fragments: {
    signalBecause: string[]; // used in “Horoscoop-signalen”
    trend: string[];
    balanced: string[];
    imbalanced: string[];
    resets: string[];
  };
}

/**
 * Helper matchers
 */
const re = (r: RegExp) => (s: ChakraSignal) => r.test(`${s.factor} ${s.reason}`);

const THEME_RULES: ThemeRule[] = [
  // ROOT / grounding / Saturnus / aarde / huis 1/6
  {
    id: 'structure_safety',
    polarity: 'supportive',
    domains: ['root'],
    match: (s) =>
      re(/Saturn(us)?/i)(s) ||
      re(/Maan in Steenbok|Maan in Stier|aarde-?element/i)(s) ||
      re(/huis 1\b|huis 6\b/i)(s),
    fragments: {
      signalBecause: [
        '→ veiligheid via structuur en ritme',
        '→ stabiliteit door verantwoordelijkheid en cadans',
        '→ gronding door voorspelbaarheid'
      ],
      trend: [
        'Je systeem bouwt veiligheid door ritme en voorspelbaarheid; zodra structuur klopt, zakt je energie vanzelf meer in je lichaam.',
        'Stabiliteit ontstaat bij jou vooral via routine: als de basis staat, komt ontspanning daarna.',
        'Je gronding wordt sterker wanneer je simpele gewoontes herhaalt in plaats van alles mentaal te dragen.'
      ],
      balanced: [
        'Je voelt je gegrond zonder dat je alles hoeft te controleren.',
        'Je dagritme ondersteunt je energie (slapen/eten/bewegen zijn stabiel).',
        'Je lichaam voelt “aanwezig”: benen/voeten dragen je zonder onrust.'
      ],
      imbalanced: [
        'Onrust neemt toe als er te weinig structuur is of als alles tegelijk moet.',
        'Je systeem gaat compenseren met controle of vasthouden.',
        'Spanning zakt naar onderrug/bekken/benen wanneer je te lang “door” gaat.'
      ],
      resets: [
        'Maak 15–25 min rustige, ritmische beweging (wandelen/fietsen) zonder doel.',
        'Eet op vaste tijden één warme maaltijd (simpel, voedend).',
        'Kies één kleine routine die je 7 dagen achter elkaar herhaalt.'
      ]
    }
  },
  {
    id: 'grounding_body',
    polarity: 'balancing',
    domains: ['root', 'solar'],
    match: (s) =>
      re(/Ascendant|Lagna/i)(s) ||
      re(/Maagd|Steenbok|Stier/i)(s),
    fragments: {
      signalBecause: [
        '→ lichaam reageert snel op stress (aarden helpt direct)',
        '→ belichaming is je sleutel (niet méér analyse)',
        '→ kleine rituelen maken groot verschil'
      ],
      trend: [
        'Je lichaam is een snelle boodschapper: als je spanning vroeg opmerkt, kun je met kleine resets veel voorkomen.',
        'Je systeem vraagt om “belichamen”: doen wat simpel is (adem, ritme, bewegen) vóór je het gaat verklaren.'
      ],
      balanced: [
        'Je merkt signalen vroeg en stuurt bij voordat het opstapelt.',
        'Je energie blijft verdeeld (niet alleen “bovenin”).'
      ],
      imbalanced: [
        'Je kunt signalen overschrijven met wilskracht, waardoor spanning later terugkomt.',
        'Je voelt je “strak maar moe”: aan de buitenkant functioneel, van binnen leeg.'
      ],
      resets: [
        'Zet elk uur 2 minuten: staan, schouders los, voeten voelen, lange uitademing.',
        'Plan je dag in blokken: 60–90 min focus → 5 min bewegen.'
      ]
    }
  },

  // SACRAL / Venus / flow / water / genot
  {
    id: 'soft_flow',
    polarity: 'supportive',
    domains: ['sacral', 'heart'],
    match: (s) =>
      re(/Venus/i)(s) ||
      re(/water-?element|Maan in Kreeft|Maan in Vissen|Maan in Schorpioen/i)(s) ||
      re(/huis 7\b|huis 8\b/i)(s),
    fragments: {
      signalBecause: [
        '→ emotionele stroom en hechting kleuren je energie',
        '→ verbinding opent je systeem',
        '→ flow komt via gevoel (niet via planning)'
      ],
      trend: [
        'Je energie beweegt mee met gevoel en verbinding; als het veilig is, komt je flow vanzelf op gang.',
        'Je systeem ontspant wanneer je kunt voelen zonder meteen te sturen.'
      ],
      balanced: [
        'Emoties stromen zonder dat je ze hoeft te verklaren.',
        'Je kunt genieten en herstellen via zachtheid (muziek, water, nabijheid).',
        'Heupen/bekken voelen vrijer wanneer je niet “in je hoofd” blijft.'
      ],
      imbalanced: [
        'Emoties stapelen op als je ze te lang inhoudt of rationaliseert.',
        'Je kunt overcompenseren met controle of juist wegdrijven in uitstel.',
        'Genot kan schuld oproepen of onrustig voelen.'
      ],
      resets: [
        '5–8 min heup-mobility met lange uitademing (langzaam, niet forceren).',
        '1 klein plezier per dag zonder nut (muziek, creatief, warm bad).',
        'Hydratatie + zout/mineralen: help je systeem “stromen”.'
      ]
    }
  },
  {
    id: 'pleasure_permission',
    polarity: 'challenging',
    domains: ['sacral'],
    match: (s) =>
      re(/Maan in Steenbok|Saturn(us)?/i)(s) &&
      re(/sacral|Svadhisthana|genot|flow/i)(s) === false, // allow even if not explicit
    fragments: {
      signalBecause: [
        '→ plezier komt pas ná plicht (kan flow remmen)',
        '→ ontspanning voelt soms “onverdiend”',
        '→ zachtheid heeft toestemming nodig'
      ],
      trend: [
        'Je systeem kan genot “uitstellen” tot alles af is; daardoor raakt flow soms op de achtergrond.',
        'Ontspanning werkt bij jou het best wanneer je het klein en concreet maakt (geen groot plan).'
      ],
      balanced: [
        'Je kunt genieten zonder dat je eerst alles hoeft te regelen.',
        'Je laat jezelf toe om te herstellen zonder schuldgevoel.'
      ],
      imbalanced: [
        'Je schakelt genot uit en gaat op discipline draaien.',
        'Je wordt strak of droog in emotie, terwijl je eigenlijk behoefte hebt aan flow.'
      ],
      resets: [
        'Plan 10 minuten “nutloos” herstel als afspraak (en hou het klein).',
        'Kies één zintuiglijke reset: warm drinken, geur, aanraking, muziek.'
      ]
    }
  },

  // SOLAR / Zon / Mars / vuur / grenzen / tempo
  {
    id: 'drive_heat',
    polarity: 'supportive',
    domains: ['solar', 'root'],
    match: (s) =>
      re(/Zon|Sun|Mars/i)(s) ||
      re(/vuur-?element|Ram|Leeuw|Boogschutter/i)(s) ||
      re(/huis 5\b|huis 10\b|Upachaya/i)(s),
    fragments: {
      signalBecause: [
        '→ wilskracht en daadkracht zijn kernmotoren',
        '→ je systeem gaat goed op richting en doel',
        '→ actie geeft energie, zolang er herstel is'
      ],
      trend: [
        'Je motor start snel: als je richting voelt, komt daadkracht vanzelf. De kunst is pacing, zodat je energie niet “opbrandt”.',
        'Je kunt veel dragen wanneer je tempo klopt; ritme is belangrijker dan intensiteit.'
      ],
      balanced: [
        'Je stelt grenzen helder zonder hard te worden.',
        'Je voelt gezonde drive met ruimte voor herstel.',
        'Je core/adem blijven vrij: actie en rust wisselen elkaar af.'
      ],
      imbalanced: [
        'Je gaat te lang door op wilskracht en merkt pas laat dat je leeg bent.',
        'Irritatie of innerlijke druk kan opkomen bij veel verplichting.',
        'Spanning in middenrif/buik kan toenemen bij stress.'
      ],
      resets: [
        'Werk in blokken: 45–90 min focus → 5 min bewegen/ademen.',
        'Eet rustig en warm; stress-eten maakt de motor onrustig.',
        '2× per week rustige core-stabiliteit (kwaliteit > zwaar).'
      ]
    }
  },
  {
    id: 'control_hold',
    polarity: 'challenging',
    domains: ['solar', 'root'],
    match: (s) =>
      re(/Schorpioen|Scorpio|Ketu|Rahu|8\b|huis 8\b/i)(s),
    fragments: {
      signalBecause: [
        '→ intensiteit en controle kunnen zich vastzetten',
        '→ alles-of-niets kan spanning opbouwen',
        '→ loslaten is hier de sleutel'
      ],
      trend: [
        'Je hebt een sterke diepte-energie: dat is krachtig, maar kan ook leiden tot vasthouden als iets onzeker voelt.',
        'Wanneer je spanning probeert te beheersen, slaat het zich vaak op in tempo, buik of adem.'
      ],
      balanced: [
        'Je gebruikt intensiteit als focus, niet als spanning.',
        'Je kunt keuzes maken zonder alles te willen controleren.'
      ],
      imbalanced: [
        'Je wil zekerheid via controle, wat juist druk geeft.',
        'Je houdt emotie of spanning vast tot het eruit moet.'
      ],
      resets: [
        'Kies één plek om bewust los te laten: kaak, schouders, uitademing.',
        'Maak “goed genoeg” concreet: 80% afronden is ook afronden.'
      ]
    }
  },

  // HEART / Jupiter / Venus / Moon / liefde & herstel
  {
    id: 'heart_opening',
    polarity: 'supportive',
    domains: ['heart', 'crown'],
    match: (s) =>
      re(/Jupiter/i)(s) ||
      re(/Maan in Kreeft|Maan in Vissen|water-?element/i)(s) ||
      re(/huis 4\b/i)(s),
    fragments: {
      signalBecause: [
        '→ herstel en verbinding zijn draagkrachten',
        '→ adem & openheid helpen je systeem reguleren',
        '→ compassie is een stabiliserende factor'
      ],
      trend: [
        'Je herstelt diep wanneer je hart open blijft: verbinding en adem zijn regulerende ankers.',
        'Wanneer je jezelf vriendelijk benadert, wordt je hele systeem rustiger.'
      ],
      balanced: [
        'Je kunt geven én ontvangen zonder jezelf leeg te geven.',
        'Je adem blijft ruim; herstel gaat sneller.',
        'Je blijft verbonden met jezelf ook bij spanning.'
      ],
      imbalanced: [
        'Je trekt je terug of gaat “functioneel” zorgen wanneer het spannend wordt.',
        'Je draagt emoties alleen en sluit je borst/adem af.',
        'Je verwart loyaliteit soms met oververantwoordelijkheid.'
      ],
      resets: [
        '2 minuten hand op hart + 6 langzame uitademingen.',
        'Borst-opening stretch (deurpost) 60–90 sec per kant.',
        'Eén moment per week bewust ontvangen zonder terug te betalen.'
      ]
    }
  },
  {
    id: 'duty_love',
    polarity: 'challenging',
    domains: ['heart'],
    match: (s) =>
      re(/Maan in Steenbok|Saturn(us)?/i)(s),
    fragments: {
      signalBecause: [
        '→ liefde via betrouwbaarheid (kan voelen als taak)',
        '→ zorg wordt snel verantwoordelijkheid',
        '→ zachtheid vraagt ruimte'
      ],
      trend: [
        'Je laat liefde vaak zien door te dragen en betrouwbaar te zijn. Dat is prachtig, maar het hart heeft ook lucht nodig.',
        'Als zorg te functioneel wordt, kan warmte naar de achtergrond schuiven.'
      ],
      balanced: [
        'Je kunt liefhebben zonder het te “regelen”.',
        'Je blijft warm terwijl je grenzen bewaakt.'
      ],
      imbalanced: [
        'Je hart wordt taakgericht: geven zonder echt te ontvangen.',
        'Kwetsbaarheid voelt onhandig of “niet nodig”.'
      ],
      resets: [
        'Zeg één keer per dag: “Dankjewel, ik neem het aan.”',
        'Doe iets zachts zonder functie: muziek, natuur, aanraking.'
      ]
    }
  },

  // THROAT / Mercury / communicatie / precisie / 2e-3e huis
  {
    id: 'communication_precision',
    polarity: 'supportive',
    domains: ['throat', 'thirdEye'],
    match: (s) =>
      re(/Mercuri(us)?|Mercury/i)(s) ||
      re(/huis 2\b|huis 3\b/i)(s) ||
      re(/lucht-?element|Tweelingen|Weegschaal|Waterman|Maagd/i)(s),
    fragments: {
      signalBecause: [
        '→ woorden willen kloppen (precisie)',
        '→ je verwerkt via denken en formuleren',
        '→ nuance is een natuurlijke kracht'
      ],
      trend: [
        'Je expressie is het sterkst wanneer je het simpel houdt: één waarheid per zin, zonder alles te onderbouwen.',
        'Je kunt veel zien en benoemen; de kunst is kort en echt spreken.'
      ],
      balanced: [
        'Je zegt “nee” zonder verdediging.',
        'Je spreekt helder met respect, zonder te veel context.',
        'Je nek/kaak blijven zachter bij lastige gesprekken.'
      ],
      imbalanced: [
        'Je slikt in tot het te laat is (of gaat juist over-uitleggen).',
        'Spanning zet zich vast in kaak/nek/schouders.',
        'Je denkt je weg uit gevoel: praten wordt bescherming.'
      ],
      resets: [
        'Oefen 1 zin: “Dit werkt niet voor mij.” (zonder uitleg).',
        'Kaak-reset: tong tegen gehemelte + lange uitademing, 6×.',
        '10 min “free writing” zonder corrigeren.'
      ]
    }
  },
  {
    id: 'truth_boundary',
    polarity: 'balancing',
    domains: ['throat', 'solar'],
    match: (s) =>
      re(/Zon|Sun|Schorpioen|Scorpio/i)(s),
    fragments: {
      signalBecause: [
        '→ waarheid is belangrijk (directheid)',
        '→ grenzen willen eerlijk zijn',
        '→ woorden kunnen krachtig aanvoelen'
      ],
      trend: [
        'Je waarheid heeft gewicht. Wanneer je die zacht brengt, blijft de boodschap én het contact overeind.',
        'Als je kiest voor eerlijk én warm, wordt communicatie een bron van ontspanning.'
      ],
      balanced: [
        'Je spreekt eerlijk zonder te snijden.',
        'Je bewaakt grenzen zonder drama.'
      ],
      imbalanced: [
        'Waarheid wordt te scherp of juist te stil.',
        'Je vermijdt gesprekken omdat het “te veel” voelt.'
      ],
      resets: [
        'Maak het kleiner: zeg eerst wat je voelt, pas daarna wat je denkt.',
        'Vraag: “Wil je luisteren of meedenken?” vóór je iets oplost.'
      ]
    }
  },

  // THIRD EYE / Rahu/Jupiter/Mercury / overdenken / lucht
  {
    id: 'analysis_overdrive',
    polarity: 'challenging',
    domains: ['thirdEye', 'crown'],
    match: (s) =>
      re(/Rahu|Ketu/i)(s) ||
      re(/third eye|Ajna|intu/i)(s) ||
      re(/lucht-?element|Waterman|Tweelingen|Weegschaal/i)(s),
    fragments: {
      signalBecause: [
        '→ sterke mentale antenne (kan overprikkelen)',
        '→ patroonherkenning kan doorschieten naar overdenken',
        '→ hoofd zoekt zekerheid via analyse'
      ],
      trend: [
        'Je ziet snel patronen en onderstromen. Als je te lang in je hoofd blijft, raakt je systeem sneller overprikkeld.',
        'Je intuïtie werkt beter wanneer je minder probeert te bewijzen en meer probeert te voelen.'
      ],
      balanced: [
        'Je combineert helder denken met rust en vertrouwen.',
        'Je kunt gedachten laten passeren zonder ze af te maken.',
        'Scherm/nieuws beïnvloeden je minder.'
      ],
      imbalanced: [
        'Overdenken, scenario’s, “nog even uitzoeken”.',
        'Schermmoeheid of druk achter ogen/voorhoofd.',
        'Slaap onrustig door een actief brein.'
      ],
      resets: [
        '60/5 regel: 60 min scherm → 5 min horizon/kijken in de verte.',
        '24 uur “geen conclusie” na een groot inzicht.',
        'Adem omlaag: 6 langzame uitademingen naar buik/onderrug.'
      ]
    }
  },
  {
    id: 'intuition_trust',
    polarity: 'supportive',
    domains: ['thirdEye'],
    match: (s) =>
      re(/Jupiter/i)(s) ||
      re(/huis 9\b|huis 11\b/i)(s),
    fragments: {
      signalBecause: [
        '→ inzicht en betekenisgeving zijn natuurlijke gaven',
        '→ innerlijke richting (wijsheid) is aanwezig',
        '→ leren/overzicht ondersteunen je helderheid'
      ],
      trend: [
        'Je intuïtie is vaak praktisch: je “weet” wat klopt als je stil genoeg wordt om het toe te laten.',
        'Betekenis helpt je, maar je lichaam moet mee blijven doen.'
      ],
      balanced: [
        'Je vertrouwt op je innerlijke richting zonder bewijsdrang.',
        'Je ziet het grotere geheel zonder jezelf te verliezen in details.'
      ],
      imbalanced: [
        'Je zoekt zekerheid buiten jezelf terwijl je het eigenlijk al weet.',
        'Je blijft denken waar je mag voelen.'
      ],
      resets: [
        'Schrijf 3 regels: “Wat weet ik al?” en stop dan.',
        'Kies 1 actie die klein is maar klopt (en voer die uit).'
      ]
    }
  },

  // CROWN / Ketu / stilte / 12e huis / overstimulatie
  {
    id: 'stillness_need',
    polarity: 'supportive',
    domains: ['crown'],
    match: (s) =>
      re(/Ketu/i)(s) ||
      re(/huis 12\b/i)(s) ||
      re(/crown|Sahasrara|stilte/i)(s),
    fragments: {
      signalBecause: [
        '→ stilte en ontprikkeling zijn voedend',
        '→ verbinding met “groter geheel” via rust',
        '→ minder input = meer helderheid'
      ],
      trend: [
        'Je systeem laadt op in stilte. Niet als concept, maar als echte ontprikkeling.',
        'Zingeving ontstaat bij jou wanneer het even stil wordt — dan valt alles op z’n plek.'
      ],
      balanced: [
        'Je kunt rust ervaren zonder iets te hoeven oplossen.',
        'Je voelt betekenis zonder dat je het hoeft te verklaren.',
        'Je bent gevoelig voor sfeer, maar wordt er niet door meegesleept.'
      ],
      imbalanced: [
        'Overprikkeling: te veel input, te weinig integratie.',
        'Cynisme of leegte als de verbinding wegvalt.',
        'Slaap wordt lichter of onrustig bij teveel prikkels.'
      ],
      resets: [
        '15 min “low input”: geen scherm, geen gesprek, alleen thee/wandeling.',
        'Eén avond per week: geen nieuws/social media.',
        'Natuur/horizon kijken werkt sneller dan “hard mediteren”.'
      ]
    }
  },
  {
    id: 'overstimulation',
    polarity: 'challenging',
    domains: ['crown', 'thirdEye'],
    match: (s) =>
      re(/Rahu/i)(s) ||
      re(/lucht-?element/i)(s),
    fragments: {
      signalBecause: [
        '→ prikkels komen hard binnen (snelle antenne)',
        '→ je systeem heeft grenzen rond input nodig',
        '→ teveel openstaan maakt moe'
      ],
      trend: [
        'Je bent gevoelig voor informatie en sfeer. Zonder duidelijke prikkelgrenzen raak je sneller vol.',
        'Je energie blijft beter bij je als je input doseert (niet alles hoeft binnen).'
      ],
      balanced: [
        'Je blijft open zonder leeg te lopen.',
        'Je kiest bewust waar je aandacht heen gaat.'
      ],
      imbalanced: [
        'Je voelt je “vol” in je hoofd en toch leeg in je lichaam.',
        'Je wordt sneller moe van mensen/drukte dan je zou willen.'
      ],
      resets: [
        'Maak een “input-venster”: 2 momenten per dag voor nieuws/DM’s.',
        'Na sociale prikkels: 10 min alleen + lang uitademen.'
      ]
    }
  },

  // Social/relationship field (Rahu/7th/11th etc.) - useful for sacral/heart
  {
    id: 'social_field',
    polarity: 'balancing',
    domains: ['sacral', 'heart'],
    match: (s) =>
      re(/huis 7\b|huis 11\b|Rahu/i)(s),
    fragments: {
      signalBecause: [
        '→ relaties beïnvloeden je energie sterk',
        '→ je systeem reguleert via contact of afstand',
        '→ grenzen in verbinding zijn essentieel'
      ],
      trend: [
        'Je energie wordt mede gevormd door je sociale veld. Als grenzen helder zijn, werkt verbinding voedend.',
        'Contact kan opladen, maar alleen wanneer er ook ruimte is om terug te keren naar jezelf.'
      ],
      balanced: [
        'Je kiest verbinding bewust en bewaart je eigen ruimte.',
        'Je voelt wat van jou is en wat van de ander is.'
      ],
      imbalanced: [
        'Je wordt te permeabel: stemming/energie van anderen kleurt je teveel.',
        'Je trekt je terug om te herstellen, maar blijft dan te lang weg.'
      ],
      resets: [
        'Voor/na contact: 60 sec voeten voelen + schouders los (mini-ritueel).',
        'Zeg één grens in het klein: “Ik kan tot X uur.”'
      ]
    }
  },

  // Transformational depth (Scorpio/8th etc.) - useful across
  {
    id: 'transform_depth',
    polarity: 'balancing',
    domains: ['solar', 'thirdEye', 'crown', 'heart'],
    match: (s) => re(/Schorpioen|Scorpio|huis 8\b/i)(s),
    fragments: {
      signalBecause: [
        '→ diepte & transformatie kleuren je pad',
        '→ je gaat liever écht dan oppervlakkig',
        '→ intensiteit vraagt ontlading'
      ],
      trend: [
        'Je voorkeur is diepte: dat geeft kracht, maar vraagt ook bewuste ontlading zodat intensiteit geen spanning wordt.',
        'Wanneer je iets voelt kloppen, ga je er helemaal voor. Dat werkt het best met duidelijke herstelmomenten.'
      ],
      balanced: [
        'Je gebruikt diepte als focus, niet als zwaarte.',
        'Je kunt loslaten zonder je waarheid te verliezen.'
      ],
      imbalanced: [
        'Je houdt vast aan spanning of betekenis wanneer het eigenlijk mag zakken.',
        'Je lichaam wordt de opslagplaats van intensiteit.'
      ],
      resets: [
        'Schrijf 5 zinnen “wat ik vasthoud” en scheur het papier daarna (symbolisch loslaten).',
        'Beweging als ontlading: 10 min stevig wandelen + lange uitademing.'
      ]
    }
  }
];

interface ThemeScore {
  id: ThemeId;
  polarity: ThemePolarity;
  score: number;
  domains: Domain[];
  fragments: ThemeRule['fragments'];
}

function computeThemeScores(domain: Domain, signals: ChakraSignal[]): ThemeScore[] {
  const accum = new Map<ThemeId, ThemeScore>();

  for (const rule of THEME_RULES) {
    if (!rule.domains.includes(domain)) continue;

    for (const s of signals) {
      if (!rule.match(s)) continue;

      const w = clamp(s.weight || 1, 0.5, 20);
      const inf = influenceToPolarity(s.influence);

      // Convert signal influence into a multiplier (makes “challenging” themes more likely to show when signals are challenging)
      let mult = 1;
      if (rule.polarity === 'supportive' && inf === 'challenging') mult = 0.4;
      if (rule.polarity === 'challenging' && inf === 'supportive') mult = 0.4;
      if (rule.polarity === 'balancing') mult = 0.8;

      const add = w * mult;

      const existing = accum.get(rule.id);
      if (existing) {
        existing.score += add;
      } else {
        accum.set(rule.id, {
          id: rule.id,
          polarity: rule.polarity,
          score: add,
          domains: rule.domains,
          fragments: rule.fragments
        });
      }
    }
  }

  const out = Array.from(accum.values());
  out.sort((a, b) => b.score - a.score);
  return out;
}

/* ----------------------------- Narrative Assembly ----------------------------- */

function buildHoroscoopSignals(domain: Domain, evidence: ChakraEvidence, seed: string): string[] {
  const out: string[] = [];

  // Prefer top evidence.signals by weight (they may already be sorted; we sort to be safe)
  const topSignals = [...(evidence.signals || [])]
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 8);

  for (const s of topSignals) {
    const base = `${s.factor}`;
    const because = s.reason ? ` (${s.reason})` : '';
    let arrow = '';

    if (s.influence === 'supportive') arrow = pickVariant(
      [
        `→ ondersteunt ${DOMAIN_LABELS[domain].toLowerCase()}`,
        `→ geeft draagkracht aan ${DOMAIN_LABELS[domain].toLowerCase()}`,
        `→ versterkt ${DOMAIN_LABELS[domain].toLowerCase()}`
      ],
      `${seed}::arrow::supportive::${base}`
    );
    if (s.influence === 'challenging') arrow = pickVariant(
      [
        `→ vraagt aandacht voor ${DOMAIN_LABELS[domain].toLowerCase()}`,
        `→ kan spanning geven rond ${DOMAIN_LABELS[domain].toLowerCase()}`,
        `→ maakt dit thema gevoeliger`
      ],
      `${seed}::arrow::challenging::${base}`
    );

    const bullet = `${base} ${arrow}${because}`.trim();
    out.push(bullet);
  }

  // Add 1–2 theme-based “because” signals (makes it feel personal even when raw signals are generic)
  const themeScores = computeThemeScores(domain, evidence.signals || []);
  const topThemes = themeScores.slice(0, 2);

  for (const t of topThemes) {
    const addon = pickVariant(t.fragments.signalBecause, `${seed}::because::${t.id}`);
    out.push(`${addon}`);
  }

  // Ensure min 4 signals
  while (out.length < 4) {
    out.push(`Algemene chart-invloed op ${DOMAIN_LABELS[domain].toLowerCase()} (weinig uitgesproken signalen)`);
  }

  return uniqKeepOrder(out).slice(0, 6);
}

function assembleBulletsFromThemes(
  domain: Domain,
  themes: ThemeScore[],
  seed: string,
  kind: 'balanced' | 'imbalanced' | 'resets',
  count: number
): string[] {
  const pool: string[] = [];

  // Take top supportive/challenging/balancing depending on kind
  // - balanced: supportive + balancing
  // - imbalanced: challenging + balancing
  // - resets: both, but prefer balancing and challenging if score is low later
  const picks = themes.slice(0, 5);

  for (const t of picks) {
    const fragments = t.fragments[kind] || [];
    for (const frag of fragments) {
      pool.push(frag);
    }
  }

  // Domain-specific fallback pool (still tailored, not generic)
  const FALLBACK: Record<Domain, Record<typeof kind, string[]>> = {
    root: {
      balanced: [
        'Je voelt meer rust in je onderlichaam en maakt keuzes vanuit stabiliteit.',
        'Je dag heeft ankers (slaap/eten/beweging) die je zenuwstelsel kalmeren.'
      ],
      imbalanced: [
        'Je hoofd wil regelen wat je lichaam eigenlijk wil ontladen.',
        'Je blijft “aan” staan terwijl je basis eigenlijk om eenvoud vraagt.'
      ],
      resets: [
        'Kies één simpele basisactie (warm eten, wandelen, vaste bedtijd) en herhaal die 7 dagen.'
      ]
    },
    sacral: {
      balanced: [
        'Je staat jezelf toe om te genieten zonder uitleg of nut.',
        'Je emoties bewegen makkelijker en blijven niet hangen.'
      ],
      imbalanced: [
        'Flow valt weg als alles eerst “af” moet zijn.',
        'Je raakt ofwel te gesloten of te permeabel in verbinding.'
      ],
      resets: [
        'Maak flow klein: 5 minuten bewegen/muziek/warmte is al genoeg om te openen.'
      ]
    },
    solar: {
      balanced: [
        'Je tempo klopt: je kunt sturen zonder te forceren.',
        'Je voelt daadkracht met ruimte voor herstel.'
      ],
      imbalanced: [
        'Je motor draait op wilskracht terwijl je lichaam om pacing vraagt.',
        'Je spant middenrif/buik aan bij druk of verwachtingen.'
      ],
      resets: [
        'Werk in blokken en gebruik beweging als “ontkoppeling” tussen taken.'
      ]
    },
    heart: {
      balanced: [
        'Je kunt verbinden zonder jezelf weg te geven.',
        'Je adem blijft ruim; je herstelt sneller na emotie.'
      ],
      imbalanced: [
        'Je wordt functioneel in liefde: dragen in plaats van voelen.',
        'Je sluit af om niet gekwetst te worden.'
      ],
      resets: [
        'Kies één zachte actie: hart-adem, borst-opening of bewust ontvangen.'
      ]
    },
    throat: {
      balanced: [
        'Je woorden zijn helder en klein genoeg om echt te blijven.',
        'Je grenzen zijn hoorbaar zonder hard te worden.'
      ],
      imbalanced: [
        'Je slikt in of over-uitlegt uit veiligheid.',
        'Kaak/nek nemen spanning over die je niet uitspreekt.'
      ],
      resets: [
        'Zeg één zin zonder uitleg. Adem uit. Klaar.'
      ]
    },
    thirdEye: {
      balanced: [
        'Je ziet patronen zonder erin vast te lopen.',
        'Je vertrouwt je innerlijke richting zonder bewijsdrang.'
      ],
      imbalanced: [
        'Overdenken neemt het over wanneer je systeem te open staat.',
        'Scherm/input maken je sneller moe dan je wilt.'
      ],
      resets: [
        'Doseer input. Laat conclusies 24 uur rusten. Adem omlaag.'
      ]
    },
    crown: {
      balanced: [
        'Stilte voedt je; je voelt betekenis zonder dat je die hoeft te verklaren.',
        'Je blijft open zonder leeg te lopen.'
      ],
      imbalanced: [
        'Overprikkeling maakt je los van je lichaam en rust.',
        'Je zoekt antwoorden terwijl je eigenlijk integratie nodig hebt.'
      ],
      resets: [
        'Maak ruimte voor stilte/low input en laat je systeem integreren.'
      ]
    }
  };

  pool.push(...(FALLBACK[domain]?.[kind] || []));

  const chosen = pickSome(pool, `${seed}::${kind}`, count);
  return uniqKeepOrder(chosen).slice(0, count);
}

function buildNaturalTrend(domain: Domain, score: number, themes: ThemeScore[], seed: string): string {
  const adj = getAdjectiveForScore(score);

  // Use top theme trend if available, else fall back to a domain-aware template
  const topTheme = themes[0];
  if (topTheme && topTheme.fragments.trend.length) {
    const line = pickVariant(topTheme.fragments.trend, `${seed}::trend::${topTheme.id}`);
    return line;
  }

  const FALLBACK_TRENDS: Record<Domain, string[]> = {
    root: [
      `Je hebt een ${adj} basis voor stabiliteit; je systeem ontspant wanneer ritme en eenvoud kloppen.`,
      `Je gronding groeit vooral via herhaling: kleine routines werken sterker dan grote plannen.`
    ],
    sacral: [
      `Je emotionele energie is ${adj}: flow komt wanneer je jezelf toestemming geeft om te voelen en te genieten.`,
      `Je systeem opent via zachtheid en contact, maar heeft ook duidelijke grenzen nodig.`
    ],
    solar: [
      `Je wilskracht is ${adj}: pacing is de sleutel zodat daadkracht geen druk wordt.`,
      `Je systeem reageert sterk op richting en doelen; herstelmomenten houden de motor soepel.`
    ],
    heart: [
      `Je hartenergie is ${adj}: verbinding werkt helend als je ook kunt ontvangen.`,
      `Je herstelt diep via adem, warmte en echte nabijheid zonder taakgevoel.`
    ],
    throat: [
      `Je expressie is ${adj}: als je het klein en eerlijk houdt, blijft je stem krachtig.`,
      `Je keelchakra floreert bij duidelijke grenzen zonder over-uitleg.`
    ],
    thirdEye: [
      `Je inzicht is ${adj}: je ziet snel patronen; ontprikkeling houdt je helder.`,
      `Je intuïtie werkt het best wanneer je minder bewijst en meer voelt.`
    ],
    crown: [
      `Je verbinding met stilte is ${adj}: minder input geeft meer betekenis.`,
      `Zingeving ontstaat bij jou wanneer je systeem mag integreren in rust.`
    ]
  };

  return pickVariant(FALLBACK_TRENDS[domain], `${seed}::fallbacktrend::${adj}`);
}

/* ----------------------------- Public API (same exports) ----------------------------- */

export function generateChakraNarrative(
  domain: Domain,
  evidence: ChakraEvidence,
  score: number,
  scoreMin: number,
  scoreMax: number,
  timeSensitive: boolean,
  chartSignature: string
): NarrativeBlock {
  const seed = `${domain}::${chartSignature}::${score}::${scoreMin}-${scoreMax}::${timeSensitive}`;

  // Compute themes from signals
  const themes = computeThemeScores(domain, evidence.signals || []);

  // Horoscoop signals: make them more causal and less “label-ish”
  const horoscoopSignals = buildHoroscoopSignals(domain, evidence, seed);

  // Natural trend: evidence-driven line
  const naturalTrend = buildNaturalTrend(domain, score, themes, seed);

  // Balanced / imbalanced / resets: assembled from themes with domain-aware fallback
  const balancedCount = score >= 60 ? 6 : 5;
  const imbalancedCount = score <= 45 ? 6 : 5;

  // For resets: if score is low we lean more into challenging themes; if high more into balancing/supportive.
  // We approximate this by re-ordering themes slightly.
  const sortedForResets = [...themes].sort((a, b) => {
    if (score < 50) {
      // challenging first
      const aKey = a.polarity === 'challenging' ? 0 : a.polarity === 'balancing' ? 1 : 2;
      const bKey = b.polarity === 'challenging' ? 0 : b.polarity === 'balancing' ? 1 : 2;
      return aKey - bKey || b.score - a.score;
    }
    // balancing first
    const aKey = a.polarity === 'balancing' ? 0 : a.polarity === 'supportive' ? 1 : 2;
    const bKey = b.polarity === 'balancing' ? 0 : b.polarity === 'supportive' ? 1 : 2;
    return aKey - bKey || b.score - a.score;
  });

  const balanced = assembleBulletsFromThemes(domain, themes, seed, 'balanced', balancedCount);
  const imbalanced = assembleBulletsFromThemes(domain, themes, seed, 'imbalanced', imbalancedCount);
  const practicalResets = assembleBulletsFromThemes(domain, sortedForResets, seed, 'resets', 4);

  if (timeSensitive) {
    practicalResets.push('Tijd onbekend: dit chakra is tijdgevoelig — kies de reset die het meest resoneert met jouw ervaring.');
  }

  return {
    horoscoopSignals,
    naturalTrend,
    balanced,
    imbalanced,
    practicalResets
  };
}

export function buildChakraProfiles(
  evidenceMap: Record<Domain, ChakraEvidence>,
  scoresMap: Record<Domain, { value: number; min: number; max: number; spread: number; timeSensitive: boolean }>,
  chartSignature: string
): ChakraProfile[] {
  const profiles: ChakraProfile[] = [];

  for (const domain of ['root', 'sacral', 'solar', 'heart', 'throat', 'thirdEye', 'crown'] as Domain[]) {
    const evidence = evidenceMap[domain];
    const scoreData = scoresMap[domain];

    const narrative = generateChakraNarrative(
      domain,
      evidence,
      scoreData.value,
      scoreData.min,
      scoreData.max,
      scoreData.timeSensitive,
      chartSignature
    );

    profiles.push({
      domain,
      labelNL: DOMAIN_LABELS[domain],
      sanskritName: CHAKRA_NAMES_SANSKRIT[domain],
      score: scoreData.value,
      scoreMin: scoreData.min,
      scoreMax: scoreData.max,
      timeSensitive: scoreData.timeSensitive,
      evidence,
      signals: evidence.signals,
      naturalTrend: narrative.naturalTrend,
      balanced: narrative.balanced,
      imbalanced: narrative.imbalanced,
      practicalResets: narrative.practicalResets
    });
  }

  return profiles;
}

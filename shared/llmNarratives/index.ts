/**
 * Narrative Engine – LLM-powered Dutch text generation for Energy Profiles.
 * Supports Jyotish, Tropical, and Chinese astrology.
 */

export {
  generateNarrative,
  enrichInputWithQuality,
  type NarrativeProvider,
  type NarrativeEngineConfig,
} from "./engine";

export {
  narrativeJSONSchema,
  parseAndValidateNarrative,
  containsMedicalClaims,
  MEDICAL_CLAIMS_PATTERNS,
  type NarrativeJSONValidated,
} from "./validators";

export {
  buildChineseFeaturesFromEnergyProfile,
  buildNarrativeInputFromChinese,
} from "./chineseAdapter";

export { buildMockNarrative } from "./mockNarrative";

export {
  buildCacheKey,
  getCachedNarrative,
  setCachedNarrative,
} from "./cache";

export {
  bodyProfileToNarrativeInput,
  energyProfileToNarrativeInput,
  NARRATIVE_VERSION,
} from "./payloadAdapter";

export { mergeNarrativeIntoProfile } from "./mergeNarrative";

export type {
  NarrativeJSON,
  NarrativeGenerateInput,
  NarrativeQualityInput,
  NarrativeSection,
  ChakraNarrativeItem,
  ChakraProfileSection,
  BulletsSection,
  SummaryNL,
  NarrativeQuality,
  SystemType,
  NarrativeView,
  EvidenceSignal,
  ChakraScoreInput,
  ChineseFeaturesPlaceholder,
} from "./types";

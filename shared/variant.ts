import type { AstroView, ZodiacMode } from "./schema";

export const VARIANT_IDS = ["variant_01", "variant_02", "variant_03"] as const;
export type VariantId = typeof VARIANT_IDS[number];

export const VARIANT_LABELS: Record<VariantId, string> = {
  variant_01: "Variant 01",
  variant_02: "Variant 02",
  variant_03: "Variant 03",
};

export const VARIANT_TO_VIEW: Record<VariantId, AstroView> = {
  variant_01: "sidereal",
  variant_02: "tropical",
  variant_03: "bazi",
};

export const VIEW_TO_VARIANT: Record<AstroView, VariantId> = {
  sidereal: "variant_01",
  tropical: "variant_02",
  bazi: "variant_03",
};

export const VARIANT_TO_ZODIAC_MODE: Record<VariantId, ZodiacMode> = {
  variant_01: "sidereal",
  variant_02: "tropical",
  variant_03: "sidereal",
};

export function normalizeVariantId(value: string | null | undefined): VariantId | null {
  if (!value) return null;
  return (VARIANT_IDS as readonly string[]).includes(value) ? (value as VariantId) : null;
}

import type { Preset } from "../rules/preset";
import { BASE_MINUTES, baseListPriceEUR } from "../rules/pricing";

export type ProductId =
  | "vod"
  | "signature"
  | "instant"
  | "custom"
  | "rush";

export type Product = {
  preset: Preset;
  customizationAllowed: boolean;
  durationOverrideMin?: number;
  /** Fixed charge for bundles (Elo Rush); not affected by site-wide live promo. */
  priceOverrideEUR?: number;
  isBundle?: boolean;
  sessionsCount?: number;
};

export const products: Record<ProductId, Product> = {
  vod: {
    preset: "vod",
    customizationAllowed: true,
  },

  signature: {
    preset: "signature",
    customizationAllowed: true,
  },

  instant: {
    preset: "instant",
    customizationAllowed: true,
  },

  custom: {
    preset: "custom",
    customizationAllowed: true,
  },

  rush: {
    preset: "rush",
    isBundle: true,
    customizationAllowed: false,
    durationOverrideMin: 60,
    sessionsCount: 4,
    priceOverrideEUR: 90,
  },
};

/** Per-session tier labels in Elo Rush UI (display only). */
export const RUSH_BUNDLE_SESSION_PRICES_EUR = [40, 35, 30, 25] as const;

/** Compare-at strikethrough: 4 × €40 single-session list (€160). */
export const RUSH_BUNDLE_COMPARE_AT_EUR = baseListPriceEUR(BASE_MINUTES) * 4;

/** Tier discount vs session 1 list price (€40). */
export function rushBundleDiscountPercent(sessionPriceEUR: number): number {
  return Math.round(
    (1 - sessionPriceEUR / RUSH_BUNDLE_SESSION_PRICES_EUR[0]) * 100
  );
}

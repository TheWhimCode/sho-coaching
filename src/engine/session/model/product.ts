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
    priceOverrideEUR: 110,
  },
};

/** Per-session tier labels in Elo Rush UI (display only; totals €110). */
export const RUSH_BUNDLE_SESSION_PRICES_EUR = [35, 30, 25, 20] as const;

/** Compare-at strikethrough: 4 × €40 single-session list (€160). */
export const RUSH_BUNDLE_COMPARE_AT_EUR = baseListPriceEUR(BASE_MINUTES) * 4;

/** Tier discount vs €40 single-session list price. */
export function rushBundleDiscountPercent(sessionPriceEUR: number): number {
  const singleListEUR = RUSH_BUNDLE_COMPARE_AT_EUR / 4;
  return Math.round((1 - sessionPriceEUR / singleListEUR) * 100);
}

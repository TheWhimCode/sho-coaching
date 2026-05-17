import type { Preset } from "../rules/preset";
import { BASE_PRICE_EUR } from "../rules/pricing";

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
    priceOverrideEUR: 90,
    sessionsCount: 4,
  },
};

/** Per-session list prices in Elo Rush UI (vs single 60m session). */
export const RUSH_BUNDLE_SESSION_PRICES_EUR = [30, 25, 20, 15] as const;

/** Strikethrough compare-at: 4 × €30 (list price of session 1 in the bundle). */
export const RUSH_BUNDLE_COMPARE_AT_EUR = RUSH_BUNDLE_SESSION_PRICES_EUR[0] * 4;

export function rushBundleDiscountPercent(sessionPriceEUR: number): number {
  return Math.round((1 - sessionPriceEUR / BASE_PRICE_EUR) * 100);
}

// engine/session/rules/pricing.ts
// Optional PRICING_DISCOUNT_PERCENT applies to live time only (also exposed to client via next.config).
import type { SessionConfig } from "../model/session";
import { MIN_MINUTES, MAX_MINUTES } from "../model/session";

export const STEP_MIN = 15;

/** Public list price per 15 minutes of live coaching. */
export const LIST_PRICE_PER_15_MIN_EUR = 10;

/** Fixed price per 15-minute follow-up (not affected by site-wide live promo). */
export const FOLLOWUP_EUR = 15;

/** @deprecated Same as FOLLOWUP_EUR — follow-ups are not promo-discounted. */
export const LIST_FOLLOWUP_EUR = FOLLOWUP_EUR;

/** Reference 60m session length for bundle compare labels. */
export const BASE_MINUTES = 60;

/** @deprecated Use LIST_PRICE_PER_15_MIN_EUR. Kept for imports that expect effective step price. */
export const PRICE_PER_15_MIN_EUR = LIST_PRICE_PER_15_MIN_EUR;

/** 60m effective price after promo (e.g. €30 at 25% off). Used for Elo Rush tier labels. */
export const BASE_PRICE_EUR = liveMinutesPriceEUR(BASE_MINUTES);

export type ComputedPrice = {
  priceEUR: number;
  listPriceEUR: number;
  amountCents: number;
  listAmountCents: number;
  discountPercent: number;
};

function parseDiscountPercent(raw: string | undefined): number {
  const n = parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, n);
}

/** Active site-wide promo from PRICING_DISCOUNT_PERCENT env (0 = charge list prices). */
export function getPricingDiscountPercent(): number {
  return parseDiscountPercent(process.env.PRICING_DISCOUNT_PERCENT);
}

export function hasPromoDiscount(): boolean {
  return getPricingDiscountPercent() > 0;
}

/** Apply configured promo to a list price. */
export function applyPricingDiscount(listEUR: number): number {
  const pct = getPricingDiscountPercent();
  if (pct <= 0) return listEUR;
  return Math.round(listEUR * (1 - pct / 100) * 100) / 100;
}

/** Reconstruct list price from a known final (for fixed bundle tier lines). */
export function listPriceFromFinal(finalEUR: number): number {
  const pct = getPricingDiscountPercent();
  if (pct <= 0 || pct >= 100) return finalEUR;
  return Math.round((finalEUR / (1 - pct / 100)) * 100) / 100;
}

export function baseListPriceEUR(minutes = BASE_MINUTES): number {
  return liveMinutesListPriceEUR(minutes);
}

export function effectiveFollowupEUR(): number {
  return FOLLOWUP_EUR;
}

export function liveMinutesListPriceEUR(minutes: number): number {
  return (minutes / STEP_MIN) * LIST_PRICE_PER_15_MIN_EUR;
}

/** Live coaching final price after promo. */
export function liveMinutesPriceEUR(minutes: number): number {
  return applyPricingDiscount(liveMinutesListPriceEUR(minutes));
}

export function formatPriceEUR(eur: number): string {
  const cents = Math.round(eur * 100);
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2);
}

function toComputedPrice(listEUR: number): ComputedPrice {
  const priceEUR = applyPricingDiscount(listEUR);
  const discountPercent = getPricingDiscountPercent();
  return {
    priceEUR,
    listPriceEUR: listEUR,
    amountCents: Math.round(priceEUR * 100),
    listAmountCents: Math.round(listEUR * 100),
    discountPercent,
  };
}

/**
 * Convert a session config into a structured price breakdown (list + final).
 */
export function computeSessionPrice(c: SessionConfig) {
  const minutes = c.liveMin + c.liveBlocks * 45;

  const minutesListPrice = liveMinutesListPriceEUR(minutes);
  const minutesPrice = applyPricingDiscount(minutesListPrice);
  const followupsListPrice = c.followups * FOLLOWUP_EUR;
  const followupsPrice = followupsListPrice;

  const listPriceEUR =
    Math.round((minutesListPrice + followupsListPrice) * 100) / 100;
  const priceEUR = Math.round((minutesPrice + followupsPrice) * 100) / 100;
  const discountPercent = getPricingDiscountPercent();

  return {
    minutes,
    priceEUR,
    listPriceEUR,
    breakdown: {
      minutesPrice: Math.round(minutesPrice * 100) / 100,
      minutesListPrice: Math.round(minutesListPrice * 100) / 100,
      followupsPrice,
      followupsListPrice: Math.round(followupsListPrice * 100) / 100,
      followups: c.followups,
      liveBlocks: c.liveBlocks,
    },
    amountCents: Math.round(priceEUR * 100),
    listAmountCents: Math.round(listPriceEUR * 100),
    discountPercent,
  };
}

/**
 * Price from live minutes + followups only (no product/bundle).
 */
export function computePriceEUR(liveMinutes: number, followups = 0): ComputedPrice {
  const mins = Math.min(
    MAX_MINUTES,
    Math.max(MIN_MINUTES, Math.round(liveMinutes / STEP_MIN) * STEP_MIN)
  );
  const fu = Math.min(2, Math.max(0, followups | 0));
  const result = computeSessionPrice({
    liveMin: mins,
    liveBlocks: 0,
    followups: fu,
  });
  return {
    priceEUR: result.priceEUR,
    listPriceEUR: result.listPriceEUR,
    amountCents: result.amountCents,
    listAmountCents: result.listAmountCents,
    discountPercent: result.discountPercent,
  };
}

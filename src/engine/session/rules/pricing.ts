// engine/session/rules/pricing.ts
// Single source of truth: €7.50 per 15m live time, +€12.50/follow-up; product overrides for bundles.

import type { SessionConfig } from "../model/session";
import { MIN_MINUTES, MAX_MINUTES } from "../model/session";

export const STEP_MIN = 15;
export const PRICE_PER_15_MIN_EUR = 7.5;
export const FOLLOWUP_EUR = 12.5;

/** Reference 60m live price (4 × €7.50) — used for bundle discount labels, etc. */
export const BASE_MINUTES = 60;
export const BASE_PRICE_EUR = (BASE_MINUTES / STEP_MIN) * PRICE_PER_15_MIN_EUR;

/** Live coaching: always (minutes ÷ 15) × €7.50. */
export function liveMinutesPriceEUR(minutes: number): number {
  return (minutes / STEP_MIN) * PRICE_PER_15_MIN_EUR;
}

/** € display: whole euros when possible, otherwise two decimals (e.g. 7.50). */
export function formatPriceEUR(eur: number): string {
  const cents = Math.round(eur * 100);
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2);
}

/**
 * Convert a session config into a structured price breakdown.
 * Used for both regular sessions (liveMin + liveBlocks) and as the base for product overrides.
 */
export function computeSessionPrice(c: SessionConfig) {
  const minutes = c.liveMin + c.liveBlocks * 45;

  const minutesPrice = liveMinutesPriceEUR(minutes);
  const followupsPrice = c.followups * FOLLOWUP_EUR;

  const amountCents = Math.round((minutesPrice + followupsPrice) * 100);
  const priceEUR = amountCents / 100;

  return {
    minutes,
    priceEUR,
    breakdown: {
      minutesPrice: Math.round(minutesPrice * 100) / 100,
      followupsPrice,
      followups: c.followups,
      liveBlocks: c.liveBlocks,
    },
    amountCents,
  };
}

/**
 * Price from live minutes + followups only (no product/bundle).
 * Same ladder as computeSessionPrice. Use computePriceWithProduct when you have a productId.
 */
export function computePriceEUR(liveMinutes: number, followups = 0) {
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
  return { priceEUR: result.priceEUR, amountCents: result.amountCents };
}

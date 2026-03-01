// engine/session/rules/pricing.ts
// Single source of truth: session ladder (60m = €40, ±€10/15m, +€15/follow-up) and product overrides.

import type { SessionConfig } from "../model/session";
import { MIN_MINUTES, MAX_MINUTES } from "../model/session";

/**
 * Pricing anchor (the reference product)
 * Changing this automatically updates every ladder step.
 */
export const BASE_MINUTES = 60;
export const BASE_PRICE_EUR = 40;

/**
 * Step rules
 */
export const STEP_MIN = 15;
export const STEP_EUR = 10;
export const FOLLOWUP_EUR = 15;

/**
 * Convert a session config into a structured price breakdown.
 * Used for both regular sessions (liveMin + liveBlocks) and as the base for product overrides.
 */
export function computeSessionPrice(c: SessionConfig) {
  const minutes = c.liveMin + c.liveBlocks * 45;

  const minutesPrice =
    BASE_PRICE_EUR + ((minutes - BASE_MINUTES) / STEP_MIN) * STEP_EUR;

  const followupsPrice = c.followups * FOLLOWUP_EUR;

  const priceEUR = Math.round(minutesPrice + followupsPrice);

  return {
    minutes,
    priceEUR,
    breakdown: {
      minutesPrice: Math.round(minutesPrice),
      followupsPrice,
      followups: c.followups,
      liveBlocks: c.liveBlocks
    },
    amountCents: priceEUR * 100
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
    followups: fu
  });
  return { priceEUR: result.priceEUR, amountCents: result.amountCents };
}

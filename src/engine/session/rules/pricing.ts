// engine/session/rules/pricing.ts

import type { SessionConfig } from "../model/session";

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
 */
export function computeSessionPrice(c: SessionConfig) {
  const minutes = c.liveMin + c.liveBlocks * 45;

  // Ladder pricing from the baseline
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

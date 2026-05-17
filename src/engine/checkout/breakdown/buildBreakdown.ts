// engine/checkout/breakdown/buildBreakdown.ts
// Price breakdown for checkout display (base, in-game blocks, followups).

import { computePriceEUR } from "@/engine/session/rules/pricing";
import { MIN_MINUTES, MAX_MINUTES, LIVEBLOCK_MIN } from "@/engine/session/model/session";

const STEP = 15;

export type Breakdown = {
  minutesEUR: number;
  inGameEUR: number;
  followupsEUR: number;
  total: number;
};

function clampStep(n: number): number {
  const s = Math.round(n / STEP) * STEP;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, s));
}

/**
 * Split the price into base minutes, in-game block minutes, and followups.
 * Uses same ladder as computePriceEUR (€7.50/15m live, +€12.50/follow-up).
 */
export function buildBreakdown(
  totalMinutes: number,
  followups: number,
  liveBlocks: number
): Breakdown {
  const t = clampStep(totalMinutes || 60);
  const blocks = Math.max(0, Math.min(2, liveBlocks | 0));
  const inGameMin = blocks * LIVEBLOCK_MIN;

  let baseMinutes = clampStep(t - inGameMin);

  const priceBaseOnly = computePriceEUR(baseMinutes, 0).priceEUR;
  const priceTotalNoFU = computePriceEUR(t, 0).priceEUR;
  const priceWithFU = computePriceEUR(t, followups).priceEUR;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const minutesEUR = priceBaseOnly;
  const inGameEUR = round2(priceTotalNoFU - priceBaseOnly);
  const followupsEUR = round2(priceWithFU - priceTotalNoFU);
  const total = priceWithFU;

  return { minutesEUR, inGameEUR, followupsEUR, total };
}

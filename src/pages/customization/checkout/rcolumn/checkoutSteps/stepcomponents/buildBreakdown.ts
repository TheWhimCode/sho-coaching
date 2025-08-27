// components/checkout/buildBreakdown.ts
import { computePriceEUR } from "@/lib/pricing";

export type Breakdown = {
  minutesEUR: number;    // base-only price
  inGameEUR: number;     // extra price from in-game blocks (additional minutes)
  followupsEUR: number;  // follow-ups
  total: number;
};

const STEP = 15;
const MIN = 30;
const MAX = 120;

function clampStep(n: number) {
  const s = Math.round(n / STEP) * STEP;
  return Math.min(MAX, Math.max(MIN, s));
}

/**
 * Split the price into:
 *  - baseMinutes part
 *  - incremental minutes from liveBlocks (each 45m)
 *  - followups
 *
 * Pricing ladder comes from computePriceEUR(totalMinutes, followups):
 *   60m = €40, ±€10 per 15m step, +€15 per follow-up
 */
export function buildBreakdown(totalMinutes: number, followups: number, liveBlocks: number): Breakdown {
  const t = clampStep(totalMinutes || 60);
  const blocks = Math.max(0, Math.min(2, liveBlocks | 0));
  const inGameMin = blocks * 45;

  // derive base minutes from total - in-game
  let baseMinutes = clampStep(t - inGameMin);
  // if clamping pushed base up, reduce in-game mins so base+inGame==t
  const actualInGameMin = Math.max(0, t - baseMinutes);

  // Prices (no follow-ups first)
  const priceBaseOnly = computePriceEUR(baseMinutes, 0).priceEUR;
  const priceTotalNoFU = computePriceEUR(t, 0).priceEUR;

  const minutesEUR   = Math.round(priceBaseOnly);                  // e.g. 60m -> €40
  const inGameEUR    = Math.round(priceTotalNoFU - priceBaseOnly); // e.g. +45m -> €30
  const followupsEUR = Math.round(computePriceEUR(t, followups).priceEUR - priceTotalNoFU); // 15€ each

  const total = minutesEUR + inGameEUR + followupsEUR;

  return { minutesEUR, inGameEUR, followupsEUR, total };
}

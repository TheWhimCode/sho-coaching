// engine/checkout/breakdown/buildBreakdown.ts
// Price breakdown for checkout display (base, in-game blocks, followups).

import { computePriceEUR } from "@/engine/session/rules/pricing";
import { MIN_MINUTES, MAX_MINUTES, LIVEBLOCK_MIN } from "@/engine/session/model/session";

const STEP = 15;

export type Breakdown = {
  minutesEUR: number;
  minutesListEUR: number;
  inGameEUR: number;
  inGameListEUR: number;
  followupsEUR: number;
  followupsListEUR: number;
  total: number;
  totalList: number;
  discountPercent: number;
};

function clampStep(n: number): number {
  const s = Math.round(n / STEP) * STEP;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, s));
}

export function buildBreakdown(
  totalMinutes: number,
  followups: number,
  liveBlocks: number
): Breakdown {
  const t = clampStep(totalMinutes || 60);
  const blocks = Math.max(0, Math.min(2, liveBlocks | 0));
  const inGameMin = blocks * LIVEBLOCK_MIN;

  const baseMinutes = clampStep(t - inGameMin);

  const baseOnly = computePriceEUR(baseMinutes, 0);
  const totalNoFU = computePriceEUR(t, 0);
  const withFU = computePriceEUR(t, followups);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const minutesEUR = baseOnly.priceEUR;
  const minutesListEUR = baseOnly.listPriceEUR;
  const inGameEUR = round2(totalNoFU.priceEUR - baseOnly.priceEUR);
  const inGameListEUR = round2(totalNoFU.listPriceEUR - baseOnly.listPriceEUR);
  const followupsEUR = round2(withFU.priceEUR - totalNoFU.priceEUR);
  const followupsListEUR = round2(withFU.listPriceEUR - totalNoFU.listPriceEUR);

  return {
    minutesEUR,
    minutesListEUR,
    inGameEUR,
    inGameListEUR,
    followupsEUR,
    followupsListEUR,
    total: withFU.priceEUR,
    totalList: withFU.listPriceEUR,
    discountPercent: withFU.discountPercent,
  };
}

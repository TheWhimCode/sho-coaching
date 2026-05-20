import {
  products,
  RUSH_BUNDLE_COMPARE_AT_EUR,
} from "../model/product";
import { computeSessionPrice } from "./pricing";
import type { SessionConfig } from "../model/session";

function resolveRushBundlePriceEUR(fallback: number): number {
  const raw = process.env.RUSH_BUNDLE_PRICE_EUR?.trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function applyProductOverrides(c: SessionConfig): SessionConfig {
  const p = c.productId ? products[c.productId] : undefined;

  if (!p) return c;

  if (p.durationOverrideMin !== undefined) {
    return {
      ...c,
      liveMin: p.durationOverrideMin,
      liveBlocks: 0,
      followups: 0,
    };
  }

  return c;
}

export function computePriceWithProduct(c: SessionConfig) {
  const p = c.productId ? products[c.productId] : undefined;

  if (p?.isBundle && p.preset === "rush") {
    const priceEUR = resolveRushBundlePriceEUR(p.priceOverrideEUR ?? 90);
    const listPriceEUR = RUSH_BUNDLE_COMPARE_AT_EUR;
    return {
      priceEUR,
      listPriceEUR,
      amountCents: Math.round(priceEUR * 100),
      listAmountCents: Math.round(listPriceEUR * 100),
      discountPercent: Math.round((1 - priceEUR / listPriceEUR) * 100),
    };
  }

  if (p?.priceOverrideEUR !== undefined) {
    const priceEUR = p.priceOverrideEUR;
    const amountCents = Math.round(priceEUR * 100);
    return {
      priceEUR,
      listPriceEUR: priceEUR,
      amountCents,
      listAmountCents: amountCents,
      discountPercent: 0,
    };
  }

  const normalizedConfig = applyProductOverrides(c);
  const result = computeSessionPrice(normalizedConfig);
  return {
    priceEUR: result.priceEUR,
    listPriceEUR: result.listPriceEUR,
    amountCents: result.amountCents,
    listAmountCents: result.listAmountCents,
    discountPercent: result.discountPercent,
  };
}

import { products } from "../model/product";
import { computeSessionPrice } from "./pricing";
import type { SessionConfig } from "../model/session";

export function applyProductOverrides(c: SessionConfig): SessionConfig {
  const p = c.productId ? products[c.productId] : undefined;

  // no product → no overrides
  if (!p) return c;

  // bundles have full control over time config
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

  if (p?.priceOverrideEUR !== undefined) {
    const amountCents = Math.round(p.priceOverrideEUR * 100);
    return {
      priceEUR: amountCents / 100,
      amountCents,
    };
  }

  // very important: compute on overridden config
  const normalizedConfig = applyProductOverrides(c);
  return computeSessionPrice(normalizedConfig);
}

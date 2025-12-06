import type { SessionConfig } from "../model/session";
import { products, type ProductId } from "../model/product";

export function defineSession(productId: ProductId): SessionConfig {
  const p = products[productId];

  // fallback
  if (!p) {
    return { liveMin: 60, followups: 0, liveBlocks: 0, productId };
  }

  // bundle / rush overrides duration
  if (p.durationOverrideMin !== undefined) {
    return {
      liveMin: p.durationOverrideMin,
      followups: 0,
      liveBlocks: 0,
      productId
    };
  }

  // preset defaults
  switch (p.preset) {
    case "instant":
      return { liveMin: 30, followups: 0, liveBlocks: 0, productId };
    case "signature":
      return { liveMin: 45, followups: 1, liveBlocks: 0, productId };
    case "vod":
      return { liveMin: 60, followups: 0, liveBlocks: 0, productId };
    case "custom":
      return { liveMin: 60, followups: 0, liveBlocks: 0, productId };
    default:
      return { liveMin: 60, followups: 0, liveBlocks: 0, productId };
  }
}

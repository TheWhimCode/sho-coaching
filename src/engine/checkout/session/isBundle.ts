// engine/checkout/session/isBundle.ts
// Bundle / rush product display flag for checkout UI.

import type { ProductId } from "@/engine/session/model/product";

/** Payload slice with optional productId (e.g. step summary props). */
type WithProductId = { productId?: ProductId | null };

/**
 * True when the session is shown as a single bundle line in summary (e.g. rush, bundle_bootcamp).
 * Matches current UI: productId starts with "rush".
 */
export function isBundleDisplay(payload: WithProductId): boolean {
  return !!payload.productId?.startsWith("rush");
}

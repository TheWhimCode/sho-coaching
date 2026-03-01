// engine/checkout/session/sessionFromPayload.ts
// Build a SessionConfig from a Checkout Payload (single place for clamp + mapping).

import type { Payload } from "../model/types";
import type { SessionConfig } from "@/engine/session/model/session";
import type { ProductId } from "@/engine/session/model/product";
import { clamp } from "@/engine/session/config/session";

/** Minimal payload fields needed to build a session (full Payload or step summary props). */
export type SessionPayloadSlice = Pick<
  Payload,
  "baseMinutes" | "liveBlocks" | "followups" | "productId"
>;

/**
 * Convert a checkout payload (or slice with baseMinutes, liveBlocks, followups, productId) into a clamped SessionConfig.
 */
export function sessionFromCheckoutPayload(
  payload: SessionPayloadSlice
): SessionConfig {
  return clamp({
    liveMin: payload.baseMinutes,
    liveBlocks: payload.liveBlocks,
    followups: payload.followups,
    productId: (payload.productId ?? undefined) as ProductId | undefined,
  });
}

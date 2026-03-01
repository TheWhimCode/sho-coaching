// engine/checkout/payload/transform.ts
// Transform payload for backend and derive total live minutes.

import type { Payload, PayloadForBackend } from "../model/types";
import { DEFAULT_PAYLOAD } from "../model/types";
import { LIVEBLOCK_MIN } from "@/engine/session/model/session";

/**
 * Merge payload with defaults (single source for safePayload in flow).
 */
export function mergeWithDefaultPayload(payload: Partial<Payload>): Payload {
  return { ...DEFAULT_PAYLOAD, ...payload };
}

/**
 * Build the subset of payload sent to backend / API (and to useCheckoutFlow as payloadForBackend).
 */
export function toPayloadForBackend(payload: Payload): PayloadForBackend {
  return {
    slotId: payload.slotId,
    slotIds: payload.slotIds,
    sessionType: payload.sessionType,
    liveMinutes: payload.liveMinutes,
    followups: payload.followups,
    liveBlocks: payload.liveBlocks,
    discordId: payload.discordId,
    discordName: payload.discordName,
    preset: payload.preset,
    holdKey: payload.holdKey,
    productId: payload.productId,
    ...(payload.startTime != null ? { startTime: payload.startTime } : {}),
  };
}

/**
 * Total session minutes = baseMinutes + liveBlocks * 45 (single source for booking/create, etc.).
 */
export function totalLiveMinutesFromPayload(payload: Payload): number {
  return payload.baseMinutes + payload.liveBlocks * LIVEBLOCK_MIN;
}

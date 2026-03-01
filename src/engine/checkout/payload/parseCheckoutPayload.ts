// engine/checkout/payload/parseCheckoutPayload.ts
// Parse URL search params (or similar) into a Checkout Payload.

import type { Payload } from "../model/types";
import type { ProductId } from "@/engine/session/model/product";
import {
  MIN_MINUTES,
  MAX_MINUTES,
  LIVEBLOCK_MIN,
} from "@/engine/session/model/session";

/** Input: anything with a get(key) that returns string | null (e.g. URLSearchParams). */
export type SearchParamsLike = { get: (key: string) => string | null };

function clampN(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Derive base (non–live-block) minutes from URL params.
 * Prefers liveMin; falls back to liveMinutes - liveBlocks * 45.
 */
export function deriveBaseMinutes({
  liveMinParam,
  liveMinutesParam,
  liveBlocks,
}: {
  liveMinParam: number | null;
  liveMinutesParam: number | null;
  liveBlocks: number;
}): number {
  if (typeof liveMinParam === "number" && !Number.isNaN(liveMinParam)) {
    return clampN(liveMinParam, MIN_MINUTES, MAX_MINUTES);
  }
  const lm =
    typeof liveMinutesParam === "number" && !Number.isNaN(liveMinutesParam)
      ? liveMinutesParam
      : 60;
  return clampN(lm - liveBlocks * LIVEBLOCK_MIN, MIN_MINUTES, MAX_MINUTES);
}

/**
 * Total session minutes = base + liveBlocks * 45, clamped to [MIN, MAX].
 */
export function mergedMinutes(
  baseMinutes: number,
  liveBlocks: number
): number {
  return Math.min(
    MAX_MINUTES,
    Math.max(MIN_MINUTES, baseMinutes + liveBlocks * LIVEBLOCK_MIN)
  );
}

function getStr(sp: SearchParamsLike, k: string, fallback = ""): string {
  return sp.get(k) ?? fallback;
}

function getNum(sp: SearchParamsLike, k: string, fallback: number): number {
  const v = sp.get(k);
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const DEFAULT_SESSION_TYPE = "Session";
const DEFAULT_PRESET = "custom";

/**
 * Build a Checkout Payload from URL search params (or any get(key)-style source).
 */
export function parseCheckoutPayload(sp: SearchParamsLike): Payload {
  const liveBlocks = getNum(sp, "liveBlocks", 0);
  const liveMinRaw = sp.get("liveMin");
  const liveMinutesRaw = sp.get("liveMinutes");

  const baseMinutes = deriveBaseMinutes({
    liveMinParam: liveMinRaw != null ? Number(liveMinRaw) : null,
    liveMinutesParam: liveMinutesRaw != null ? Number(liveMinutesRaw) : null,
    liveBlocks,
  });

  const totalMins = mergedMinutes(baseMinutes, liveBlocks);

  const productIdRaw = getStr(sp, "productId", "");
  const productId = productIdRaw
    ? (productIdRaw as ProductId)
    : (null as ProductId | null);

  return {
    slotId: getStr(sp, "slotId"),
    slotIds: getStr(sp, "slotIds"),
    sessionType: getStr(sp, "sessionType", DEFAULT_SESSION_TYPE),
    baseMinutes,
    liveMinutes: totalMins,
    followups: getNum(sp, "followups", 0),
    liveBlocks,
    discordId: getStr(sp, "discordId"),
    discordName: getStr(sp, "discordName"),
    productId,
    preset: getStr(sp, "preset", DEFAULT_PRESET),
    holdKey: getStr(sp, "holdKey"),
  };
}

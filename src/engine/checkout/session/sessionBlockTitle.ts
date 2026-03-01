// engine/checkout/session/sessionBlockTitle.ts
// Human-readable session title from checkout payload (preset → label).

import type { SessionPayloadSlice } from "./sessionFromPayload";
import { getPreset } from "@/engine/session/rules/preset";
import { titlesByPreset } from "@/engine/session/metadata/labels";
import type { ProductId } from "@/engine/session/model/product";

/**
 * Resolve preset from payload and return the display title (e.g. "VOD Review", "Signature Session").
 */
export function sessionBlockTitleFromPayload(payload: SessionPayloadSlice): string {
  const preset = getPreset(
    payload.baseMinutes,
    payload.followups,
    payload.liveBlocks,
    (payload.productId ?? undefined) as ProductId | undefined
  );
  return titlesByPreset[preset];
}

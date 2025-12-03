import { products, type ProductId } from "../model/product";

export type Preset =
  | "vod"
  | "instant"
  | "signature"
  | "custom"
  | "rush"
  | "bundle_bootcamp";

/**
 * Preset detection rules:
 * - bundles override preset completely
 * - otherwise infer from minutes/followups
 */
export function getPreset(
  baseMinutes: number,
  followups = 0,
  liveBlocks = 0,
  productId?: ProductId
): Preset {
  const p = productId ? products[productId] : undefined;

  if (p?.isBundle) {
    return p.preset as Preset;
  }

  if (liveBlocks > 0) return "custom";
  if (baseMinutes === 60 && followups === 0) return "vod";
  if (baseMinutes === 30 && followups === 0) return "instant";
  if (baseMinutes === 45 && followups === 1) return "signature";

  return "custom";
}

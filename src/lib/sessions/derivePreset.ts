"use client";

import { getPreset, type Preset } from "./preset";
import type { Cfg } from "@/engine/session/config";

export function derivePreset(cfg: Cfg): Preset {
  if (cfg.productType === "bundle") return "bootcamp";

  return getPreset(cfg.liveMin, cfg.followups, cfg.liveBlocks);
}

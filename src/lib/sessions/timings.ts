import type { Cfg } from "@/engine/session/config";

export const INGAME_MIN = 45;

export function totalLiveMinutes(cfg: Cfg) {
  return cfg.liveMin + cfg.liveBlocks * INGAME_MIN;
}

export function toCalendarQuery(cfg: Cfg) {
  return {
    liveMinutes: totalLiveMinutes(cfg),
    followups: cfg.followups,
    liveBlocks: cfg.liveBlocks,
  };
}

// customizationOptions.ts
import { Cfg, clamp, addLiveBlock, removeLiveBlock } from "@/engine/session/config";

/**
 * Presets
 */
export function applyPresetChanges(
  cfg: Cfg,
  preset: "instant" | "vod" | "signature" | "bootcamp"
): Cfg {

  if (preset === "bootcamp") {
    // bootcamp always resets properly
    return clamp({
      ...cfg,
      liveMin: 60,
      liveBlocks: 0,
      followups: 0,
      productType: "bundle",
    });
  }

  if (preset === "instant") {
    return clamp({ ...cfg, liveMin: 30, liveBlocks: 0, followups: 0 });
  }

  if (preset === "vod") {
    return clamp({ ...cfg, liveMin: 60, liveBlocks: 0, followups: 0 });
  }

  if (preset === "signature") {
    return clamp({ ...cfg, liveMin: 45, liveBlocks: 0, followups: 1 });
  }

  return cfg;
}

/**
 * Duration adjustments (15m)
 */
export function decreaseDuration(cfg: Cfg): Cfg {
  if (cfg.liveMin > 30)
    return clamp({ ...cfg, liveMin: Math.max(30, cfg.liveMin - 15) });

  if (cfg.liveBlocks > 0)
    return clamp({ ...cfg, liveBlocks: cfg.liveBlocks - 1 });

  return cfg;
}

export function increaseDuration(cfg: Cfg): Cfg {
  const total = cfg.liveMin + cfg.liveBlocks * 45;
  if (total >= 120) return cfg;
  return clamp({ ...cfg, liveMin: cfg.liveMin + 15 });
}

/**
 * Live blocks
 */
export function incrementLiveBlock(cfg: Cfg): Cfg {
  return addLiveBlock(cfg);
}

export function decrementLiveBlock(cfg: Cfg): Cfg {
  return removeLiveBlock(cfg);
}

/**
 * Follow-ups
 */
export function incrementFollowups(cfg: Cfg): Cfg {
  return clamp({ ...cfg, followups: Math.min(2, cfg.followups + 1) });
}

export function decrementFollowups(cfg: Cfg): Cfg {
  return clamp({ ...cfg, followups: Math.max(0, cfg.followups - 1) });
}

/**
 * NEW unified adjuster descriptors
 * (UI uses these objects instead of re-instantiating logic)
 */
export const adjusterConfigs = {
  duration: {
    label: "Add/remove time",
    value: (cfg: Cfg) => `${cfg.liveMin} min`,
    inc: increaseDuration,
    dec: decreaseDuration,
    disableInc: (cfg: Cfg) => cfg.liveMin + cfg.liveBlocks * 45 >= 120,
    disableDec: (cfg: Cfg) => cfg.liveMin <= 30 && cfg.liveBlocks === 0,
  },

  liveBlocks: {
    label: "In-game coaching",
    value: (cfg: Cfg) => `${cfg.liveBlocks} × 45 min`,
    inc: incrementLiveBlock,
    dec: decrementLiveBlock,
    disableInc: (cfg: Cfg) =>
      cfg.liveBlocks >= 2 || cfg.liveMin + (cfg.liveBlocks + 1) * 45 > 120,
    disableDec: (cfg: Cfg) => cfg.liveBlocks === 0,
  },

  followups: {
    label: "Follow-up recordings",
    value: (cfg: Cfg) => `${cfg.followups} × 15 min`,
    inc: incrementFollowups,
    dec: decrementFollowups,
    disableInc: (cfg: Cfg) => cfg.followups >= 2,
    disableDec: (cfg: Cfg) => cfg.followups === 0,
  },
} as const;

// engine/session/config/sessionConfig.ts

import type { SessionConfig } from "../model/session";
import {
  MIN_MINUTES,
  MAX_MINUTES,
  LIVEBLOCK_MIN,
  MAX_BLOCKS,
} from "../model/session";

/**
 * Clamp a session into a valid domain state.
 */
export function clamp(c: SessionConfig): SessionConfig {
  let liveMin = Math.max(MIN_MINUTES, Math.min(c.liveMin, MAX_MINUTES));
  let liveBlocks = Math.max(0, Math.min(c.liveBlocks, MAX_BLOCKS));

  while (liveMin + liveBlocks * LIVEBLOCK_MIN > MAX_MINUTES) {
    if (liveBlocks > 0) liveBlocks -= 1;
    else {
      liveMin = MAX_MINUTES;
      break;
    }
  }

  return {
    liveMin,
    liveBlocks,
    followups: Math.max(0, Math.min(c.followups, 2)),
  };
}

export const addLiveBlock = (c: SessionConfig): SessionConfig =>
  clamp({ ...c, liveBlocks: c.liveBlocks + 1 });

export const removeLiveBlock = (c: SessionConfig): SessionConfig =>
  c.liveBlocks === 0 ? c : clamp({ ...c, liveBlocks: c.liveBlocks - 1 });

export function totalMinutes(c: SessionConfig): number {
  return Math.min(MAX_MINUTES, c.liveMin + c.liveBlocks * LIVEBLOCK_MIN);
}

export type Cfg = { liveMin: number; liveBlocks: number; followups: number };
export const MIN = 30, MAX = 120;

export function clamp(c: Cfg): Cfg {
  // ensure base minutes in [MIN, MAX]
  let liveMin = Math.max(MIN, Math.min(c.liveMin, MAX));
  let liveBlocks = Math.max(0, Math.min(c.liveBlocks, 2)); // safety: max 2 ingame

  // enforce total cap (base + blocks <= MAX)
  while (liveMin + liveBlocks * 45 > MAX) {
    if (liveBlocks > 0) {
      liveBlocks -= 1;
    } else {
      liveMin = MAX;
      break;
    }
  }

  return { liveMin, liveBlocks, followups: Math.max(0, Math.min(c.followups, 2)) };
}

export const addLiveBlock = (c: Cfg): Cfg => {
  const next = { ...c, liveBlocks: c.liveBlocks + 1 };
  return clamp(next);
};

export const removeLiveBlock = (c: Cfg): Cfg => {
  if (c.liveBlocks === 0) return c;
  const next = { ...c, liveBlocks: c.liveBlocks - 1 };
  return clamp(next);
};

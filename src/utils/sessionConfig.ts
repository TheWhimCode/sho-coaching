export type Cfg = { liveMin: number; liveBlocks: number; followups: number };
export const MIN = 30, MAX = 120;

export function clamp(c: Cfg): Cfg {
  // ensure base minutes in [MIN, MAX]
  let liveMin = Math.max(MIN, Math.min(c.liveMin, MAX));
  let liveBlocks = Math.max(0, Math.min(c.liveBlocks, 2)); 

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
export const LIVEBLOCK_MIN = 45;
export function totalMinutes(c: Cfg) {
  return Math.min(MAX, c.liveMin + c.liveBlocks * LIVEBLOCK_MIN);
}

// Itemized prices for the sidebar (matches your linear ladder)
const STEP_MIN = 15, STEP_EUR = 10, FOLLOWUP_EUR = 15;

export function pricingBreakdown(c: Cfg) {
  const baseMin = c.liveMin;
  const ingameMin = c.liveBlocks * LIVEBLOCK_MIN;
  const basePrice = 40 + ((baseMin - 60) / STEP_MIN) * STEP_EUR;
  const ingamePrice = (ingameMin / STEP_MIN) * STEP_EUR;
  const followupsPrice = c.followups * FOLLOWUP_EUR;

  return {
    base: { minutes: baseMin, price: Math.round(basePrice) },
    ingame: { minutes: ingameMin, price: Math.round(ingamePrice), blocks: c.liveBlocks },
    followups: { count: c.followups, price: followupsPrice },
    total: { minutes: totalMinutes(c), price: Math.round(basePrice + ingamePrice + followupsPrice) }
  };
}

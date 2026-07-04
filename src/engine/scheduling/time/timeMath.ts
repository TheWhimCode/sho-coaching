export const SLOT_SIZE_MIN = 15;

export function addMin(d: Date, m: number) {
  return new Date(d.getTime() + m * 60_000);
}

export function ceilDiv(a: number, b: number) {
  return Math.floor((a + b - 1) / b);
}

export function utcMidnight(d: Date) {
  const t = new Date(d);
  t.setUTCHours(0, 0, 0, 0);
  return t;
}

/** Contiguous session count from 15-min busy slot starts (PER_DAY_CAP rule). */
export function countContiguousSessions(busyStartTimes: Date[]): number {
  if (busyStartTimes.length === 0) return 0;
  const sorted = [...busyStartTimes].sort((a, b) => a.getTime() - b.getTime());
  let sessions = 0;
  for (let i = 0; i < sorted.length; i++) {
    const prev = i > 0 ? sorted[i - 1] : null;
    const cur = sorted[i];
    const expectedPrev = prev ? addMin(cur, -SLOT_SIZE_MIN).getTime() : NaN;
    if (!prev || prev.getTime() !== expectedPrev) sessions++;
  }
  return sessions;
}

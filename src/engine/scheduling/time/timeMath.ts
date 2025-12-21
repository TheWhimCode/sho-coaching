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

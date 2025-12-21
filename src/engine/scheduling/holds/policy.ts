export const HOLD_TTL_MIN = 10;
export const MAX_TTL_MIN = 15;

export function getHoldUntil(now = new Date()) {
  const ttl = Math.min(HOLD_TTL_MIN, MAX_TTL_MIN);
  return new Date(now.getTime() + ttl * 60_000);
}

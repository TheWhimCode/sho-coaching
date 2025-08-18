const buckets = new Map<string, { tokens: number; ts: number }>();
export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(key) || { tokens: limit, ts: now };
  const refill = Math.floor((now - b.ts) / windowMs) * limit;
  const tokens = Math.min(limit, b.tokens + Math.max(0, refill));
  const ok = tokens > 0;
  buckets.set(key, { tokens: ok ? tokens - 1 : tokens, ts: ok ? now : b.ts });
  return ok;
}

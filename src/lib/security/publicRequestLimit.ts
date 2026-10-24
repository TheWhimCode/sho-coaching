import { RequestLimitError } from "./requestLimitShared";
export { RequestLimitError, visitorBucket } from "./requestLimitShared";

/** No Postgres dependency. Memory limits apply per server instance. */
export function createMemoryRequestLimiter(now = Date.now) {
  const counters = new Map<string, { count: number; expiresAt: number }>();
  return async (key: string, limit: number, windowMs: number): Promise<void> => {
    const time = now();
    let counter = counters.get(key);
    if (!counter || counter.expiresAt <= time) {
      if (counters.size >= 4096) {
        for (const [entryKey, entry] of counters) {
          if (entry.expiresAt <= time) counters.delete(entryKey);
        }
        // Fail closed rather than evicting a live quota under high cardinality.
        if (counters.size >= 4096) throw new RequestLimitError(60);
      }
      counter = { count: 0, expiresAt: time + windowMs };
      counters.set(key, counter);
    }
    if (counter.count >= limit) {
      throw new RequestLimitError(Math.max(1, Math.ceil((counter.expiresAt - time) / 1000)));
    }
    counter.count++;
  };
}

const memoryLimit = createMemoryRequestLimiter();
const COUNTER_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return {count, redis.call('PTTL', KEYS[1])}
`;

/** Optional Redis REST counters share quotas across serverless instances. */
export async function enforcePublicRequestLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url && !token) return memoryLimit(key, limit, windowMs);
  if (!url || !token) throw new Error("Incomplete public rate-limit configuration");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", COUNTER_SCRIPT, "1", `public-limit:${key}`, String(windowMs)]),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Public rate limiter unavailable");
  const body = await response.json() as { result?: [number, number]; error?: string };
  const result = body.result;
  if (body.error || !Array.isArray(result) || result.length !== 2
    || !Number.isInteger(result[0]) || result[0] < 1
    || !Number.isInteger(result[1]) || result[1] < 0) {
    throw new Error("Invalid public rate-limit response");
  }
  if (result[0] > limit) throw new RequestLimitError(Math.max(1, Math.ceil(result[1] / 1000)));
}

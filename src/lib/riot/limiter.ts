import Bottleneck from "bottleneck";

/**
 * Riot limits are per routing value & per method (and there’s also an app-wide limit).
 * We approximate by keying on host+method, e.g.:
 *   americas.api.riotgames.com|GET
 *   euw1.api.riotgames.com|GET
 */
const TWO_MIN = 120_000;

// If you have Redis, set REDIS_URL and uncomment datastore/clientOptions.
// This makes the limiter shared across all serverless instances.
// Without Redis, this is per-process (fine for single server/dev).
export const limiterGroup = new Bottleneck.Group({
  /* datastore: "redis",
  clientOptions: { connectionString: process.env.REDIS_URL! }, */
  // Smooth starts
  minTime: 50,           // ~20 req/s
  maxConcurrent: 3,
  // Don’t let queues grow without bound; reject instead of waiting minutes
  /* @ts-ignore */
  strategy: Bottleneck.strategy.OVERFLOW,
  rejectOnDrop: true,
});

// Per-bucket reservoir ~ dev limits (100 / 2 min).
// (Applied when a bucket is first used.)
limiterGroup.on(
  "created",
  async (limiter: Bottleneck, key: string) => {
    await limiter.updateSettings({
      reservoir: 100,
      reservoirRefreshInterval: TWO_MIN,
      reservoirRefreshAmount: 100,
    });
  }
);

// Optional visibility
limiterGroup.on(
  "depleted",
  (_limiter: Bottleneck, _key: string) => {
    // console.warn(`[limiter] reservoir depleted for ${_key}`);
  }
);

export function bucketKeyFor(url: string, method = "GET") {
  const u = new URL(url);
  return `${u.host}|${(method || "GET").toUpperCase()}`;
}

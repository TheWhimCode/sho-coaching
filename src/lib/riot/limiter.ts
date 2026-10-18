import Bottleneck from "bottleneck";

const TWO_MIN = 120_000;

/**
 * Riot application limits apply per routing region. Keep every endpoint on a
 * host in one bucket, while allowing other regions their own allowance.
 * https://developer.riotgames.com/docs/portal#web-apis_rate-limiting
 */

export const limiterGroup = new Bottleneck.Group({
  /* datastore: "redis",
  clientOptions: { connectionString: process.env.REDIS_URL! }, */
  minTime: 50, // ~20 req/s
  maxConcurrent: 3,
  highWater: 12,
  /* @ts-ignore */ strategy: Bottleneck.strategy.OVERFLOW,
  rejectOnDrop: true,
});

limiterGroup.on("created", async (limiter: Bottleneck) => {
  await limiter.updateSettings({
    reservoir: 100,
    reservoirRefreshInterval: TWO_MIN,
    reservoirRefreshAmount: 100,
  });
});

/** Application quotas span methods and endpoints on the same routing host. */
export function bucketKeyFor(url: string, _method = "GET") {
  return `riot-app:${new URL(url).hostname.toLowerCase()}`;
}

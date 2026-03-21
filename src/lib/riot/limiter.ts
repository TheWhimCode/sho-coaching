import Bottleneck from "bottleneck";

const TWO_MIN = 120_000;

/**
 * Riot development keys are limited per **application** (e.g. 20/s + 100/2min),
 * not per regional host. Use one logical bucket so EUW + NA + … share one budget.
 */
export const RIOT_APP_GLOBAL_BUCKET = "riot-app-key";

export const limiterGroup = new Bottleneck.Group({
  /* datastore: "redis",
  clientOptions: { connectionString: process.env.REDIS_URL! }, */
  minTime: 50, // ~20 req/s
  maxConcurrent: 3,
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

/** Route all Riot HTTP calls through one limiter (host-agnostic). */
export function bucketKeyFor(_url: string, _method = "GET") {
  return RIOT_APP_GLOBAL_BUCKET;
}

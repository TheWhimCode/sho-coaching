import Bottleneck from "bottleneck";

const TWO_MIN = 120_000;

export const limiterGroup = new Bottleneck.Group({
  /* datastore: "redis",
  clientOptions: { connectionString: process.env.REDIS_URL! }, */
  minTime: 50,           // ~20 req/s
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

export function bucketKeyFor(url: string, method = "GET") {
  const u = new URL(url);
  return `${u.host}|${(method || "GET").toUpperCase()}`;
}

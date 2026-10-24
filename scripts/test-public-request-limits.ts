import assert from "node:assert/strict";
import { createMemoryRequestLimiter, enforcePublicRequestLimit, RequestLimitError, visitorBucket } from "../src/lib/security/publicRequestLimit";

async function main() {
  let now = 0;
  const limit = createMemoryRequestLimiter(() => now);
  const outcomes = await Promise.allSettled(Array.from({ length: 20 }, () => limit("visitor", 3, 60_000)));
  assert.equal(outcomes.filter(outcome => outcome.status === "fulfilled").length, 3);
  await assert.rejects(limit("visitor", 3, 60_000), error => error instanceof RequestLimitError && error.retryAfter === 60);
  await limit("other", 1, 1000);
  now = 60_000;
  await limit("visitor", 3, 60_000);
  const bounded = createMemoryRequestLimiter(() => now);
  for (let i = 0; i < 4096; i++) await bounded(String(i), 1, 1000);
  await assert.rejects(bounded("overflow", 1, 1000), RequestLimitError);
  await assert.rejects(bounded("0", 1, 1000), RequestLimitError);
  now += 1000;
  await bounded("overflow", 1, 1000);
  assert.equal(visitorBucket(new Headers({ "x-forwarded-for": "1.2.3.4, 8.8.8.8" })), visitorBucket(new Headers({ "x-forwarded-for": "1.2.3.4" })));

  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  try {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    globalThis.fetch = async () => { throw new Error("Memory mode must not use the network"); };
    await enforcePublicRequestLimit("test:memory", 1, 1000);
    await assert.rejects(enforcePublicRequestLimit("test:memory", 1, 1000), RequestLimitError);
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid";
    await assert.rejects(enforcePublicRequestLimit("test", 1, 1000), /Incomplete/);
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-only-token";
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "https://redis.invalid");
      assert.equal(init?.cache, "no-store");
      const command = JSON.parse(String(init?.body));
      assert.equal(command[0], "EVAL");
      assert.equal(command[3], "public-limit:test");
      assert.equal(command[4], "1000");
      return Response.json({ result: [1, 1000] });
    };
    await enforcePublicRequestLimit("test", 1, 1000);
    globalThis.fetch = async () => Response.json({ result: [2, 900] });
    await assert.rejects(enforcePublicRequestLimit("test", 1, 1000), error => error instanceof RequestLimitError && error.retryAfter === 1);
    globalThis.fetch = async () => new Response("offline", { status: 503 });
    await assert.rejects(enforcePublicRequestLimit("test", 1, 1000), /unavailable/);
    globalThis.fetch = async () => Response.json({ error: "broken" });
    await assert.rejects(enforcePublicRequestLimit("test", 1, 1000), /Invalid/);
    console.log("Public limits: concurrent quotas, expiry, bounded storage, network-free memory mode and Redis fail-closed behavior passed.");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

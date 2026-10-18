import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createRequestLimiter, RequestLimitError, visitorBucket } from "../src/lib/security/requestLimit";
import { SingleFlight } from "../src/lib/security/singleFlight";

async function main() {
  const rollback = new Error("ROLLBACK_TEST_COUNTERS");
  try {
    await prisma.$transaction(async tx => {
      // Two independent instances against the same database counter.
      const first = createRequestLimiter(tx);
      const second = createRequestLimiter(tx);
      const key = `security-test:${crypto.randomUUID()}`;
      const results = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => (i % 2 ? first : second)(key, 3, 60_000)));
      assert.equal(results.filter(r => r.status === "fulfilled").length, 3);
      for (const result of results) if (result.status === "rejected") {
        assert.ok(result.reason instanceof RequestLimitError);
        assert.ok(result.reason.retryAfter > 0);
      }
      const expiring = `${key}:expiry`;
      await tx.$executeRaw`INSERT INTO "public"."RequestLimit" ("key", "count", "expiresAt") VALUES (${expiring}, 100, clock_timestamp() - interval '1 second')`;
      await first(expiring, 1, 60_000);
      await assert.rejects(second(expiring, 1, 60_000), RequestLimitError);
      throw rollback;
    }, { timeout: 15_000 });
  } catch (error) { if (error !== rollback) throw error; }

  assert.equal(visitorBucket(new Headers({ "x-forwarded-for": "not-an-ip" })), visitorBucket(new Headers()));
  assert.equal(visitorBucket(new Headers({ "x-forwarded-for": "192.0.2.1, 10.0.0.1" })), visitorBucket(new Headers({ "x-forwarded-for": "192.0.2.1" })));
  assert.match(visitorBucket(new Headers()), /^[0-9a-f]{4}$/);
  const broken = createRequestLimiter({ $queryRaw: async () => { throw new Error("offline"); } } as never);
  await assert.rejects(broken("offline", 2, 1000), /offline/);

  const flights = new SingleFlight(1);
  let finish!: (value: number) => void;
  let calls = 0;
  const task = () => { calls++; return new Promise<number>(resolve => { finish = resolve; }); };
  const a = flights.run("same", task);
  const b = flights.run("same", task);
  await assert.rejects(flights.run("different", async () => 2), /busy/);
  finish(7);
  assert.deepEqual(await Promise.all([a, b]), [7, 7]);
  assert.equal(calls, 1);
  assert.equal(await flights.run("different", async () => 2), 2);
  console.log("Shared request caps, expiry, failure handling and request deduplication passed; test database writes rolled back.");
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

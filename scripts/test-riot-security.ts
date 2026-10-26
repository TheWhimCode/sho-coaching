import assert from "node:assert/strict";
import { riotFetchJSON, RiotRequestLimitError } from "../src/lib/riot/fetch";
import { bucketKeyFor, limiterGroup } from "../src/lib/riot/limiter";
import { RequestLimitError } from "../src/lib/security/requestLimitShared";

async function main() {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.RIOT_API_KEY;
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let calls = 0;
  const budgets: string[] = [];
  try {
    process.env.RIOT_API_KEY = "test-only-key";
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-only-token";
    let blockEuw = false;
    let upstreamLimited = false;
    globalThis.fetch = async (_url, init) => {
      if (String(_url) === "https://redis.invalid") {
        const command = JSON.parse(String(init?.body));
        const key = String(command[3]).replace(/^public-limit:/, "");
        budgets.push(key);
        return Response.json({ result: [blockEuw && key.includes("euw1") ? 91 : 1, 45_000] });
      }
      calls++;
      assert.equal(init?.redirect, "error");
      assert.equal((init?.headers as Record<string, string>)["X-Riot-Token"], "test-only-key");
      if (upstreamLimited) return new Response("limited", { status: 429, headers: { "Retry-After": "75" } });
      return Response.json({ ok: true });
    };
    for (const url of ["https://attacker.invalid/", "http://euw1.api.riotgames.com/", "https://euw1.api.riotgames.com@attacker.invalid/", "https://euw1.api.riotgames.com:444/"]) {
      await assert.rejects(riotFetchJSON(url), /Unsupported Riot API host/);
    }
    assert.equal(calls, 0);
    assert.equal(budgets.length, 0);
    assert.deepEqual(await riotFetchJSON("https://euw1.api.riotgames.com/lol/test"), { ok: true });
    assert.deepEqual(budgets, ["riot-outbound:riot-app:euw1.api.riotgames.com:two-minutes", "riot-outbound:riot-app:euw1.api.riotgames.com:second"]);
    assert.equal(bucketKeyFor("https://euw1.api.riotgames.com/lol/test"), bucketKeyFor("https://euw1.api.riotgames.com/lol/other", "POST"));
    assert.notEqual(bucketKeyFor("https://euw1.api.riotgames.com/lol/test"), bucketKeyFor("https://na1.api.riotgames.com/lol/test"));
    assert.deepEqual(await riotFetchJSON("https://na1.api.riotgames.com/lol/test"), { ok: true });
    assert.deepEqual(budgets.slice(-2), ["riot-outbound:riot-app:na1.api.riotgames.com:two-minutes", "riot-outbound:riot-app:na1.api.riotgames.com:second"]);
    upstreamLimited = true;
    await assert.rejects(riotFetchJSON("https://euw1.api.riotgames.com/lol/test"), error => error instanceof RiotRequestLimitError && error.source === "upstream" && error.retryAfter === 75 && /75 seconds/.test(error.message));
    assert.equal(calls, 3, "Upstream throttling must not trigger recursive retries");
    blockEuw = true;
    await assert.rejects(riotFetchJSON("https://euw1.api.riotgames.com/lol/test"), error => error instanceof RequestLimitError && error instanceof RiotRequestLimitError && error.source === "safety_cap" && error.retryAfter === 45);
    assert.equal(calls, 3, "Exhausted shared budgets must block outbound calls");
    upstreamLimited = false;
    assert.deepEqual(await riotFetchJSON("https://na1.api.riotgames.com/lol/test"), { ok: true });
    assert.equal(calls, 4, "An exhausted EUW budget must not block NA");
    console.log("Riot host restrictions, shared Redis budgets, redirect blocking and 429 handling passed with mocked network and no database.");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.RIOT_API_KEY; else process.env.RIOT_API_KEY = originalKey;
    if (originalRedisUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;
    if (originalRedisToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
    await limiterGroup.disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

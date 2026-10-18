import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { riotFetchJSON } from "../src/lib/riot/fetch";
import { limiterGroup } from "../src/lib/riot/limiter";
import { RequestLimitError } from "../src/lib/security/requestLimit";

async function main() {
  const originalFetch = globalThis.fetch;
  const originalQuery = prisma.$queryRaw;
  const originalKey = process.env.RIOT_API_KEY;
  let calls = 0;
  const budgets: string[] = [];
  try {
    process.env.RIOT_API_KEY = "test-only-key";
    prisma.$queryRaw = (async (_sql: unknown, ...values: unknown[]) => {
      budgets.push(String(values[0]));
      return [{ count: 1, retryAfter: 60 }];
    }) as typeof prisma.$queryRaw;
    globalThis.fetch = async (_url, init) => {
      calls++;
      assert.equal(init?.redirect, "error");
      assert.equal((init?.headers as Record<string, string>)["X-Riot-Token"], "test-only-key");
      return Response.json({ ok: true });
    };
    for (const url of ["https://attacker.invalid/", "http://euw1.api.riotgames.com/", "https://euw1.api.riotgames.com@attacker.invalid/", "https://euw1.api.riotgames.com:444/"]) {
      await assert.rejects(riotFetchJSON(url), /Unsupported Riot API host/);
    }
    assert.equal(calls, 0);
    assert.equal(budgets.length, 0);
    assert.deepEqual(await riotFetchJSON("https://euw1.api.riotgames.com/lol/test"), { ok: true });
    assert.deepEqual(budgets, ["riot-outbound:two-minutes", "riot-outbound:second"]);
    globalThis.fetch = async () => { calls++; return new Response("limited", { status: 429, headers: { "Retry-After": "75" } }); };
    await assert.rejects(riotFetchJSON("https://euw1.api.riotgames.com/lol/test"), error => error instanceof RequestLimitError && error.retryAfter === 75);
    assert.equal(calls, 2, "Upstream throttling must not trigger recursive retries");
    console.log("Riot host restrictions, shared-budget checks, redirect blocking and 429 handling passed with mocked network/database.");
  } finally {
    globalThis.fetch = originalFetch;
    prisma.$queryRaw = originalQuery;
    if (originalKey === undefined) delete process.env.RIOT_API_KEY; else process.env.RIOT_API_KEY = originalKey;
    await limiterGroup.disconnect();
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { findPlatformForPuuid, normalizePlatform, platformDiscoveryOrder, resolveAccountByRiotTag } from "../src/lib/riot/core";
import { activeGameByPuuid } from "../src/lib/riot/spectator";
import { matchByIdAcrossRegions, parseMatchId } from "../src/lib/riot/match";
import { limiterGroup } from "../src/lib/riot/limiter";
import { BUILD_PICKER_PLATFORMS } from "../src/lib/guides/buildPicker/types";

async function main() {
  const originalFetch = globalThis.fetch;
  const originalQuery = prisma.$queryRaw;
  const originalKey = process.env.RIOT_API_KEY;
  const requests: URL[] = [];
  try {
    process.env.RIOT_API_KEY = "test-only-key";
    prisma.$queryRaw = (async () => [{ count: 1, retryAfter: 60 }]) as typeof prisma.$queryRaw;
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      requests.push(url);
      assert.ok(!/^(ph2|th2)\./.test(url.hostname), "Never contact retired platforms");
      if (url.pathname.startsWith("/riot/account/")) {
        assert.notEqual(url.hostname, "sea.api.riotgames.com", "SEA does not serve Account-v1");
        return Response.json({ puuid: "test-puuid", gameName: "Test", tagLine: "VN2" });
      }
      if (url.pathname.startsWith("/lol/summoner/")) {
        return url.hostname === "vn2.api.riotgames.com" || url.hostname === "me1.api.riotgames.com"
          ? Response.json({ puuid: "test-puuid" }) : new Response("not found", { status: 404 });
      }
      if (url.pathname.startsWith("/lol/spectator/")) {
        assert.equal(url.hostname, "vn2.api.riotgames.com");
        return Response.json({ platformId: "VN2", gameId: 123 });
      }
      assert.ok(url.pathname.startsWith("/lol/match/"));
      return url.hostname === "sea.api.riotgames.com"
        ? Response.json({ metadata: { matchId: "VN2_123" } }) : new Response("not found", { status: 404 });
    };

    assert.deepEqual(normalizePlatform("ph2"), { platform: "sg2", region: "sea" });
    assert.deepEqual(normalizePlatform("th"), { platform: "sg2", region: "sea" });
    assert.equal(normalizePlatform("oc1").region, "sea");
    assert.equal(normalizePlatform("me1").region, "europe");
    assert.ok(BUILD_PICKER_PLATFORMS.some(p => p.id === "me1"));
    assert.ok(!platformDiscoveryOrder().some(p => p === "ph2" || p === "th2"));

    const account = await resolveAccountByRiotTag("Test#VN2", { preferredRegion: "sea" });
    assert.equal(requests[0].hostname, "asia.api.riotgames.com");
    const platform = await findPlatformForPuuid(account.puuid, account.regional, "vn2");
    assert.equal(platform, "vn2");
    assert.equal((await activeGameByPuuid(platform!, account.puuid)).platformId, "VN2");
    // Auto discovery must get past the old PH/TH positions and reach Vietnam.
    assert.equal(await findPlatformForPuuid(account.puuid, account.regional), "vn2");
    assert.equal(await findPlatformForPuuid(account.puuid, "europe", "me1"), "me1");
    assert.equal(parseMatchId("OC1_123")?.region, "sea");
    assert.equal(parseMatchId("ME1_123")?.region, "europe");
    assert.equal((await matchByIdAcrossRegions("VN2_123")).metadata.matchId, "VN2_123");
    assert.equal(requests.at(-1)?.hostname, "sea.api.riotgames.com");

    // Authorization failures on supported account routers still stop immediately.
    const before = requests.length;
    globalThis.fetch = async (input) => {
      requests.push(new URL(String(input)));
      return new Response("Forbidden", { status: 403 });
    };
    await assert.rejects(resolveAccountByRiotTag("Test#VN2", { preferredRegion: "sea" }), /Riot API 403/);
    assert.equal(requests.length, before + 1);
    console.log("Vietnam live/auto routing, merged platforms, ME support, SEA match fallback and authorization handling passed (mocked network/database).");
  } finally {
    globalThis.fetch = originalFetch;
    prisma.$queryRaw = originalQuery;
    if (originalKey === undefined) delete process.env.RIOT_API_KEY; else process.env.RIOT_API_KEY = originalKey;
    await limiterGroup.disconnect();
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

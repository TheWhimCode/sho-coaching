// src/app/api/riot/seasonstats/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  normalizePlatform,
  regionalForServer,
  recentSoloMatchIds,
  matchById,
} from "@/lib/riot/core";

export const dynamic = "force-dynamic";
const REMAKE_SEC = 180;
const DEFAULT_LIMIT = 500;
const LIMIT_MAX = 1000;

async function fetchValidSummonerData(server: string, summonerName: string, riotTag: string): Promise<{ puuid: string }> {
  // Use Summoner V4 or Account V1 to get the PUUID
  const platform = normalizePlatform(server).platform;
  const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}?api_key=${process.env.RIOT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Summoner-v4 error: ${res.status}`);
  }
  const data = await res.json();
  if (!data.puuid) {
    throw new Error("No puuid in summoner-v4 response");
  }
  return { puuid: data.puuid };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const server = (searchParams.get("server") || "euw1").trim();
    let puuid = (searchParams.get("puuid") || "").trim();
    const summonerName = searchParams.get("name") || "";
    const riotTag = searchParams.get("tag") || "";

    const limit = Math.max(1, Math.min(LIMIT_MAX, Number(searchParams.get("limit") || DEFAULT_LIMIT)));

    if (!puuid) {
      if (!summonerName) {
        return NextResponse.json({ error: "puuid or summonerName required" }, { status: 400 });
      }
      // resolve via summoner-v4
      const resolved = await fetchValidSummonerData(server, summonerName, riotTag);
      puuid = resolved.puuid;
    }

    // validate
    const platform = normalizePlatform(server).platform;
    const regional = regionalForServer(server);

    const ids = await recentSoloMatchIds(regional, puuid, limit);
    const details = await Promise.all(ids.map(id => matchById(regional, id)));
    const solo = (details.filter(Boolean) as any[])
      .filter(m => m?.info?.queueId === 420 && Number(m.info.gameDuration) >= REMAKE_SEC)
      .slice(0, limit);

    const parts = solo
      .map(m => (m.info.participants || []).find((p: any) => p.puuid === puuid))
      .filter(Boolean);

    const by: Record<number, { name: string; g: number; w: number; k: number; d: number; a: number; cs: number }> = {};
    for (const p of parts) {
      const id = p.championId;
      by[id] ??= { name: p.championName || "—", g:0, w:0, k:0, d:0, a:0, cs:0 };
      const s = by[id];
      s.g++;
      if (p.win) s.w++;
      s.k += p.kills;
      s.d += p.deaths;
      s.a += p.assists;
      s.cs += (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
    }

    const round = (n: number, d = 2) => Math.round(n * 10**d) / 10**d;
    const aggregates = Object.entries(by).map(([cid, s]) => ({
      championId: Number(cid),
      championName: s.name,
      games: s.g,
      winrate: round(100 * s.w / Math.max(1, s.g), 1),
      kda: round((s.k + s.a) / Math.max(1, s.d), 2),
      k: round(s.k / s.g, 1),
      d: round(s.d / s.g, 1),
      a: round(s.a / s.g, 1),
      cs: round(s.cs / s.g, 1),
    })).sort((a, b) => b.games - a.games);

    return NextResponse.json({
      puuid,
      server: platform,
      queue: 420,
      count: solo.length,
      aggregates,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "seasonstats failed", detail: e.message }, { status: 502 });
  }
}

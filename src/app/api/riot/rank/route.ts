import { NextRequest, NextResponse } from "next/server";
import {
  normalizePlatform,
  regionalForServer,
  leagueEntriesByPuuid,
  leagueEntriesBySummoner,
  recentSoloMatchIds,
  matchById,
} from "@/lib/riot/core";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const server = (searchParams.get("server") || "euw1").trim();
    const puuid = (searchParams.get("puuid") || "").trim();
    let summonerId = (searchParams.get("summonerId") || "").trim();

    if (!puuid && !summonerId) {
      return NextResponse.json(
        { error: "puuid or summonerId required" },
        { status: 400 }
      );
    }

    const { platform } = normalizePlatform(server);
    const regional = regionalForServer(server);

    // 1) Try by-PUUID first
    if (puuid) {
      try {
        const entries = await leagueEntriesByPuuid(platform, puuid);
        const solo = entries.find(
          (e: any) => e.queueType === "RANKED_SOLO_5x5"
        );
        if (solo) {
          return NextResponse.json({
            platform,
            via: "by-puuid",
            solo: {
              tier: solo.tier,
              division: solo.rank,
              lp: solo.leaguePoints,
              wins: solo.wins,
              losses: solo.losses,
            },
          });
        }
      } catch {
        // fall through to summonerId path
      }
    }

    // 2) Derive summonerId if missing
    if (!summonerId && puuid) {
      const id = (await recentSoloMatchIds(regional, puuid, 1))[0];
      if (!id) {
        return NextResponse.json(
          { error: "no recent matches to derive summonerId" },
          { status: 502 }
        );
      }
      const m = await matchById(regional, id);
      const me = (m?.info?.participants || []).find(
        (p: any) => p.puuid === puuid
      );
      summonerId = me?.summonerId || "";
      if (!summonerId) {
        return NextResponse.json(
          { error: "could not extract summonerId from match" },
          { status: 502 }
        );
      }
    }

    // 3) Classic by-summonerId
    const entries = await leagueEntriesBySummoner(platform, summonerId);
    const solo = entries.find(
      (e: any) => e.queueType === "RANKED_SOLO_5x5"
    );

    return NextResponse.json({
      platform,
      via: "by-summonerId",
      solo: solo
        ? {
            tier: solo.tier,
            division: solo.rank,
            lp: solo.leaguePoints,
            wins: solo.wins,
            losses: solo.losses,
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "rank failed", detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}

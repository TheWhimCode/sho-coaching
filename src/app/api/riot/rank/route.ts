import { NextRequest, NextResponse } from "next/server";
import {
  normalizePlatform,
  leagueEntriesByPuuid,
} from "@/lib/riot/core";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const server = (searchParams.get("server") || "euw1").trim();
    const puuid = (searchParams.get("puuid") || "").trim();

    if (!puuid) {
      return NextResponse.json({ error: "puuid required" }, { status: 400 });
    }

    const { platform } = normalizePlatform(server);

    const entries = await leagueEntriesByPuuid(platform, puuid);
    const solo = Array.isArray(entries)
      ? entries.find((e: any) => e.queueType === "RANKED_SOLO_5x5")
      : null;

    return NextResponse.json({
      platform,
      via: "by-puuid",
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

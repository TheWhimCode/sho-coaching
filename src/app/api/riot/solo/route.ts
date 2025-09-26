import { NextRequest, NextResponse } from "next/server";
import { normalizePlatform, regionalForServer, recentSoloMatchIds, matchById } from "@/lib/riot/core";

export const dynamic = "force-dynamic";

const REMAKE_SEC = 180;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const server = (searchParams.get("server") || "euw1").trim();
    const puuid  = (searchParams.get("puuid")  || "").trim();
    const count  = Math.max(1, Math.min(20, Number(searchParams.get("count")||10)));
    if (!puuid) return NextResponse.json({ error:"puuid required" }, { status:400 });

    normalizePlatform(server); // validate
    const regional = regionalForServer(server);

    const ids = await recentSoloMatchIds(regional, puuid, Math.max(count, 10));
    const details = await Promise.all(ids.map(id => matchById(regional, id)));
    const solo = (details.filter(Boolean) as any[])
      .filter(m => m?.info?.queueId === 420 && Number(m.info?.gameDuration) >= REMAKE_SEC)
      .slice(0, count);

    // simple aggregates
    const parts = solo.map(m => (m.info.participants || []).find((p:any)=>p.puuid===puuid)).filter(Boolean);
    const by: Record<number, {name:string; g:number; w:number; k:number; d:number; a:number; cs:number;}> = {};
    for (const p of parts) {
      const id = p.championId;
      by[id] ??= { name: p.championName ?? "—", g:0, w:0, k:0, d:0, a:0, cs:0 };
      const s = by[id]; s.g++; if (p.win) s.w++; s.k+=p.kills; s.d+=p.deaths; s.a+=p.assists; s.cs += (p.totalMinionsKilled||0)+(p.neutralMinionsKilled||0);
    }
    const round = (n:number,d=2)=>Math.round(n*10**d)/10**d;
    const aggregates = Object.entries(by).map(([cid,s])=>({
      championId: Number(cid), championName: s.name, games: s.g,
      winrate: round(100*s.w/Math.max(1,s.g),1),
      kda: round((s.k+s.a)/Math.max(1,s.d),2),
      k: round(s.k/s.g,1), d: round(s.d/s.g,1), a: round(s.a/s.g,1), cs: round(s.cs/s.g,1),
    })).sort((a,b)=>b.games-a.games);

    return NextResponse.json({ puuid, server: normalizePlatform(server).platform, queue:420, matches: solo, aggregates });
  } catch (e:any) {
    return NextResponse.json({ error:"solo failed", detail:String(e?.message||e) }, { status:502 });
  }
}

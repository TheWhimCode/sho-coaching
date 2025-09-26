import { NextRequest, NextResponse } from "next/server";
import { normalizePlatform, resolveAccount, regionalForServer } from "@/lib/riot/core";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const riotTag = String(body.riotTag || "");
    const server  = String(body.server  || "euw1");
    if (!riotTag) return NextResponse.json({ error:"riotTag required" }, { status:400 });

    const { platform } = normalizePlatform(server);
    const regional = regionalForServer(server);
    const acct = await resolveAccount(regional, riotTag);

    return NextResponse.json({
      puuid: acct.puuid,
      server: platform,
      riotName: acct.gameName,
      riotTag
    });
  } catch (e:any) {
    return NextResponse.json({ error:"resolve failed", detail:String(e?.message||e) }, { status:502 });
  }
}

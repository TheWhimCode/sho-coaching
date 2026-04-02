// src/app/api/riot/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ACCOUNT_ROUTING_REGIONS, resolveAccountByRiotTag, type Regional } from "@/lib/riot/core";

export const dynamic = "force-dynamic";

function toRegional(v: unknown): Regional | null {
  const s = String(v ?? "").toLowerCase().trim();
  return (ACCOUNT_ROUTING_REGIONS as readonly string[]).includes(s) ? (s as Regional) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const riotTag = String(body.riotTag || "").trim();
    if (!riotTag) return NextResponse.json({ error: "riotTag required" }, { status: 400 });

    const override = toRegional(body.region);

    try {
      const acct = await resolveAccountByRiotTag(riotTag, override ? { region: override } : undefined);
      return NextResponse.json({
        puuid: acct.puuid,
        region: acct.regional,
        riotName: acct.gameName,
        riotTag,
      });
    } catch {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "resolve_failed", detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}

// src/app/api/riot/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resolveAccount, type Regional } from "@/lib/riot/core";

export const dynamic = "force-dynamic";

// Riot Account API routers (typed)
const REGIONS: readonly Regional[] = ["europe", "americas", "asia"] as const;

function toRegional(v: unknown): Regional | null {
  const s = String(v ?? "").toLowerCase().trim();
  return (REGIONS as readonly string[]).includes(s) ? (s as Regional) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const riotTag = String(body.riotTag || "").trim();
    if (!riotTag) return NextResponse.json({ error: "riotTag required" }, { status: 400 });

    // Optional override if you want to force a router
    const override = toRegional(body.region);

    const regionsToTry: readonly Regional[] = override ? [override] : REGIONS;

    let lastErr: unknown = null;

    for (const regional of regionsToTry) {
      try {
        const acct = await resolveAccount(regional, riotTag); // regional is Regional
        return NextResponse.json({
          puuid: acct.puuid,
          region: regional,
          riotName: acct.gameName,
          riotTag,
        });
      } catch (e) {
        // Wrong router → try next
        lastErr = e;
        continue;
      }
    }

    return NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "resolve_failed", detail: String(e?.message || e) },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ensureRuneDailyForDay } from "@/lib/skillcheck/ensureRuneDaily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function ymdUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * One-off: run rune daily sampling for today so the runes game has data.
 * Auth: same as skillcheck cron (CRON_SECRET or x-vercel-cron).
 */
export async function GET(req: NextRequest) {
  const fromVercel = !!req.headers.get("x-vercel-cron") || !!req.headers.get("x-vercel-signature");
  const secret = (process.env.CRON_SECRET || "").trim();
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!fromVercel && (!secret || token !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dayKey = ymdUTC(new Date());
  const result = await ensureRuneDailyForDay(dayKey);

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  return GET(req);
}

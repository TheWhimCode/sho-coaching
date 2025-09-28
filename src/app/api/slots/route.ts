// src/app/api/slots/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guards, canStartAtTime } from "@/lib/booking/block";
import { SlotStatus } from "@prisma/client";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 60;
const MIN_MINUTES = 30;
const MAX_MINUTES = 240;

export async function GET(req: Request) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  // per-IP rate limit (30/min)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`slots:${ip}`, 300, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from")?.trim();
  const toStr = searchParams.get("to")?.trim();
  const liveRaw = searchParams.get("liveMinutes") ?? "60";

  if (!fromStr || !toStr) {
    return NextResponse.json({ error: "from/to required" }, { status: 400 });
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (!isFinite(from.getTime()) || !isFinite(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  // cap request range
  const ms = to.getTime() - from.getTime();
  const days = ms / (24 * 60 * 60 * 1000);
  if (days > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: "range_too_large" }, { status: 400 });
  }

  // validate/normalize liveMinutes (15-min grid)
  let liveMinutes = parseInt(liveRaw, 10);
  if (!Number.isFinite(liveMinutes)) liveMinutes = 60;
  if (liveMinutes < MIN_MINUTES || liveMinutes > MAX_MINUTES) {
    return NextResponse.json({ error: "invalid_liveMinutes" }, { status: 400 });
  }
  if (liveMinutes % 15 !== 0) liveMinutes = Math.round(liveMinutes / 15) * 15;

  // Server policy: lead + max advance (no business-hours gate here)
  const { minStart, maxStart } = guards(new Date());
  const gte = from < minStart ? minStart : from;
  const lt = to > maxStart ? maxStart : to;
  if (gte >= lt) return NextResponse.json([]);

  const now = new Date();

  // Only FREE slots; hide active holds
  const rows = await prisma.slot.findMany({
    where: {
      status: SlotStatus.free,
      startTime: { gte, lt },
      OR: [{ holdUntil: null }, { holdUntil: { lt: now } }],
    },
    select: { id: true, startTime: true, status: true },
    orderBy: { startTime: "asc" },
  });

  // Safety cap to avoid hammering DB with validations
  if (rows.length > 2000) {
    return NextResponse.json({ error: "too_many_results" }, { status: 400 });
  }

  // Final server-side validation:
  // - contiguous chain w/ buffers
  // - lead/max-advance (again)
  // - PER_DAY_CAP (inside canStartAtTime/getBlockIdsByTime)
  const checked = await Promise.all(
    rows.map(async (r) =>
      (await canStartAtTime(r.startTime, liveMinutes, prisma)) ? r : null
    )
  );

  const valid = checked.filter((x): x is typeof rows[number] => Boolean(x));
  const res = NextResponse.json(
    valid.map((r) => ({
      id: r.id,
      startTime: r.startTime.toISOString(),
      status: r.status, // still 'free'
    }))
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}

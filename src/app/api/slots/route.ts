// src/app/api/slots/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";

import { getAvailableSlots } from "@/engine/scheduling/slots/getAvailableSlots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- helpers ---------- */

function noStore(json: unknown, status = 200) {
  const res = NextResponse.json(json, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function getIP(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/* ---------- GET ---------- */

export async function GET(req: Request) {
  const ip = getIP(req);
  if (!rateLimit(`slots:${ip}`, 300, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  const { searchParams } = new URL(req.url);

  const from = new Date(searchParams.get("from") ?? "");
  const to = new Date(searchParams.get("to") ?? "");
  const liveMinutes = Number(searchParams.get("liveMinutes") ?? 60);

  if (!isFinite(from.getTime()) || !isFinite(to.getTime()) || to <= from) {
    return noStore({ error: "invalid_range" }, 400);
  }

  const result = await getAvailableSlots({
    from,
    to,
    liveMinutes,
  });

  return noStore(
    result.map(s => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      status: "free",
    }))
  );
}

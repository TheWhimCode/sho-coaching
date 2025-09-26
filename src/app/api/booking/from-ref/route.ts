// src/app/api/booking/from-ref/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidRef(ref: string) {
  if (ref.length > 128) return false;
  return (
    /^pi_[a-zA-Z0-9_]+$/.test(ref) ||
    /^cs_[a-zA-Z0-9_]+$/.test(ref) ||
    /^[A-Z0-9\-]{8,}$/.test(ref)
  );
}

export async function GET(req: Request) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`from-ref:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const ref = url.searchParams.get("ref")?.trim();
  if (!ref || !isValidRef(ref)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const s = await prisma.session.findFirst({
    where: { OR: [{ paymentRef: ref }, { stripeSessionId: ref }] },
    select: {
      id: true,
      sessionType: true,
      liveMinutes: true,
      followups: true,
      discord: true,
      currency: true,
      amountCents: true,
      scheduledStart: true,
      slot: { select: { startTime: true } },
    },
  });

  const start = s?.scheduledStart ?? s?.slot?.startTime ?? null;
  if (!s || !start) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const res = NextResponse.json({
    id: s.id,
    sessionType: s.sessionType,
    liveMinutes: s.liveMinutes,
    followups: s.followups,
    discord: s.discord ?? "",
    currency: (s.currency || "eur").toLowerCase(),
    amountCents: s.amountCents ?? null,
    startISO: start.toISOString(),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

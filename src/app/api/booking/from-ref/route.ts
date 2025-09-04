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

  // derive a simple key (by IP if available, else fallback)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const key = `from-ref:${ip}`;

  if (!rateLimit(key, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const ref = url.searchParams.get("ref")?.trim();
  if (!ref || !isValidRef(ref)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ paymentRef: ref }, { stripeSessionId: ref }],
    },
    include: { slot: true },
  });

  if (!booking?.slot) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const res = NextResponse.json({
    id: booking.id,
    sessionType: booking.sessionType,
    liveMinutes: booking.liveMinutes,
    followups: booking.followups,
    discord: booking.discord ?? "",
    currency: (booking.currency || "eur").toLowerCase(),
    amountCents: booking.amountCents ?? null,
    startISO: booking.slot.startTime.toISOString(),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

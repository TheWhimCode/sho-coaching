// src/app/api/booking/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!rateLimit(`booking:create:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  const parsed = CheckoutZ.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { slotId, liveMinutes, followups } = parsed.data;

  const holdKey: string | null = body.holdKey ?? null;
  if (!holdKey) {
    return NextResponse.json({ error: "missing_hold" }, { status: 400 });
  }

  const sessionType = (body.sessionType ?? "").trim();
  const riotTag = (body.riotTag ?? "").trim();
  const discordId: string | null = body.discordId ?? null;
  const discordName: string | null = body.discordName ?? null;
  const notes = (body.notes ?? "").trim() || null;
  const studentId: string | null = body.studentId ?? null;

  // coupon support
  const couponCode: string | null = body.couponCode ?? null;
  const couponDiscount: number = body.couponDiscount ?? 0;

  const waiverAccepted = body.waiverAccepted === true || body.waiver === true;
  const waiverIp = waiverAccepted ? ip : null;
  const waiverAcceptedAt = waiverAccepted ? new Date() : null;

  if (!sessionType || !riotTag) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // 🔒 ENGINE SOURCE OF TRUTH: verify active hold
  const heldSlots = await prisma.slot.findMany({
    where: {
      holdKey,
      holdUntil: { gt: new Date() },
    },
    orderBy: { startTime: "asc" },
  });

  if (!heldSlots.length) {
    return NextResponse.json({ error: "hold_expired" }, { status: 409 });
  }

  // canonical start = first held slot
  const scheduledStart = heldSlots[0].startTime;

  const { amountCents } = computePriceEUR(liveMinutes, followups);

  const existing = await prisma.session.findFirst({
    where: { slotId, status: "unpaid" },
    select: { id: true },
  });

  try {
    // UPDATE existing
    if (existing) {
      const b = await prisma.session.update({
        where: { id: existing.id },
        data: {
          sessionType,
          liveMinutes,
          followups,
          riotTag,
          discordId,
          discordName,
          notes,
          studentId,
          couponCode,
          couponDiscount,
          scheduledStart,
          scheduledMinutes: liveMinutes,
          currency: "eur",
          amountCents,
          waiverAccepted,
          waiverIp,
          waiverAcceptedAt,
        },
        select: { id: true },
      });

      const res = NextResponse.json({ bookingId: b.id });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // CREATE new
    const b = await prisma.session.create({
      data: {
        sessionType,
        slotId,
        liveMinutes,
        followups,
        riotTag,
        discordId,
        discordName,
        notes,
        studentId,
        couponCode,
        couponDiscount,
        scheduledStart,
        scheduledMinutes: liveMinutes,
        currency: "eur",
        amountCents,
        waiverAccepted,
        waiverIp,
        waiverAcceptedAt,
        status: "unpaid",
      },
      select: { id: true },
    });

    const res = NextResponse.json({ bookingId: b.id });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    if (e?.code === "P2002") {
      const again = await prisma.session.findFirst({
        where: { slotId, status: "unpaid" },
        select: { id: true },
      });
      if (again) {
        const res = NextResponse.json({ bookingId: again.id });
        res.headers.set("Cache-Control", "no-store");
        return res;
      }
    }

    console.error("BOOKING_CREATE_ERROR", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// src/app/api/booking/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`booking:create:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  // validate shape you already use elsewhere
  const parsed = CheckoutZ.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const {
    slotId,
    liveMinutes,
    followups,
    // liveBlocks,  // optional in model; defaults to 0
  } = parsed.data;

  const sessionType = (body.sessionType ?? "").trim();
  const discord = (body.discord ?? "").trim();        // model requires String (not null)
  const notes = (body.notes ?? "").trim() || null;     // optional
  const waiverAccepted = body.waiverAccepted === true || body.waiver === true;
  const waiverIp = waiverAccepted ? ip : null;
  const waiverAcceptedAt = waiverAccepted ? new Date() : null;
  const customerEmail = (body.email ?? "").trim() || null;

  // required fields guard
  if (!sessionType || !discord) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // fetch slot to get scheduledStart and ensure it’s not taken
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.status === SlotStatus.taken) {
    return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
  }

  // compute and persist price snapshot (optional in model)
  const { amountCents } = computePriceEUR(liveMinutes, followups);

  // create pending booking (Stripe will finalize later)
  const booking = await prisma.booking.create({
    data: {
      sessionType,
      slotId,                         // unique in Booking
      liveMinutes,
      followups,
      discord,
      notes,
      // Snapshot schedule
      scheduledStart: slot.startTime,
      scheduledMinutes: liveMinutes,
      // Payment snapshot
      currency: "eur",
      amountCents,
      customerEmail,
      // Waiver
      waiverAccepted,
      waiverIp,
      waiverAcceptedAt,
      // Leave: status (defaults to "unpaid"), liveBlocks (default 0)
    },
    select: { id: true },
  });

  const res = NextResponse.json({ bookingId: booking.id });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

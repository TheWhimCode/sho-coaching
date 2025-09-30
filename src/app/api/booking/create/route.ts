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

  // Validate core checkout fields (slotId, liveMinutes, followups, etc.)
  const parsed = CheckoutZ.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { slotId, liveMinutes, followups } = parsed.data;

  // New/updated fields
  const sessionType = (body.sessionType ?? "").trim();
  const riotTag = (body.riotTag ?? "").trim();              // REQUIRED now
  const discordId: string | null = body.discordId ?? null;   // optional
  const discordName: string | null = body.discordName ?? null; // optional
  const notes = (body.notes ?? "").trim() || null;

  const waiverAccepted = body.waiverAccepted === true || body.waiver === true;
  const waiverIp = waiverAccepted ? ip : null;
  const waiverAcceptedAt = waiverAccepted ? new Date() : null;

  // Require RiotTag + sessionType (discord/email no longer required)
  if (!sessionType || !riotTag) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // get slot & reject if already taken
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.status === SlotStatus.taken) {
    return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
  }

  const { amountCents } = computePriceEUR(liveMinutes, followups);

  // ---- Reuse-or-create to avoid P2002 on Session.slotId ----
  const existing = await prisma.session.findFirst({
    where: { slotId, status: "unpaid" },
    select: { id: true },
  });

  try {
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
          scheduledStart: slot.startTime,
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

    // Otherwise create a fresh unpaid session
    const b = await prisma.session.create({
      data: {
        sessionType,
        slotId, // still unique; there will be at most one unpaid row per slot
        liveMinutes,
        followups,
        riotTag,
        discordId,
        discordName,
        notes,
        scheduledStart: slot.startTime,
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
    // Handle race: if another request just created the unpaid session, reuse it.
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

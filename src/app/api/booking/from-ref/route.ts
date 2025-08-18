import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "ref required" }, { status: 400 });

  // Look up by provider-agnostic reference
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { paymentRef: ref },        // PayPal orderId or Stripe PI id (new)
        { stripeSessionId: ref },   // legacy/back-compat
      ],
    },
    include: { slot: true },
  });

  if (!booking || !booking.slot) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    sessionType: booking.sessionType,
    liveMinutes: booking.liveMinutes,
    followups: booking.followups,
    discord: booking.discord ?? "",
    currency: (booking.currency || "eur").toLowerCase(),
    amountCents: booking.amountCents ?? null,
    startISO: booking.slot.startTime.toISOString(),
  });
}

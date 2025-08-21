import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import { getBlockIdsByTime } from "@/lib/booking/block";
import { rateLimit } from "@/lib/rateLimit";
import { CFG_SERVER } from "@/lib/config.server";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = CFG_SERVER.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe not configured");
  stripe = new Stripe(key, { apiVersion: "2025-07-30.basil" });
  return stripe;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`intent:${ip}`, 1000, 60_000)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = CheckoutZ.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
    }

    const { slotId, sessionType, liveMinutes, discord, inGame, followups, liveBlocks, holdKey } = parsed.data;

    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot || slot.status !== SlotStatus.free) {
      return NextResponse.json({ error: "Slot not found or not available" }, { status: 409 });
    }

    // compute block (FREE only, contiguous, with buffer)
    const slotIds = await getBlockIdsByTime(slot.startTime, liveMinutes, prisma);
    if (!slotIds?.length) {
      return NextResponse.json({ error: "Selected time isn’t fully available" }, { status: 409 });
    }

    // hold the whole block
    const now = new Date();
    const holdKeyEff = holdKey || slot.holdKey || crypto.randomUUID();
    const holdUntil = new Date(now.getTime() + HOLD_TTL_MIN * 60_000);
    await prisma.slot.updateMany({
      where: { id: { in: slotIds }, status: SlotStatus.free },
      data: { holdKey: holdKeyEff, holdUntil, status: SlotStatus.blocked },
    });

    const { amountCents, priceEUR } = computePriceEUR(liveMinutes, followups);

    const pi = await getStripe().paymentIntents.create(
      {
        amount: amountCents,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        metadata: {
          slotId,
          slotIds: slotIds.join(","),
          sessionType,
          liveMinutes: String(liveMinutes),
          discord: discord ?? "",
          inGame: String(!!inGame),
          followups: String(followups ?? 0),
          liveBlocks: String(liveBlocks ?? 0),
          priceEUR: String(priceEUR),
        },
      },
      { idempotencyKey: `${slotIds.join("|")}:${amountCents}` }
    );

    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err: any) {
    console.error("INTENT_POST_ERROR:", err);
    return NextResponse.json({ error: "Failed to create intent", detail: String(err?.message || err) }, { status: 500 });
  }
}

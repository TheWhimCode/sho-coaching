// src/app/api/checkout/intent/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import { getBlockIds } from "@/lib/booking/block";
import { rateLimit } from "@/middleware/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;

// lazy Stripe init with a clear error if the key is missing
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe not configured: STRIPE_SECRET_KEY is missing");
  stripe = new Stripe(key);
  return stripe;
}

export async function POST(req: Request) {
  try {
    // simple rate limit
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`intent:${ip}`, 1000, 60_000)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    // parse & validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = CheckoutZ.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      slotId,
      sessionType,
      liveMinutes,
      discord,
      inGame,
      followups,
      liveBlocks,
      holdKey,
    } = parsed.data;

    // slot exists & not taken
    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot || slot.isTaken) {
      return NextResponse.json(
        { error: "Slot not found or already taken" },
        { status: 409 }
      );
    }

    // ---- softened hold enforcement (non-fatal) ----
    const now = new Date();

    // clear expired holds
    if (slot.holdUntil && slot.holdUntil < now) {
      await prisma.slot.update({
        where: { id: slotId },
        data: { holdUntil: null, holdKey: null },
      });
    }

    // adopt provided key, existing key, or mint a new one
    const effectiveHoldKey = holdKey || slot.holdKey || crypto.randomUUID();

    // refresh/apply the hold for 10 minutes
    await prisma.slot.update({
      where: { id: slotId },
      data: {
        holdKey: effectiveHoldKey,
        holdUntil: new Date(now.getTime() + HOLD_TTL_MIN * 60_000),
      },
    });
    // -----------------------------------------------

    // ensure the requested continuous block is available
    const slotIds = await getBlockIds(slotId, liveMinutes, prisma);
    if (!slotIds?.length) {
      return NextResponse.json(
        { error: "Selected time isn’t fully available" },
        { status: 409 }
      );
    }

    // price
    const { amountCents, priceEUR } = computePriceEUR(liveMinutes, followups);

    // create PaymentIntent
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
    return NextResponse.json(
      { error: "Failed to create intent", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}

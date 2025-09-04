// src/app/api/stripe/checkout/intent/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import { getBlockIdsByTime, SLOT_SIZE_MIN } from "@/lib/booking/block";
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
  stripe = new Stripe(key, { apiVersion: "2025-07-30.basil" as any });
  return stripe;
}

export async function POST(req: Request) {
  try {
    // Rate limit: 20/min/IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`intent:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

    const { payMethod = "card" } = body as { payMethod?: "card" | "paypal" | "revolut_pay" };

    const parsed = CheckoutZ.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const {
      slotId,
      sessionType,
      liveMinutes,
      discord,
      followups,
      liveBlocks,
      holdKey,
    } = parsed.data;

    // Clamp minutes (defense-in-depth, even if zod covers it)
    if (liveMinutes < 30 || liveMinutes > 240) {
      return NextResponse.json({ error: "invalid_minutes" }, { status: 400 });
    }

    const { amountCents, priceEUR } = computePriceEUR(liveMinutes, followups);

    // 1) Anchor slot
    const anchor = await prisma.slot.findUnique({
      where: { id: slotId },
      select: { id: true, startTime: true, status: true, holdKey: true },
    });
    if (!anchor) return NextResponse.json({ error: "unavailable" }, { status: 409 });
    if (anchor.status === SlotStatus.taken) return NextResponse.json({ error: "unavailable" }, { status: 409 });
    if (anchor.status === SlotStatus.blocked && anchor.holdKey && holdKey && anchor.holdKey !== holdKey) {
      return NextResponse.json({ error: "unavailable" }, { status: 409 });
    }

    const effKey = holdKey || anchor.holdKey || crypto.randomUUID();

    // 2) Contiguous block check
    let slotIds = await getBlockIdsByTime(anchor.startTime, liveMinutes, prisma);

    // 3) Fallback (only if held by us)
    if (!slotIds) {
      const { BUFFER_BEFORE_MIN, BUFFER_AFTER_MIN } = CFG_SERVER.booking;
      const windowStart = new Date(anchor.startTime.getTime() - BUFFER_BEFORE_MIN * 60_000);
      const windowEnd = new Date(anchor.startTime.getTime() + (liveMinutes + BUFFER_AFTER_MIN) * 60_000);

      const rows = await prisma.slot.findMany({
        where: {
          startTime: { gte: windowStart, lt: windowEnd },
          status: { in: [SlotStatus.free, SlotStatus.blocked] },
        },
        orderBy: { startTime: "asc" },
        select: { id: true, startTime: true, status: true, holdKey: true },
      });

      if (
        !rows.length ||
        rows.some(r => r.status === SlotStatus.blocked && r.holdKey !== effKey)
      ) {
        return NextResponse.json({ error: "unavailable" }, { status: 409 });
      }

      const expected = Math.round((liveMinutes + BUFFER_BEFORE_MIN + BUFFER_AFTER_MIN) / SLOT_SIZE_MIN);
      if (rows.length !== expected) return NextResponse.json({ error: "unavailable" }, { status: 409 });

      const stepMs = SLOT_SIZE_MIN * 60_000;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].startTime.getTime() !== rows[i - 1].startTime.getTime() + stepMs) {
          return NextResponse.json({ error: "unavailable" }, { status: 409 });
        }
      }
      slotIds = rows.map(r => r.id);
    }

    // 4) Claim/extend hold
    const now = new Date();
    const holdUntil = new Date(now.getTime() + HOLD_TTL_MIN * 60_000);
    await prisma.slot.updateMany({
      where: {
        id: { in: slotIds },
        OR: [
          { status: SlotStatus.free },
          { status: SlotStatus.blocked, holdKey: effKey },
        ],
      },
      data: { holdKey: effKey, holdUntil, status: SlotStatus.blocked },
    });

    // 5) Limit payment methods
    const pmTypes: Array<"card" | "paypal" | "revolut_pay"> =
      payMethod === "paypal"
        ? ["paypal"]
        : payMethod === "revolut_pay"
        ? ["revolut_pay"]
        : ["card"];

    const pi = await getStripe().paymentIntents.create(
      {
        amount: amountCents,
        currency: "eur",
        payment_method_types: pmTypes,
        metadata: {
          slotId,
          slotIds: slotIds.join(","),
          sessionType,
          liveMinutes: String(liveMinutes),
          discord: discord ?? "",
          followups: String(followups ?? 0),
          liveBlocks: String(liveBlocks ?? 0),
          priceEUR: String(priceEUR),
          payMethod,
        },
      },
      {
        idempotencyKey: `${slotIds.join("|")}:${amountCents}:${effKey}:${payMethod}`,
      }
    );

    const res = NextResponse.json({ clientSecret: pi.client_secret, pmTypes });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err: any) {
    console.error("INTENT_POST_ERROR", err?.message || err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

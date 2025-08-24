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
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`intent:${ip}`, 1000, 60_000)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    // Which UI the user selected; default card
    const { payMethod = "card" } = body as { payMethod?: "card" | "paypal" | "revolut_pay" };

    const parsed = CheckoutZ.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
    }

    const {
      slotId,
      sessionType,
      liveMinutes,
      discord,
      followups,
      liveBlocks,
      holdKey,
      // Note: you might also send email; not required for PI creation
    } = parsed.data;

    const { amountCents, priceEUR } = computePriceEUR(liveMinutes, followups);

    // 1) Anchor slot & accept our own hold
    const anchor = await prisma.slot.findUnique({
      where: { id: slotId },
      select: { id: true, startTime: true, status: true, holdKey: true },
    });
    if (!anchor) return NextResponse.json({ error: "slot_missing" }, { status: 409 });
    if (anchor.status === SlotStatus.taken) return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    if (anchor.status === SlotStatus.blocked && anchor.holdKey && holdKey && anchor.holdKey !== holdKey) {
      return NextResponse.json({ error: "slot_held_by_other" }, { status: 409 });
    }

    const effKey = holdKey || anchor.holdKey || crypto.randomUUID();

    // 2) Try free contiguous block first
    let slotIds = await getBlockIdsByTime(anchor.startTime, liveMinutes, prisma);

    // 3) Fallback: allow rows already blocked by us
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

      if (!rows.length || rows.some(r => r.status === SlotStatus.blocked && r.holdKey !== effKey)) {
        return NextResponse.json({ error: "block_unavailable" }, { status: 409 });
      }

      const expected = Math.round((liveMinutes + BUFFER_BEFORE_MIN + BUFFER_AFTER_MIN) / SLOT_SIZE_MIN);
      if (rows.length !== expected) return NextResponse.json({ error: "block_unavailable" }, { status: 409 });

      const stepMs = SLOT_SIZE_MIN * 60_000;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].startTime.getTime() !== rows[i - 1].startTime.getTime() + stepMs) {
          return NextResponse.json({ error: "block_unavailable" }, { status: 409 });
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
        OR: [{ status: SlotStatus.free }, { status: SlotStatus.blocked, holdKey: effKey }],
      },
      data: { holdKey: effKey, holdUntil, status: SlotStatus.blocked },
    });

    // 5) Single-method PI (removes Link banner & method switcher)
    const pmTypes: Array<"card" | "paypal" | "revolut_pay"> =
      payMethod === "paypal"      ? ["paypal"] :
      payMethod === "revolut_pay" ? ["revolut_pay"] :
      ["card"];

    const pi = await getStripe().paymentIntents.create(
      {
        amount: amountCents,
        currency: "eur",
        payment_method_types: pmTypes as any, // IMPORTANT: don't also set automatic_payment_methods
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
      // Include payMethod so switching creates a new, distinct PI
      { idempotencyKey: `${slotIds.join("|")}:${amountCents}:${effKey}:${payMethod}` }
    );

    // Return pmTypes for your console.log sanity check on the client
    return NextResponse.json({ clientSecret: pi.client_secret, pmTypes });
  } catch (err: any) {
    console.error("INTENT_POST_ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create intent", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}

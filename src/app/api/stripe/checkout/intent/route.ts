import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import {
  getBlockIdsByTime,
  SLOT_SIZE_MIN,
} from "@/lib/booking/block";
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

    // 1) Load anchor slot and accept our own hold
    const anchor = await prisma.slot.findUnique({
      where: { id: slotId },
      select: { id: true, startTime: true, status: true, holdKey: true },
    });
    if (!anchor) return NextResponse.json({ error: "slot_missing" }, { status: 409 });
    if (anchor.status === SlotStatus.taken) {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    if (anchor.status === SlotStatus.blocked && anchor.holdKey && holdKey && anchor.holdKey !== holdKey) {
      return NextResponse.json({ error: "slot_held_by_other" }, { status: 409 });
    }

    // Use a single effective key across methods
    const effKey = holdKey || anchor.holdKey || crypto.randomUUID();

    // 2) Try FREE-only helper first
    let slotIds = await getBlockIdsByTime(anchor.startTime, liveMinutes, prisma);

    // 3) Fallback: allow rows blocked by *our* holdKey
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

      // Must exist and any blocked must be ours
      if (!rows.length || rows.some(r => r.status === SlotStatus.blocked && r.holdKey !== effKey)) {
        return NextResponse.json({ error: "block_unavailable" }, { status: 409 });
      }

      // Expected chain length with buffers
      const expected = Math.round((liveMinutes + BUFFER_BEFORE_MIN + BUFFER_AFTER_MIN) / SLOT_SIZE_MIN);
      if (rows.length !== expected) {
        return NextResponse.json({ error: "block_unavailable" }, { status: 409 });
      }

      // Contiguity check (15-min steps)
      const stepMs = SLOT_SIZE_MIN * 60_000;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].startTime.getTime() !== rows[i - 1].startTime.getTime() + stepMs) {
          return NextResponse.json({ error: "block_unavailable" }, { status: 409 });
        }
      }
      slotIds = rows.map(r => r.id);
    }

    // 4) Extend/claim the hold for this window (free OR already-blocked-by-us)
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

    // 5) Price (unified minutes; liveBlocks doesn't change price)
    const { amountCents, priceEUR } = computePriceEUR(liveMinutes, followups);

    // 6) Create PI
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
          liveBlocks: String(liveBlocks ?? 0), // debug/analytics only
          priceEUR: String(priceEUR),
        },
      },
      { idempotencyKey: `${slotIds.join("|")}:${amountCents}:${effKey}` }
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

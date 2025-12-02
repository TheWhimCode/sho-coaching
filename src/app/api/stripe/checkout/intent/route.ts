import Stripe from "stripe";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import { getBlockIdsByTime, SLOT_SIZE_MIN, ceilDiv } from "@/lib/booking/block";
import { rateLimit } from "@/lib/rateLimit";
import { CFG_SERVER } from "@/lib/config.server";
import { SlotStatus } from "@prisma/client";
import { computePriceWithProduct } from "@/engine/session/rules/product";
import { clamp } from "@/engine/session/config/session"; // optional
import type { ProductId } from "@/engine/session/model/product";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = CFG_SERVER.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe not configured");
  stripe = new Stripe(key, { apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion });
  return stripe;
}

function makeIdempotencyKey(slotIds: string[], amount: number, effKey: string, payMethod: string) {
  const hash = crypto.createHash("sha1").update(slotIds.join("|")).digest("hex").slice(0, 32);
  return `${hash}:${amount}:${effKey}:${payMethod}`;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`intent:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

    const bookingId = (body as { bookingId?: string }).bookingId?.trim() || null;

    const {
      payMethod = "card",
      productId,
    } = body as {
      payMethod?: "card" | "paypal" | "revolut_pay" | "klarna";
      productId?: ProductId | null;
    };

    let slotId: string;
    let liveMinutes: number;
    let followups: number;
    let sessionType: string;
    let riotTag: string | null = null;
    let booking = null;

    if (bookingId) {
      booking = await prisma.session.findUnique({
        where: { id: bookingId },
        select: {
          slotId: true,
          liveMinutes: true,
          followups: true,
          sessionType: true,
          riotTag: true,
          waiverAccepted: true,
        },
      });

      if (!booking || !booking.slotId) {
        return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
      }

      slotId = booking.slotId;
      liveMinutes = booking.liveMinutes;
      followups = booking.followups;
      sessionType = booking.sessionType?.trim() || "";
      riotTag = booking.riotTag ?? null;
    } else {
      const parsed = CheckoutZ.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      const d = parsed.data;

      slotId = d.slotId;
      liveMinutes = d.liveMinutes;
      followups = d.followups ?? 0;
      sessionType = ((body as { sessionType?: string }).sessionType ?? "").trim();
      riotTag = ((body as { riotTag?: string }).riotTag ?? "").trim() || null;
    }

    if (liveMinutes < 30 || liveMinutes > 240) {
      return NextResponse.json({ error: "invalid_minutes" }, { status: 400 });
    }

    // --- BUNDLE PRICING HERE ---
    let amountCents: number;

    let discount = 0;
    if (bookingId) {
      const couponData = await prisma.session.findUnique({
        where: { id: bookingId },
        select: { couponDiscount: true },
      });
      discount = couponData?.couponDiscount ?? 0;
    }

    if (productId) {
      const sessionConfig = clamp({
        liveMin: liveMinutes,
        liveBlocks: 0,
        followups,
        productId,
      });

      const { priceEUR } = computePriceWithProduct(sessionConfig);
      amountCents = Math.max(priceEUR * 100 - discount * 100, 0);
    } else {
      const base = computePriceEUR(liveMinutes, followups);
      amountCents = Math.max(base.amountCents - discount * 100, 0);
    }

    const anchor = await prisma.slot.findUnique({
      where: { id: slotId },
      select: { id: true, startTime: true, status: true, holdKey: true },
    });

    if (!anchor) return NextResponse.json({ error: "unavailable" }, { status: 409 });
    if (anchor.status === SlotStatus.taken) return NextResponse.json({ error: "unavailable" }, { status: 409 });

    const effKey = anchor.holdKey || crypto.randomUUID();
    let slotIds = await getBlockIdsByTime(anchor.startTime, liveMinutes, prisma);

    if (!slotIds) {
      const BUFFER_BEFORE_MIN = 0;
      const { BUFFER_AFTER_MIN } = CFG_SERVER.booking;

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
        rows.some((r) => r.status === SlotStatus.blocked && r.holdKey && r.holdKey !== anchor.holdKey)
      ) {
        return NextResponse.json({ error: "unavailable" }, { status: 409 });
      }

      const expected = ceilDiv(liveMinutes + BUFFER_BEFORE_MIN + BUFFER_AFTER_MIN, SLOT_SIZE_MIN);

      if (rows.length !== expected) return NextResponse.json({ error: "unavailable" }, { status: 409 });

      const stepMs = SLOT_SIZE_MIN * 60_000;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].startTime.getTime() !== rows[i - 1].startTime.getTime() + stepMs) {
          return NextResponse.json({ error: "unavailable" }, { status: 409 });
        }
      }

      slotIds = rows.map((r) => r.id);
    }

    if (!slotIds?.length) {
      return NextResponse.json({ error: "unavailable" }, { status: 409 });
    }

    const now = new Date();
    const holdUntil = new Date(now.getTime() + HOLD_TTL_MIN * 60_000);

    await prisma.slot.updateMany({
      where: {
        id: { in: slotIds },
        OR: [
          { status: SlotStatus.free },
          { status: SlotStatus.blocked, holdKey: anchor.holdKey ?? effKey },
        ],
      },
      data: {
        holdKey: anchor.holdKey ?? effKey,
        holdUntil,
      },
    });

    const pmTypes =
      payMethod === "paypal"
        ? ["paypal"]
        : payMethod === "revolut_pay"
        ? ["revolut_pay"]
        : payMethod === "klarna"
        ? ["klarna"]
        : ["card"];

    const metadata: Record<string, string> = {
      bookingId: bookingId ?? "",
      slotId,
      slotIds: slotIds.join(","),
      ...(sessionType ? { sessionType } : {}),
      ...(riotTag ? { riotTag } : {}),
      ...(booking?.waiverAccepted ? { waiverAccepted: "true" } : {}),
    };

    const idemKey = makeIdempotencyKey(slotIds, amountCents, anchor.holdKey ?? effKey, payMethod);

    const pi = await getStripe().paymentIntents.create(
      {
        amount: amountCents,
        currency: "eur",
        payment_method_types: pmTypes,
        metadata,
        setup_future_usage: "off_session",
      },
      { idempotencyKey: idemKey }
    );

    if (bookingId) {
      await prisma.session.update({
        where: { id: bookingId },
        data: {
          paymentRef: pi.id,
          amountCents,
          currency: "eur",
          paymentProvider: "stripe",
          blockCsv: slotIds.join(","),
        },
      });
    }

    const res = NextResponse.json({ clientSecret: pi.client_secret, pmTypes });
    res.headers.set("Cache-Control", "no-store");
    return res;

  } catch (err: any) {
    console.error("INTENT_ERROR", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

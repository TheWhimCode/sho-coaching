import Stripe from "stripe";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import { rateLimit } from "@/lib/rateLimit";
import { CFG_SERVER } from "@/lib/config.server";
import { SlotStatus } from "@prisma/client";
import { computePriceWithProduct } from "@/engine/session/rules/product";
import { clamp } from "@/engine/session/config/session";
import type { ProductId } from "@/engine/session/model/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = CFG_SERVER.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe not configured");
  stripe = new Stripe(key, { apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion });
  return stripe;
}

function makeIdempotencyKey(
  slotIds: string[],
  amount: number,
  holdKey: string,
  payMethod: string
) {
  const hash = crypto
    .createHash("sha1")
    .update(slotIds.join("|"))
    .digest("hex")
    .slice(0, 32);
  return `${hash}:${amount}:${holdKey}:${payMethod}`;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`intent:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const bookingId =
      (body as { bookingId?: string }).bookingId?.trim() || null;

    const {
      payMethod = "card",
      productId,
      holdKey,
    } = body as {
      payMethod?: "card" | "paypal" | "revolut_pay" | "klarna";
      productId?: ProductId | null;
      holdKey?: string;
    };

    if (!holdKey) {
      return NextResponse.json({ error: "missing_hold" }, { status: 400 });
    }

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
      sessionType =
        ((body as { sessionType?: string }).sessionType ?? "").trim();
      riotTag =
        ((body as { riotTag?: string }).riotTag ?? "").trim() || null;
    }

    // ---- pricing unchanged ----
    let discount = 0;
    if (bookingId) {
      const couponData = await prisma.session.findUnique({
        where: { id: bookingId },
        select: { couponDiscount: true },
      });
      discount = couponData?.couponDiscount ?? 0;
    }

    let amountCents: number;
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

    // ---- validate hold (ENGINE-OWNED) ----
    const heldSlots = await prisma.slot.findMany({
      where: {
        holdKey,
        holdUntil: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!heldSlots.length) {
      return NextResponse.json({ error: "hold_expired" }, { status: 409 });
    }

    const slotIds = heldSlots.map((s) => s.id);

    // ---- payment intent ----
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

    const idemKey = makeIdempotencyKey(
      slotIds,
      amountCents,
      holdKey,
      payMethod
    );

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

    const res = NextResponse.json({
      clientSecret: pi.client_secret,
      pmTypes,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;

  } catch (err) {
    console.error("INTENT_ERROR", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

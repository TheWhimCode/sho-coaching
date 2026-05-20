import Stripe from "stripe";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ } from "@/engine/checkout";
import { resolveBookingAmountCentsAfterCoupon } from "@/engine/session/rules/resolveBookingPrice";
import type { ProductId } from "@/engine/session/model/product";
import { rateLimit } from "@/lib/rateLimit";
import { CFG_SERVER } from "@/lib/config.server";
import { getStripePaymentMethodTypes } from "@/engine/checkout";

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

function parseProductId(raw: unknown): ProductId | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.trim() as ProductId;
}

function parseLiveBlocks(raw: unknown): number {
  if (!Number.isFinite(Number(raw))) return 0;
  return Math.max(0, Math.min(2, parseInt(String(raw), 10)));
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
      productId: bodyProductId,
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
    let liveBlocks: number;
    let productId: ProductId | null;
    let couponDiscountEUR = 0;
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
          liveBlocks: true,
          sessionType: true,
          riotTag: true,
          waiverAccepted: true,
          couponDiscount: true,
        },
      });

      if (!booking || !booking.slotId) {
        return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
      }

      slotId = booking.slotId;
      liveMinutes = booking.liveMinutes;
      followups = booking.followups;
      liveBlocks = booking.liveBlocks ?? 0;
      productId = parseProductId(bodyProductId);
      couponDiscountEUR = booking.couponDiscount ?? 0;
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
      liveBlocks = parseLiveBlocks((body as { liveBlocks?: number }).liveBlocks);
      productId = parseProductId(bodyProductId);
      sessionType =
        ((body as { sessionType?: string }).sessionType ?? "").trim();
      riotTag =
        ((body as { riotTag?: string }).riotTag ?? "").trim() || null;
    }

    const amountCents = resolveBookingAmountCentsAfterCoupon({
      liveMinutes,
      followups,
      liveBlocks,
      productId,
      couponDiscountEUR,
    });

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

    const pmTypes = getStripePaymentMethodTypes(payMethod);

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

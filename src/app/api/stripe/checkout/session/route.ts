// src/app/api/stripe/checkout/session/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePriceEUR } from "@/engine/session/rules/pricing";
import { computePriceWithProduct } from "@/engine/session/rules/product";
import { clamp } from "@/engine/session/config/session";
import type { ProductId } from "@/engine/session/model/product";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  // slotIds from client for card flow; productId for bundle pricing; amountCents only used when no bookingId
  let {
    method,
    amountCents: bodyAmountCents,
    bookingId,
    slotIds: bodySlotIds,
    productId,
  } = await req.json().catch(() => ({}));

  console.log("[checkout/session] body", { method, bookingId });

  // ⭐ SAFETY FIX:
  // If bookingId missing (because front-end forgot to send it),
  // recover it by checking if the user already has an unpaid booking.
  if (!bookingId) {
    try {
      const unpaid = await prisma.session.findFirst({
        where: { status: "unpaid" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (unpaid?.id) {
        console.warn(
          "[checkout/session] WARNING: bookingId missing from client — recovered automatically:",
          unpaid.id
        );
        bookingId = unpaid.id;
      }
    } catch (err) {
      console.error("[checkout/session] failed to recover bookingId", err);
    }
  }

  let metadata: Record<string, string> = {};
  let finalAmountCents: number;

  if (bookingId) {
    const s = await prisma.session.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        slotId: true,
        blockCsv: true,
        sessionType: true,
        riotTag: true,
        waiverAccepted: true,
        couponDiscount: true,
        liveMinutes: true,
        followups: true,
      },
    });

    console.log("[checkout/session] booking row", s);

    if (!s) {
      console.error("[checkout/session] booking_not_found");
      return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
    }

    // Single source of truth: compute amount from booking and apply coupon discount (same logic as intent route)
    const discount = s.couponDiscount ?? 0;
    let amountCents: number;
    if (productId) {
      const sessionConfig = clamp({
        liveMin: s.liveMinutes,
        liveBlocks: 0,
        followups: s.followups,
        productId: productId as ProductId,
      });
      const { priceEUR } = computePriceWithProduct(sessionConfig);
      amountCents = Math.max(priceEUR * 100 - discount * 100, 0);
    } else {
      const base = computePriceEUR(s.liveMinutes, s.followups);
      amountCents = Math.max(base.amountCents - discount * 100, 0);
    }
    finalAmountCents = amountCents;

    const slotIdsCsv =
      typeof bodySlotIds === "string" && bodySlotIds.trim()
        ? bodySlotIds.trim()
        : (s.blockCsv ?? "");

    metadata = {
      bookingId: s.id,
      slotId: s.slotId ?? "",
      slotIds: slotIdsCsv,
      sessionType: s.sessionType ?? "",
      riotTag: s.riotTag ?? "",
      ...(s.waiverAccepted ? { waiverAccepted: "true" } : {}),
    };
  } else {
    if (!bodyAmountCents) {
      console.error("[checkout/session] missing_amount");
      return NextResponse.json({ error: "missing_amount" }, { status: 400 });
    }
    finalAmountCents = bodyAmountCents;
  }

  console.log("[checkout/session] metadata to attach", metadata);
  console.log("[checkout/session] finalAmountCents", finalAmountCents);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: [method],

      payment_intent_data: {
        metadata,
      },

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Coaching Session",
            },
            unit_amount: finalAmountCents,
          },
          quantity: 1,
        },
      ],

      success_url: `${req.headers.get("origin")}/checkout/success`,
      cancel_url: `${req.headers.get("origin")}/checkout`,
    });

    console.log("[checkout/session] created", {
      id: session.id,
      url: session.url,
      metadata: session.metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("CHECKOUT_SESSION_ERR", err);
    return NextResponse.json({ error: "failed_to_create" }, { status: 500 });
  }
}

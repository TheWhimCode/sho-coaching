// src/app/api/stripe/checkout/session/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  const { method, amountCents, bookingId } = await req.json().catch(() => ({}));

  console.log("[checkout/session] body", { method, amountCents, bookingId });

  if (!amountCents) {
    console.error("[checkout/session] missing_amount");
    return NextResponse.json({ error: "missing_amount" }, { status: 400 });
  }

  let metadata: Record<string, string> = {};

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
      },
    });

    console.log("[checkout/session] booking row", s);

    if (s) {
      metadata = {
        bookingId: s.id,
        slotId: s.slotId ?? "",
        slotIds: s.blockCsv ?? "",
        sessionType: s.sessionType ?? "",
        riotTag: s.riotTag ?? "",
        ...(s.waiverAccepted ? { waiverAccepted: "true" } : {}),
      };
    }
  }

  console.log("[checkout/session] metadata to attach", metadata);

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
            unit_amount: amountCents,
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

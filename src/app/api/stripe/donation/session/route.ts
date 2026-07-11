import Stripe from "stripe";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const DONATION_PRICE_LOOKUP_KEY = "guide_donation";
const SUGGESTED_AMOUNT_CENTS = 500;
const MIN_AMOUNT_CENTS = 100;
const MAX_AMOUNT_CENTS = 50_000;

async function getDonationPriceId() {
  const existing = await stripe.prices.list({
    lookup_keys: [DONATION_PRICE_LOOKUP_KEY],
    limit: 1,
  });

  if (existing.data[0]?.id) {
    return existing.data[0].id;
  }

  const price = await stripe.prices.create({
    currency: "eur",
    lookup_key: DONATION_PRICE_LOOKUP_KEY,
    product_data: {
      name: "Viego Guide — tip jar",
    },
    custom_unit_amount: {
      enabled: true,
      preset: SUGGESTED_AMOUNT_CENTS,
      minimum: MIN_AMOUNT_CENTS,
      maximum: MAX_AMOUNT_CENTS,
    },
  });

  return price.id;
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? SITE_URL;

  try {
    const priceId = await getDonationPriceId();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      payment_intent_data: {
        metadata: {
          type: "guide_donation",
        },
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/guide?donated=1`,
      cancel_url: `${origin}/guide`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[donation/session] failed", err);
    return NextResponse.json({ error: "failed_to_create" }, { status: 500 });
  }
}

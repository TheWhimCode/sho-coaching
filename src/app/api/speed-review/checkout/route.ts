import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { CFG_SERVER } from "@/lib/config.server";
import { SPEED_REVIEW_PRIORITY_AMOUNT_CENTS } from "@/lib/speedReview/applyPriorityPayment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodyZ = z.object({
  queueEntryId: z.string().min(1),
});

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  stripe = new Stripe(CFG_SERVER.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion,
  });
  return stripe;
}

/** Stripe Checkout for 10€ priority (must already be in queue). */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`speed-review:checkout:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodyZ>;
  try {
    body = BodyZ.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const row = await prisma.speedReviewQueue.findUnique({
    where: { id: body.queueEntryId },
    select: { id: true, reviewStatus: true, paidPriority: true, discordId: true },
  });

  if (!row || row.reviewStatus !== "Pending") {
    return NextResponse.json({ error: "queue_entry_invalid" }, { status: 400 });
  }
  if (row.paidPriority) {
    return NextResponse.json({ error: "already_priority" }, { status: 409 });
  }

  const origin = new URL(req.url).origin;

  const meta = {
    kind: "speed_review_priority",
    queueEntryId: row.id,
    discordId: row.discordId,
  } as const;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: SPEED_REVIEW_PRIORITY_AMOUNT_CENTS,
          product_data: {
            name: "Stage speed review — priority queue",
            description: "Move to the top of the queue for the next session.",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/speed-reviews?priority=success`,
    cancel_url: `${origin}/speed-reviews?priority=cancel`,
    metadata: { ...meta },
    payment_intent_data: {
      metadata: { ...meta },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "stripe_no_url" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
}

// src/app/api/stripe/checkout/route.ts
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBlockIds } from "@/lib/booking/block";
import { rateLimit } from "@/lib/rateLimit";
import { computePriceEUR } from "@/lib/pricing";
import { CFG_SERVER } from "@/lib/config.server";
import { CFG_PUBLIC } from "@/lib/config.public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(CFG_SERVER.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// ---- input body ----
const Body = z.object({
  slotId: z.string(),
  sessionType: z.string(),
  liveMinutes: z.number().int().min(30).max(120),
  discord: z.string().trim().max(64).optional().default(""),
  inGame: z.boolean().optional().default(false),
  followups: z.number().int().min(0).max(4).optional().default(0),
  liveBlocks: z.number().int().optional().default(0),
});

export async function POST(req: Request) {
  // --- rate limit ---
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`checkout:${ip}`, 10, 60_000)) {
    return Response.json(
      { error: "Too many checkout attempts" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const { slotId, sessionType, liveMinutes, discord, inGame, followups, liveBlocks } =
      parsed.data;

    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot || slot.isTaken) {
      return Response.json(
        { error: "Slot not found or already taken" },
        { status: 409 }
      );
    }

    const blockIds = await getBlockIds(slotId, liveMinutes, prisma);
    if (!blockIds) {
      return Response.json(
        { error: "Selected time isn’t fully available" },
        { status: 409 }
      );
    }

    // pricing
    const { amountCents, priceEUR } = computePriceEUR(liveMinutes, followups);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${sessionType} (${liveMinutes} min)`,
              description: `Time: ${new Date(slot.startTime).toLocaleString()}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${CFG_PUBLIC.SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CFG_PUBLIC.SITE_URL}/checkout/cancel`,
      metadata: {
        slotId,
        slotIds: blockIds.join(","),
        sessionType,
        liveMinutes: String(liveMinutes),
        discord: discord ?? "",
        inGame: String(!!inGame),
        followups: String(followups ?? 0),
        liveBlocks: String(liveBlocks ?? 0),
        priceEUR: String(priceEUR),
      },
    });

    return Response.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("CHECKOUT_POST_ERROR:", err);
    return Response.json(
      { error: "Checkout session failed", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { finalizeBooking } from "@/lib/booking/finalizeBooking";
import { CFG_SERVER } from "@/lib/config.server";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

if (!CFG_SERVER.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!CFG_SERVER.STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET");

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  stripe = new Stripe(CFG_SERVER.STRIPE_SECRET_KEY, { apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion });
  return stripe;
}

async function commitTakenSlots(slotIdsCsv: string | undefined) {
  const ids = (slotIdsCsv ?? "").split(",").filter(Boolean);
  if (!ids.length) return;
  await prisma.slot.updateMany({
    where: { id: { in: ids }, status: { in: [SlotStatus.free, SlotStatus.blocked] } },
    data: { status: SlotStatus.taken, holdKey: null, holdUntil: null },
  });
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(raw, sig, CFG_SERVER.STRIPE_WEBHOOK_SECRET, 300);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] verify failed:", msg);
    return NextResponse.json({ error: "verify_failed" }, { status: 400 });
  }

  // Idempotency guard
  try {
    await prisma.processedEvent.create({ data: { id: event.id } });
  } catch (e: unknown) {
    if (isUniqueViolation(e)) return NextResponse.json({ ok: true }); // already processed
    throw e;
  }

  const handle = async (
    meta: Record<string, string>,
    amount?: number,
    currency?: string,
    paymentRef?: string
  ) => {
    const hasIdentifier = Boolean(meta.bookingId || meta.slotId || meta.slotIds);
    if (!hasIdentifier) {
      console.warn("[webhook] skipping event without identifiers (bookingId/slotId/slotIds)", { paymentRef });
      return;
    }

    // Source of truth: finalize the booking
    await finalizeBooking(
      meta,                                // { bookingId, slotId/slotIds, riotTag?, sessionType? }
      amount,
      (currency ?? "eur").toLowerCase(),
      paymentRef,
      "stripe"
    );

    // Mark slots as taken
    await commitTakenSlots(meta.slotIds);
  };

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const piEvent = event.data.object as Stripe.PaymentIntent;
        const pi = await getStripe().paymentIntents.retrieve(piEvent.id);
        const meta = (pi.metadata ?? {}) as Record<string, string>;
        await handle(meta, pi.amount_received ?? undefined, pi.currency, pi.id);
        break;
      }

      case "checkout.session.completed": {
        // If you ever use Stripe Checkout; Elements flow may never hit this
        const csEvent = event.data.object as Stripe.Checkout.Session;
        const cs = await getStripe().checkout.sessions.retrieve(csEvent.id, { expand: ["payment_intent"] });

        let pi: Stripe.PaymentIntent | null = null;
        if (typeof cs.payment_intent === "string") {
          pi = await getStripe().paymentIntents.retrieve(cs.payment_intent);
        } else if (cs.payment_intent && (cs.payment_intent as any).object === "payment_intent") {
          pi = cs.payment_intent as Stripe.PaymentIntent;
        }

        const piMeta = (pi?.metadata ?? {}) as Record<string, string>;
        const csMeta = (cs.metadata ?? {}) as Record<string, string>;
        const meta = { ...csMeta, ...piMeta, stripeSessionId: cs.id };

        const paymentRef = pi?.id ?? cs.id; // prefer PI id
        await handle(meta, cs.amount_total ?? undefined, cs.currency ?? "eur", paymentRef);
        break;
      }

      default:
        // ignore other events
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] unhandled error:", msg);
    return NextResponse.json({ error: "webhook_error", detail: msg }, { status: 500 });
  }
}

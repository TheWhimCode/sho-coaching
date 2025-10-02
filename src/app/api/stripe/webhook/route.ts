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

  // Idempotency: only mark processed AFTER success; if already processed, exit early.
  const already = await prisma.processedEvent.findUnique({ where: { id: event.id } }).catch(() => null);
  if (already) {
    return NextResponse.json({ ok: true });
  }

  const handle = async (
    meta: Record<string, string>,
    amount?: number,
    currency?: string,
    paymentRef?: string
  ) => {
    const hasIdentifier = Boolean(meta.bookingId || meta.slotId || meta.slotIds);
    if (!hasIdentifier) {
      console.warn("[webhook] skipping: no identifiers", { paymentRef, meta });
      return;
    }

    console.log("[webhook] finalize start", { paymentRef, amount, currency, meta });

    try {
      await finalizeBooking(
        meta,                                // { bookingId, slotId/slotIds, riotTag?, sessionType? }
        amount,
        (currency ?? "eur").toLowerCase(),
        paymentRef,
        "stripe"
      );
    } catch (e: any) {
      console.error("[webhook] finalize error", {
        msg: e?.message,
        name: e?.name,
        code: e?.code,
        stack: e?.stack,
      });
      // Re-throw so outer catch 500s with an explicit reason
      throw new Error(`[finalizeBooking] ${e?.message || "unknown_error"}`);
    }

    await commitTakenSlots(meta.slotIds);

    console.log("[webhook] finalize done", { paymentRef });
  };

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const piEvent = event.data.object as Stripe.PaymentIntent;
        // Fetch fresh PI to ensure latest metadata
        const pi = await getStripe().paymentIntents.retrieve(piEvent.id);
        console.log("[webhook] PI meta", { id: pi.id, metadata: pi.metadata });
        const meta = (pi.metadata ?? {}) as Record<string, string>;
        await handle(meta, pi.amount_received ?? undefined, pi.currency, pi.id);
        break;
      }

      case "checkout.session.completed": {
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

        console.log("[webhook] CS meta", { csId: cs.id, meta });

        const paymentRef = pi?.id ?? cs.id; // prefer PI id
        await handle(meta, cs.amount_total ?? undefined, cs.currency ?? "eur", paymentRef);
        break;
      }

      default:
        // ignore other events
        break;
    }

    // Mark processed AFTER successful handling
    try {
      await prisma.processedEvent.create({ data: { id: event.id } });
    } catch (e) {
      console.warn("[webhook] processedEvent create race (ignore)", event.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    // Do NOT mark processed; allow Stripe to retry.
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] unhandled error:", msg);
    return NextResponse.json({ error: "webhook_error", detail: msg }, { status: 500 });
  }
}

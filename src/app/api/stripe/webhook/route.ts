// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { finalizeBooking } from "@/lib/booking/finalizeBooking";
import { sendBookingEmail } from "@/lib/email";
import { CFG_SERVER } from "@/lib/config.server";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  if (!CFG_SERVER.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
  stripe = new Stripe(CFG_SERVER.STRIPE_SECRET_KEY, { apiVersion: "2025-07-30.basil" });
  return stripe;
}

async function extractEmailFromPI(pi: Stripe.PaymentIntent): Promise<string | undefined> {
  if (pi.receipt_email) return pi.receipt_email;

  // Customer email
  const cRef = pi.customer;
  if (typeof cRef === "string") {
    const cust = await getStripe().customers.retrieve(cRef);
    if (!("deleted" in cust)) return (cust as Stripe.Customer).email ?? undefined;
  } else if (cRef && !("deleted" in cRef)) {
    return (cRef as Stripe.Customer).email ?? undefined;
  }

  // Latest charge
  const piExpanded = await getStripe().paymentIntents.retrieve(pi.id, { expand: ["latest_charge"] });
  const lc = piExpanded.latest_charge as Stripe.Charge | null;
  return lc?.billing_details?.email ?? undefined;
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
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  // Use raw body for signature verification
  const raw = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(raw, sig, CFG_SERVER.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("[webhook] verify failed:", err?.message || err);
    return NextResponse.json({ error: "verify_failed" }, { status: 400 });
  }

  // Small helper with logging and email guarded
  const handle = async (
    meta: Record<string, string>,
    amount?: number,
    currency?: string,
    paymentRef?: string,
    email?: string
  ) => {
    if (!meta.slotId && !meta.slotIds) {
      // This happens with CLI “trigger” events; don’t 500.
      console.warn("[webhook] skipping event without booking metadata", { paymentRef });
      return;
    }

    console.log("[webhook] finalize start", { paymentRef, amount, currency, meta });

    // Idempotent booking finalization
    await finalizeBooking(meta, amount, (currency ?? "eur").toLowerCase(), paymentRef);

    // Mark slots taken (idempotent)
    await commitTakenSlots(meta.slotIds);

    console.log("[webhook] finalize done", { paymentRef });

    // Email is best-effort; never fail the webhook because of it.
    if (email && paymentRef) {
      try {
        const booking = await prisma.booking.findFirst({
          where: { paymentRef },
          select: { id: true, scheduledStart: true, scheduledMinutes: true, sessionType: true, followups: true },
        });
        if (booking) {
          await sendBookingEmail(email, {
            title: booking.sessionType ?? "Coaching Session",
            startISO: booking.scheduledStart.toISOString(),
            minutes: booking.scheduledMinutes,
            followups: booking.followups,
            priceEUR: Math.round((amount ?? 0) / 100),
            bookingId: booking.id,
          });
          console.log("[webhook] email sent", { paymentRef, email });
        }
      } catch (e: any) {
        console.warn("[webhook] email failed (ignored):", e?.message || e);
      }
    }
  };

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const meta = (pi.metadata ?? {}) as Record<string, string>;
        const email = await extractEmailFromPI(pi);
        await handle(meta, pi.amount_received ?? undefined, pi.currency, pi.id, email);
        break;
      }
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const meta = (cs.metadata ?? {}) as Record<string, string>;
        const email = cs.customer_details?.email || undefined;
        await handle(meta, cs.amount_total ?? undefined, cs.currency ?? "eur", cs.id, email);
        break;
      }
      default:
        // Ignore other events
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[webhook] unhandled error:", err?.message || err);
    return NextResponse.json({ error: "webhook_error", detail: String(err?.message || err) }, { status: 500 });
  }
}

// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { finalizeBooking } from "@/lib/booking/finalizeBooking";
import { sendBookingEmail } from "@/lib/email";
import { CFG_SERVER } from "@/lib/config.server";
import { SlotStatus } from "@prisma/client";
import { sign } from "@/lib/sign";

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

async function extractEmailFromPI(pi: Stripe.PaymentIntent): Promise<string | undefined> {
  if (pi.receipt_email) return pi.receipt_email;

  const cRef = pi.customer;
  if (typeof cRef === "string") {
    const cust = await getStripe().customers.retrieve(cRef);
    if (!("deleted" in cust)) return (cust as Stripe.Customer).email ?? undefined;
  } else if (cRef && !("deleted" in cRef)) {
    return (cRef as Stripe.Customer).email ?? undefined;
  }

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

  try {
    await prisma.processedEvent.create({ data: { id: event.id } });
  } catch (e: unknown) {
    if (isUniqueViolation(e)) return NextResponse.json({ ok: true });
    throw e;
  }

  const handle = async (
    meta: Record<string, string>,
    amount?: number,
    currency?: string,
    paymentRef?: string,
    email?: string
  ) => {
    const hasIdentifier = Boolean(meta.bookingId || meta.slotId || meta.slotIds);
    if (!hasIdentifier) {
      console.warn("[webhook] skipping event without identifiers (bookingId/slotId/slotIds)", { paymentRef });
      return;
    }

    await finalizeBooking(
      { ...meta, email }, // meta minimal; DB holds rich fields
      amount,
      (currency ?? "eur").toLowerCase(),
      paymentRef,
      "stripe"
    );

    await commitTakenSlots(meta.slotIds);

    if (email && paymentRef) {
      try {
        const booking = await prisma.session.findFirst({
          where: { paymentRef },
          select: {
            id: true,
            scheduledStart: true,
            scheduledMinutes: true,
            sessionType: true,
            followups: true,
          },
        });

        if (booking?.scheduledStart) {
          const startISO = booking.scheduledStart.toISOString();
          const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
          const icsUrl = `${base}/api/ics?bookingId=${booking.id}&sig=${sign(booking.id)}`;

          await sendBookingEmail(email, {
            title: booking.sessionType ?? "Coaching Session",
            startISO,
            minutes: booking.scheduledMinutes,
            followups: booking.followups,
            priceEUR: (amount ?? 0) / 100,
            bookingId: booking.id,
            timeZone: meta.timeZone || meta.tz,
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[webhook] email failed (ignored):", msg);
      }
    }
  };

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const piEvent = event.data.object as Stripe.PaymentIntent;
        const pi = await getStripe().paymentIntents.retrieve(piEvent.id);
        const meta = (pi.metadata ?? {}) as Record<string, string>;
        const email = (await extractEmailFromPI(pi)) || undefined;
        await handle(meta, pi.amount_received ?? undefined, pi.currency, pi.id, email);
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

        // Prefer PI metadata; pass CS id so finalizeBooking can persist it in stripeSessionId
        const meta = { ...csMeta, ...piMeta, stripeSessionId: cs.id };

        const email =
          (await (pi ? extractEmailFromPI(pi) : Promise.resolve<string | undefined>(undefined))) ||
          cs.customer_details?.email ||
          undefined;

        // IMPORTANT: prefer PI id for paymentRef so /from-ref?ref=pi_... resolves
        const paymentRef = pi?.id ?? cs.id;

        await handle(meta, cs.amount_total ?? undefined, cs.currency ?? "eur", paymentRef, email);
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] unhandled error:", msg);
    return NextResponse.json({ error: "webhook_error", detail: msg }, { status: 500 });
  }
}

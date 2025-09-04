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
  // use a valid, typed API version (remove custom string)
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

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      raw,
      sig,
      CFG_SERVER.STRIPE_WEBHOOK_SECRET,
      300 // seconds of timestamp tolerance (anti-replay)
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] verify failed:", msg);
    return NextResponse.json({ error: "verify_failed" }, { status: 400 });
  }

  // Helper to finalize + email (idempotent)
  const handle = async (
    meta: Record<string, string>,
    amount?: number,
    currency?: string,
    paymentRef?: string,
    email?: string
  ) => {
    if (!meta.slotId && !meta.slotIds) {
      console.warn("[webhook] skipping event without booking metadata", { paymentRef });
      return;
    }

    console.log("[webhook] finalize start", { paymentRef, amount, currency, meta });

    // 1) Idempotent booking finalization
    await finalizeBooking(meta, amount, (currency ?? "eur").toLowerCase(), paymentRef);

    // 2) Mark blocks as taken (idempotent)
    await commitTakenSlots(meta.slotIds);

    console.log("[webhook] finalize done", { paymentRef });

    // 3) Best-effort confirmation email with signed ICS
    if (email && paymentRef) {
      try {
        const booking = await prisma.booking.findFirst({
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
          const startISO = booking.scheduledStart.toISOString(); // typed Date from Prisma
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
            icsUrl,
          });

          console.log("[webhook] email sent", { paymentRef, email });
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
        // ignore unneeded events
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] unhandled error:", msg);
    return NextResponse.json({ error: "webhook_error", detail: msg }, { status: 500 });
  }
}

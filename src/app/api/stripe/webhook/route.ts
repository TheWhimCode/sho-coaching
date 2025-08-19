import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendBookingEmail } from "@/lib/email";
import { finalizeBooking } from "@/lib/booking/finalizeBooking";
// webhook
import { CFG_SERVER } from "@/lib/config.server";
const stripe = new Stripe(CFG_SERVER.STRIPE_SECRET_KEY, { apiVersion: "2025-07-30.basil" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";



export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      CFG_SERVER.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("WEBHOOK VERIFY ERROR:", err?.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  async function handle(
    meta: Record<string, string>,
    amount?: number,
    currency?: string,
    paymentRef?: string,
    emailFromPayload?: string
  ) {
    // finalize booking (idempotent)
    await finalizeBooking(
      meta,
      amount,
      (currency ?? "eur").toLowerCase(),
      paymentRef
    );

    // figure out slot start for the email
    const slotIds = (meta.slotIds ? meta.slotIds.split(",") : []).filter(Boolean);
    const firstSlotId = meta.slotId || slotIds[0];
    const slot = firstSlotId
      ? await prisma.slot.findUnique({
          where: { id: firstSlotId },
          select: { startTime: true },
        })
      : null;

    // only send if we have an email + a start time
    if (emailFromPayload && slot?.startTime) {
      await sendBookingEmail(emailFromPayload, {
        title: meta.sessionType ?? "Coaching Session",
        startISO: slot.startTime.toISOString(),
        minutes: parseInt(meta.liveMinutes ?? "60", 10),
        followups: parseInt(meta.followups ?? "0", 10),
        priceEUR: parseInt(meta.priceEUR ?? "40", 10),
        bookingId: firstSlotId ?? "",
      });
    }
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const meta = (pi.metadata ?? {}) as Record<string, string>;

      let email =
        pi.receipt_email ||
        (typeof pi.customer === "string"
          ? (() => {
              const c = stripe.customers.retrieve(pi.customer) as Promise<
                Stripe.Customer | Stripe.DeletedCustomer
              >;
              return c.then(
                (cust) =>
                  ("deleted" in cust ? undefined : (cust as Stripe.Customer).email) ??
                  undefined
              );
            })()
          : undefined);

      // Fallback: latest charge billing email
      if (!email) {
        const piExpanded = await stripe.paymentIntents.retrieve(pi.id, {
          expand: ["latest_charge"],
        });
        const lc = piExpanded.latest_charge as Stripe.Charge | null;
        email = lc?.billing_details?.email ?? undefined;
      }

      await handle(
        meta,
        pi.amount_received ?? undefined,
        pi.currency,
        pi.id,
        await email
      );
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
      // ignore other events
      break;
  }

  return new Response("ok", { status: 200 });
}

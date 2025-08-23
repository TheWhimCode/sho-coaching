import { NextResponse } from "next/server";
import { paypalCaptureOrder } from "@/lib/paypal";
import { getBlockIdsByTime } from "@/lib/booking/block";
import { finalizeBooking } from "@/lib/booking/finalizeBooking";
import { prisma } from "@/lib/prisma";
import { sendBookingEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// decode our base64url custom_id
function fromBase64Url(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

export async function POST(req: Request) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  try {
    const data = await paypalCaptureOrder(orderId);
    if (data.status !== "COMPLETED") {
      return NextResponse.json({ error: "not_completed", raw: data }, { status: 400 });
    }

    const pu = data.purchase_units?.[0];
    const customRaw = pu?.custom_id ? fromBase64Url(String(pu.custom_id)) : null;
    const c = customRaw ? (JSON.parse(customRaw) as any) : null;

    // Build meta for finalizeBooking (use unified minutes)
    const meta: Record<string, string> = c
      ? {
          slotId: String(c.a),
          sessionType: String(c.t),
          liveMinutes: String(c.m),
          discord: String(c.d || ""),
          inGame: String(!!c.g),
          followups: String(c.f ?? 0),
          liveBlocks: String(c.l ?? 0),
        }
      : {};

    // Compute the exact contiguous block again (idempotent + fresh)
    if (c?.a && c?.m) {
      const slot = await prisma.slot.findUnique({ where: { id: String(c.a) } });
      if (slot) {
        const ids = await getBlockIdsByTime(slot.startTime, Number(c.m), prisma);
        if (ids?.length) meta.slotIds = ids.join(",");
      }
    }

    // Amount/currency from capture payload
    const cap = pu?.payments?.captures?.[0];
    const amountCents = cap?.amount?.value ? Math.round(parseFloat(cap.amount.value) * 100) : undefined;
    const currency = cap?.amount?.currency_code?.toLowerCase() ?? "eur";

    // Persist booking (idempotent)
    await finalizeBooking(meta, amountCents, currency, orderId, "paypal");

    // Fire-and-forget email — do NOT fail the capture/booking on email problems
    const email = data.payer?.email_address || pu?.payee?.email_address || undefined;
    if (email) {
      try {
        const booking = await prisma.booking.findFirst({
          where: { paymentRef: orderId },
          select: { id: true, sessionType: true, scheduledStart: true, scheduledMinutes: true, followups: true },
        });
        if (booking) {
          await sendBookingEmail(email, {
            title: booking.sessionType ?? "Coaching Session",
            startISO: booking.scheduledStart.toISOString(),
            minutes: booking.scheduledMinutes,
            followups: booking.followups,
            priceEUR: amountCents ? Math.round(amountCents / 100) : c?.p ?? 0,
            bookingId: booking.id,
          });
        }
      } catch (e) {
        console.error("paypal_email_failed", (e as any)?.message || e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PP_CAPTURE_FAIL", e?.message, e);
    return NextResponse.json({ error: "paypal_capture_failed", detail: String(e?.message || e) }, { status: 500 });
  }
}

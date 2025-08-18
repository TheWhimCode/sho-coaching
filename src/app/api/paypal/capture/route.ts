import { NextResponse } from "next/server";
import { paypalCaptureOrder } from "@/lib/paypal";
import { getBlockIds } from "@/lib/booking/block";
import { finalizeBooking } from "@/lib/booking/finalizeBooking";
import { prisma } from "@/lib/prisma";

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
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  try {
    const data = await paypalCaptureOrder(orderId);

    if (data.status !== "COMPLETED") {
      return NextResponse.json({ error: "not_completed", raw: data }, { status: 400 });
    }

    const pu = data.purchase_units?.[0];
    const customRaw = pu?.custom_id ? fromBase64Url(String(pu.custom_id)) : null;
    const c = customRaw ? JSON.parse(customRaw) as any : null;

    // Build meta for finalizeBooking (we recompute the block now)
    const meta: any = c
      ? {
          slotId: c.a,
          sessionType: c.t,
          liveMinutes: String(c.m),
          discord: c.d,
          inGame: String(!!c.g),
          followups: String(c.f),
        }
      : {};

    if (c?.a && c?.m) {
      const ids = await getBlockIds(String(c.a), Number(c.m), prisma);
      if (ids?.length) meta.slotIds = ids.join(",");
    }

    // Amount/currency from the capture
    const cap = pu?.payments?.captures?.[0];
    const amountCents =
      cap?.amount?.value ? Math.round(parseFloat(cap.amount.value) * 100) : undefined;
    const currency = cap?.amount?.currency_code?.toLowerCase() ?? "eur";

    // Persist booking + mark slots (idempotent)
    await finalizeBooking(meta, amountCents, currency, orderId, "paypal");

    // Email confirmation if we have an address + start time
    const email = data.payer?.email_address || pu?.payee?.email_address || undefined;
    if (email && c?.a) {
      const slot = await prisma.slot.findUnique({
        where: { id: String(c.a) },
        select: { startTime: true },
      });
      if (slot) {
        const { sendBookingEmail } = await import("@/lib/email");
        await sendBookingEmail(email, {
          title: meta.sessionType ?? "Coaching Session",
          startISO: slot.startTime.toISOString(),
          minutes: parseInt(meta.liveMinutes ?? "60", 10),
          followups: parseInt(meta.followups ?? "0", 10),
          priceEUR: amountCents ? Math.round(amountCents / 100) : c?.p ?? 0,
          bookingId: String(c.a),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PP_CAPTURE_FAIL", e?.message, e);
    return NextResponse.json(
      { error: "paypal_capture_failed", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}

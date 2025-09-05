import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";
import { sendBookingEmail } from "@/lib/email";

export type FinalizeMeta = {
  slotId?: string;
  slotIds?: string; // CSV
  sessionType?: string;
  liveMinutes?: string;
  followups?: string;
  discord?: string;
  notes?: string;
  email?: string;        // from checkout/stripe
  timeZone?: string;     // e.g. "Europe/Berlin"
  liveBlocks?: string;
  waiverAccepted?: string; // "true"/"false"
  waiverIp?: string;
};

export async function finalizeBooking(
  meta: FinalizeMeta,
  amountCents?: number,
  currency?: string,
  paymentRef?: string,
  provider: "stripe" | "paypal" = "stripe"
) {
  if (!paymentRef) throw new Error("paymentRef missing");

  const slotIds = (meta.slotIds ? meta.slotIds.split(",") : []).filter(Boolean);
  const firstSlotId = meta.slotId || slotIds[0];
  if (!firstSlotId) throw new Error("slotId missing");

  const sessionType = meta.sessionType ?? "Session";
  const liveMinutes = parseInt(meta.liveMinutes ?? "60", 10);
  const followups = parseInt(meta.followups ?? "0", 10);
  const liveBlocks = parseInt(meta.liveBlocks ?? "0", 10);
  const discord = meta.discord ?? "";
  const notes = meta.notes?.trim() || undefined;

  const waiverAccepted = meta.waiverAccepted === "true";
  const waiverIp = meta.waiverIp || undefined;

  // capture ISO string to avoid Date typing issues
  let scheduledStartISO: string | null = null;
  let processed = false;

  await prisma.$transaction(async (tx) => {
    // idempotency guard
    try {
      await tx.processedEvent.create({ data: { id: paymentRef } });
      processed = true;
    } catch {
      return; // already processed
    }

    // mark slots
    if (slotIds.length) {
      await tx.slot.updateMany({
        where: {
          id: { in: slotIds },
          status: { in: [SlotStatus.free, SlotStatus.blocked] },
        },
        data: { status: SlotStatus.taken, holdUntil: null, holdKey: null },
      });
    } else {
      await tx.slot.update({
        where: { id: firstSlotId },
        data: { status: SlotStatus.taken, holdUntil: null, holdKey: null },
      });
    }

    // snapshot schedule
    const startSlot = await tx.slot.findUnique({
      where: { id: firstSlotId },
      select: { startTime: true },
    });
    if (!startSlot) throw new Error("slot not found");

    scheduledStartISO = new Date(
      startSlot.startTime as unknown as Date
    ).toISOString();

    // upsert booking
    await tx.booking.upsert({
      where: { paymentRef },
      update: {
        status: "paid",
        amountCents,
        currency,
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        stripeSessionId: provider === "stripe" ? paymentRef : undefined,
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
        // new fields
        discord,
        notes,
        liveBlocks,
        customerEmail: meta.email ?? undefined,
        waiverAccepted,
        waiverAcceptedAt: waiverAccepted ? new Date() : undefined,
        waiverIp,
      },
      create: {
        sessionType,
        status: "paid",
        slot: { connect: { id: firstSlotId } },
        liveMinutes,
        followups,
        liveBlocks,
        discord,
        notes,
        amountCents,
        currency: (currency ?? "eur").toLowerCase(),
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        paymentRef,
        stripeSessionId: provider === "stripe" ? paymentRef : undefined,
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
        customerEmail: meta.email ?? undefined,
        waiverAccepted,
        waiverAcceptedAt: waiverAccepted ? new Date() : undefined,
        waiverIp,
      },
    });
  });

  if (!processed) return;

  // email (best-effort)
  if (meta.email && scheduledStartISO) {
    try {
      await sendBookingEmail(meta.email, {
        title: sessionType,
        startISO: scheduledStartISO, // already ISO string
        minutes: liveMinutes,
        followups,
        priceEUR: (amountCents ?? 0) / 100,
        bookingId: paymentRef,
        timeZone: meta.timeZone,
      });
    } catch (e) {
      console.error("sendBookingEmail failed:", e);
    }
  }
}

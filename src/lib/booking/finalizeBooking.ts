import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";
import { getPreset } from "@/lib/sessions/preset";

export type FinalizeMeta = {
  bookingId?: string;   // ← NEW: prefer this
  slotId?: string;
  slotIds?: string;
  sessionType?: string;
  liveMinutes?: string;
  followups?: string;
  // legacy carry-overs (ignored now for persistence)
  discord?: string;
  notes?: string;
  email?: string;
  timeZone?: string;
  liveBlocks?: string;
  waiverAccepted?: string;
  waiverIp?: string;
};

function titleFromPreset(baseMinutes: number, followups: number, liveBlocks: number): string {
  const preset = getPreset(baseMinutes, followups, liveBlocks);
  switch (preset) {
    case "vod":
      return "VOD Review";
    case "instant":
      return "Instant Insight";
    case "signature":
      return "Signature Session";
    default:
      return "Custom Session";
  }
}

export async function finalizeBooking(
  meta: FinalizeMeta,
  amountCents?: number,
  currency?: string,
  paymentRef?: string,
  provider: "stripe" | "paypal" = "stripe"
) {
  if (!paymentRef) throw new Error("paymentRef missing");

  // ---- Identify the booking (prefer bookingId) ----
  let booking =
    (meta.bookingId && (await prisma.booking.findUnique({ where: { id: meta.bookingId } }))) ||
    (meta.slotId && (await prisma.booking.findFirst({ where: { slotId: meta.slotId } }))) ||
    null;

  if (!booking && meta.slotIds) {
    const first = meta.slotIds.split(",").filter(Boolean)[0];
    if (first) booking = await prisma.booking.findFirst({ where: { slotId: first } });
  }
  if (!booking) throw new Error("booking not found");

  // ---- Derive scheduling + titles (mostly from existing booking; fall back to meta if needed) ----
  const liveBlocks = Number.isFinite(Number(meta.liveBlocks)) ? parseInt(meta.liveBlocks!, 10) : booking.liveBlocks ?? 0;
  const liveMinutes = Number.isFinite(Number(meta.liveMinutes))
    ? parseInt(meta.liveMinutes!, 10)
    : booking.liveMinutes;
  const followups = Number.isFinite(Number(meta.followups))
    ? parseInt(meta.followups!, 10)
    : booking.followups ?? 0;

  const baseMinutes = Math.max(30, liveMinutes - liveBlocks * 45);
  const providedTitle = (meta.sessionType ?? "").trim();
  const computedTitle = titleFromPreset(baseMinutes, followups, liveBlocks);
  const sessionType = providedTitle || booking.sessionType || computedTitle;

  // Slot IDs to mark as taken
  const slotIdsCsv = (meta.slotIds ?? booking.blockCsv ?? "").trim();
  const slotIds = slotIdsCsv ? slotIdsCsv.split(",").filter(Boolean) : [];
  const firstSlotId = booking.slotId || slotIds[0];
  if (!firstSlotId) throw new Error("slotId missing");

  // Email snapshot: keep existing, or accept meta.email if DB is empty
  const customerEmail = booking.customerEmail || meta.email || undefined;

  // Waiver: keep what DB has; if meta says true and DB was false, mark accepted now
  const waiverAccepted =
    booking.waiverAccepted || meta.waiverAccepted === "true" ? true : false;
  const waiverAcceptedAt =
    waiverAccepted && !booking.waiverAccepted ? new Date() : booking.waiverAcceptedAt || undefined;
  const waiverIp = booking.waiverIp || (meta.waiverIp || undefined);

  // Idempotency (optional; you already guard event IDs in webhook)
  let processed = false;
  await prisma.$transaction(async (tx) => {
    try {
      await tx.processedEvent.create({ data: { id: paymentRef } });
      processed = true;
    } catch {
      // duplicate -> exit quietly
      return;
    }

    // Mark slots as taken
    if (slotIds.length) {
      await tx.slot.updateMany({
        where: { id: { in: slotIds }, status: { in: [SlotStatus.free, SlotStatus.blocked] } },
        data: { status: SlotStatus.taken, holdUntil: null, holdKey: null },
      });
    } else {
      await tx.slot.update({
        where: { id: firstSlotId },
        data: { status: SlotStatus.taken, holdUntil: null, holdKey: null },
      });
    }

    // Snapshot start time (from slot)
    const startSlot = await tx.slot.findUnique({
      where: { id: firstSlotId },
      select: { startTime: true },
    });
    if (!startSlot) throw new Error("slot not found");

    // IMPORTANT: update the **existing** booking (no upsert creating a duplicate)
    await tx.booking.update({
      where: { id: booking!.id },
      data: {
        sessionType,
        status: "paid",
        amountCents: amountCents ?? booking!.amountCents ?? undefined,
        currency: (currency ?? booking!.currency ?? "eur").toLowerCase(),
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        paymentRef, // unique field now set on the existing row
        stripeSessionId: provider === "stripe" ? paymentRef : booking!.stripeSessionId ?? undefined,
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
        // Keep discord/notes already stored at create time
        liveBlocks,
        customerEmail,
        waiverAccepted,
        waiverAcceptedAt,
        waiverIp,
      },
    });
  });

  if (!processed) return;
}

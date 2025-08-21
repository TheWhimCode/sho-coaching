import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

export type FinalizeMeta = {
  slotId?: string;
  slotIds?: string; // CSV
  sessionType?: string;
  liveMinutes?: string;
  discord?: string;
  inGame?: string;
  followups?: string;
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
  const discord = meta.discord ?? "";
  const inGame = meta.inGame === "true";
  const followups = parseInt(meta.followups ?? "0", 10);

  await prisma.$transaction(async (tx) => {
    // Idempotency guard
    try {
      await tx.processedEvent.create({ data: { id: paymentRef } });
    } catch {
      return; // already processed
    }

    // Reserve/mark taken + clear hold
    if (slotIds.length) {
      await tx.slot.updateMany({
        where: { id: { in: slotIds } },
        data: { status: SlotStatus.taken, holdUntil: null, holdKey: null },
      });
    } else {
      await tx.slot.update({
        where: { id: firstSlotId },
        data: { status: SlotStatus.taken, holdUntil: null, holdKey: null },
      });
    }

    // Snapshot schedule into Booking
    const startSlot = await tx.slot.findUnique({
      where: { id: firstSlotId },
      select: { startTime: true },
    });
    if (!startSlot) throw new Error("slot not found");

    await tx.booking.upsert({
      where: { slotId: firstSlotId },
      update: {
        status: "paid",
        amountCents,
        currency,
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        paymentRef,
        stripeSessionId: provider === "stripe" ? paymentRef : undefined,
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
      },
      create: {
        sessionType,
        status: "paid",
        slotId: firstSlotId,
        liveMinutes,
        inGame,
        followups,
        discord,
        amountCents,
        currency: currency ?? "eur",
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        paymentRef,
        stripeSessionId: provider === "stripe" ? paymentRef : undefined,
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
      },
    });
  });
}

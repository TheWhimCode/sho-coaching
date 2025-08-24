import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

export type FinalizeMeta = {
  slotId?: string;
  slotIds?: string; // CSV
  sessionType?: string;
  liveMinutes?: string;
  discord?: string;
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
  const followups = parseInt(meta.followups ?? "0", 10);

  await prisma.$transaction(async (tx) => {
    // Idempotency guard
    try {
      await tx.processedEvent.create({ data: { id: paymentRef } });
    } catch {
      return; // already processed
    }

    // Mark slots taken + clear holds
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

    // Snapshot schedule
    const startSlot = await tx.slot.findUnique({
      where: { id: firstSlotId },
      select: { startTime: true },
    });
    if (!startSlot) throw new Error("slot not found");

    // ✅ Upsert by paymentRef (unique) and connect the slot relation
    await tx.booking.upsert({
      where: { paymentRef }, // idempotent key
      update: {
        status: "paid",
        amountCents,
        currency,
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        stripeSessionId: provider === "stripe" ? paymentRef : undefined,
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
      },
      create: {
        sessionType,
        status: "paid",
        // 🔽 connect relation instead of slotId scalar
        slot: { connect: { id: firstSlotId } },
        liveMinutes,
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

import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";
import { getPreset } from "@/lib/sessions/preset";

export type FinalizeMeta = {
  slotId?: string;
  slotIds?: string;
  sessionType?: string;
  liveMinutes?: string;
  followups?: string;
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

  const slotIds = (meta.slotIds ? meta.slotIds.split(",") : []).filter(Boolean);
  const firstSlotId = meta.slotId || slotIds[0];
  if (!firstSlotId) throw new Error("slotId missing");

  const liveMinutes = parseInt(meta.liveMinutes ?? "60", 10);
  const followups = parseInt(meta.followups ?? "0", 10);
  const liveBlocks = parseInt(meta.liveBlocks ?? "0", 10);
  const baseMinutes = Math.max(30, liveMinutes - liveBlocks * 45);

  const providedTitle = (meta.sessionType ?? "").trim();
  const computedTitle = titleFromPreset(baseMinutes, followups, liveBlocks);
  const sessionType = providedTitle || computedTitle; // ← trust client when provided

  const discord = meta.discord ?? "";
  const notes = meta.notes?.trim() || undefined;

  const waiverAccepted = meta.waiverAccepted === "true";
  const waiverIp = meta.waiverIp || undefined;

  let processed = false;

  await prisma.$transaction(async (tx) => {
    try {
      await tx.processedEvent.create({ data: { id: paymentRef } });
      processed = true;
    } catch {
      return;
    }

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

    const startSlot = await tx.slot.findUnique({
      where: { id: firstSlotId },
      select: { startTime: true },
    });
    if (!startSlot) throw new Error("slot not found");

    await tx.booking.upsert({
      where: { paymentRef },
      update: {
        sessionType,
        status: "paid",
        amountCents,
        currency,
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        stripeSessionId: provider === "stripe" ? paymentRef : undefined,
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
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
}

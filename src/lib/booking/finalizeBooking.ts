import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";
import { getPreset } from "@/lib/sessions/preset";

export type FinalizeMeta = {
  bookingId?: string;
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

  stripeSessionId?: string;
};

function titleFromPreset(baseMinutes: number, followups: number, liveBlocks: number): string {
  const preset = getPreset(baseMinutes, followups, liveBlocks);
  switch (preset) {
    case "vod": return "VOD Review";
    case "instant": return "Instant Insight";
    case "signature": return "Signature Session";
    default: return "Custom Session";
  }
}

/**
 * Finalizes a Session after payment:
 *  - Marks slots as taken
 *  - Links/reuses/creates a Student
 *  - Updates the Session row to "paid" (same tx) with amounts/currency/ref/schedule + studentId
 *  - Ensures a SessionDoc exists
 */
export async function finalizeBooking(
  meta: FinalizeMeta,
  amountCents?: number,
  currency?: string,
  paymentRef?: string,
  provider: "stripe" | "paypal" = "stripe"
) {
  if (!paymentRef) throw new Error("paymentRef missing");

  // 1) Locate the Session
  let sessionRow =
    (meta.bookingId && (await prisma.session.findUnique({ where: { id: meta.bookingId } }))) ||
    (meta.slotId && (await prisma.session.findFirst({ where: { slotId: meta.slotId } }))) ||
    null;

  if (!sessionRow && meta.slotIds) {
    const first = meta.slotIds.split(",").filter(Boolean)[0];
    if (first) sessionRow = await prisma.session.findFirst({ where: { slotId: first } });
  }
  if (!sessionRow) throw new Error("booking not found");

  // 2) Derive details
  const liveBlocks =
    Number.isFinite(Number(meta.liveBlocks)) ? parseInt(meta.liveBlocks!, 10) : (sessionRow.liveBlocks ?? 0);
  const liveMinutes =
    Number.isFinite(Number(meta.liveMinutes)) ? parseInt(meta.liveMinutes!, 10) : sessionRow.liveMinutes;
  const followups =
    Number.isFinite(Number(meta.followups)) ? parseInt(meta.followups!, 10) : (sessionRow.followups ?? 0);

  const baseMinutes = Math.max(30, liveMinutes - liveBlocks * 45);
  const providedTitle = (meta.sessionType ?? "").trim();
  const computedTitle = titleFromPreset(baseMinutes, followups, liveBlocks);
  const sessionType = providedTitle || sessionRow.sessionType || computedTitle;

  const slotIdsCsv = (meta.slotIds ?? sessionRow.blockCsv ?? "").trim();
  const slotIds = slotIdsCsv ? slotIdsCsv.split(",").filter(Boolean) : [];
  const firstSlotId = sessionRow.slotId || slotIds[0];
  if (!firstSlotId) throw new Error("slotId missing");

  const customerEmail = sessionRow.customerEmail || meta.email || undefined;

  const waiverAccepted = sessionRow.waiverAccepted || meta.waiverAccepted === "true" ? true : false;
  const waiverAcceptedAt =
    waiverAccepted && !sessionRow.waiverAccepted ? new Date() : sessionRow.waiverAcceptedAt || undefined;
  const waiverIp = sessionRow.waiverIp || (meta.waiverIp || undefined);

  const normDiscord = (s?: string | null) => (s ?? "").trim();
  const normRiot = (s?: string | null) => {
    const v = (s ?? "").trim();
    const m = v.match(/^([^#]+)#(.+)$/);
    return m ? `${m[1].trim()}#${m[2].trim()}` : v;
  };
  const discordKey = normDiscord(meta.discord ?? sessionRow.discord);
  const riotKey = normRiot(sessionRow.riotTag);
  const emailKey = (customerEmail ?? "").trim().toLowerCase();
  const ipKey = (waiverIp ?? "").trim();

  // 3) Atomic: link/create Student, take slots, finalize session to "paid"
  await prisma.$transaction(async (tx) => {
    // 3.1 take slots
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

    // 3.2 anchor start time
    const startSlot = await tx.slot.findUnique({
      where: { id: firstSlotId },
      select: { startTime: true },
    });
    if (!startSlot) throw new Error("slot not found");

    // 3.3 find/create student BEFORE marking paid
    let student =
      (discordKey ? await tx.student.findUnique({ where: { discord: discordKey } }) : null) ||
      (riotKey ? await tx.student.findFirst({ where: { riotTag: riotKey } }) : null);

    if (!student && emailKey) {
      const priorByEmail = await tx.session.findFirst({
        where: { customerEmail: emailKey, studentId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { studentId: true },
      });
      if (priorByEmail?.studentId) {
        student = await tx.student.findUnique({ where: { id: priorByEmail.studentId } });
      }
    }
    if (!student && ipKey) {
      const priorByIp = await tx.session.findFirst({
        where: { waiverIp: ipKey, studentId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { studentId: true },
      });
      if (priorByIp?.studentId) {
        student = await tx.student.findUnique({ where: { id: priorByIp.studentId } });
      }
    }

    if (!student) {
      const fallbackBase =
        discordKey || riotKey || (emailKey ? emailKey.split("@")[0] : "") || `Student ${new Date().toISOString().slice(0, 10)}`;
      let name = fallbackBase;
      for (let i = 0; i < 5; i++) {
        try {
          student = await tx.student.create({
            data: { name, discord: discordKey || null, riotTag: riotKey || null },
          });
          break;
        } catch (e: any) {
          if (e?.code === "P2002") { name = `${fallbackBase}-${Math.floor(Math.random() * 1000)}`; continue; }
          throw e;
        }
      }
      if (!student) throw new Error("failed to create student");
    }

    // 3.4 finalize session (studentId + paid in one update)
    await tx.session.update({
      where: { id: sessionRow.id },
      data: {
        studentId: student.id,
        sessionType,
        status: "paid",
        amountCents: amountCents ?? sessionRow.amountCents ?? undefined,
        currency: (currency ?? sessionRow.currency ?? "eur").toLowerCase(),
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        paymentRef,
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
        liveBlocks,
        customerEmail,
        waiverAccepted,
        waiverAcceptedAt,
        waiverIp,
      },
    });

    // 3.5 ensure SessionDoc
    try {
      const already = await tx.sessionDoc.findFirst({ where: { sessionId: sessionRow.id }, select: { id: true } });
      if (!already) {
        const last = await tx.sessionDoc.findFirst({
          where: { studentId: student.id },
          orderBy: { number: "desc" },
          select: { number: true },
        });
        const nextNumber = (last?.number ?? 0) + 1;
        await tx.sessionDoc.create({
          data: {
            studentId: student.id,
            sessionId: sessionRow.id,
            number: nextNumber,
            notes: { title: sessionType, md: "" },
          },
        });
      }
    } catch {
      // ignore doc errors; session is already finalized
    }
  });
}

import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";
import { getPreset } from "@/lib/sessions/preset";

export type FinalizeMeta = {
  bookingId?: string;     // preferred identifier (Session.id)
  slotId?: string;        // anchor slot id
  slotIds?: string;       // comma-separated ids for the full block
  sessionType?: string;   // optional title override
  liveMinutes?: string;   // minutes as string
  followups?: string;     // number of follow-ups as string

  // auxiliary (not primary source of truth)
  discord?: string;
  notes?: string;
  email?: string;
  timeZone?: string;
  liveBlocks?: string;
  waiverAccepted?: string;
  waiverIp?: string;

  // kept only for compatibility (not persisted if the column doesn't exist)
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
 *  - Updates the Session row to "paid" with amounts/currency/ref/schedule
 *  - Links/reuses/creates a Student
 *  - Creates a SessionDoc (1:1 with session) titled from sessionType
 */
export async function finalizeBooking(
  meta: FinalizeMeta,
  amountCents?: number,
  currency?: string,
  paymentRef?: string,                        // e.g. Stripe PI id
  provider: "stripe" | "paypal" = "stripe"
) {
  if (!paymentRef) throw new Error("paymentRef missing");

  // ---- 1) Locate the Session row (prefer bookingId) ----
  let sessionRow =
    (meta.bookingId && (await prisma.session.findUnique({ where: { id: meta.bookingId } }))) ||
    (meta.slotId && (await prisma.session.findFirst({ where: { slotId: meta.slotId } }))) ||
    null;

  if (!sessionRow && meta.slotIds) {
    const first = meta.slotIds.split(",").filter(Boolean)[0];
    if (first) sessionRow = await prisma.session.findFirst({ where: { slotId: first } });
  }
  if (!sessionRow) throw new Error("booking not found");

  // ---- 2) Derive details from meta/row ----
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

  // Slots to mark as taken
  const slotIdsCsv = (meta.slotIds ?? sessionRow.blockCsv ?? "").trim();
  const slotIds = slotIdsCsv ? slotIdsCsv.split(",").filter(Boolean) : [];
  const firstSlotId = sessionRow.slotId || slotIds[0];
  if (!firstSlotId) throw new Error("slotId missing");

  // Email snapshot: keep existing, or accept meta.email if DB is empty
  const customerEmail = sessionRow.customerEmail || meta.email || undefined;

  // Waiver: keep DB; if meta says true and DB was false, mark accepted now
  const waiverAccepted = sessionRow.waiverAccepted || meta.waiverAccepted === "true" ? true : false;
  const waiverAcceptedAt =
    waiverAccepted && !sessionRow.waiverAccepted ? new Date() : sessionRow.waiverAcceptedAt || undefined;
  const waiverIp = sessionRow.waiverIp || (meta.waiverIp || undefined);

  // ---- 3) Atomic: mark slots taken & finalize the session ----
  await prisma.$transaction(async (tx) => {
    // Mark slots taken
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

    // Snapshot start time from the anchor slot
    const startSlot = await tx.slot.findUnique({
      where: { id: firstSlotId },
      select: { startTime: true },
    });
    if (!startSlot) throw new Error("slot not found");

    // Update Session
    await tx.session.update({
      where: { id: sessionRow!.id },
      data: {
        sessionType,
        status: "paid",
        amountCents: amountCents ?? sessionRow!.amountCents ?? undefined,
        currency: (currency ?? sessionRow!.currency ?? "eur").toLowerCase(),
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        paymentRef, // unique
        // DO NOT write stripeSessionId if you dropped that column
        scheduledStart: startSlot.startTime,
        scheduledMinutes: liveMinutes,
        liveBlocks,
        customerEmail,
        waiverAccepted,
        waiverAcceptedAt,
        waiverIp,
      },
    });
  });

  // ---- 4) Link/create Student + create SessionDoc (non-fatal if it fails) ----
  try {
    const paid = await prisma.session.findUnique({
      where: { id: sessionRow.id },
      select: {
        id: true,
        discord: true,
        riotTag: true,
        customerEmail: true,
        waiverIp: true,
        studentId: true,
        createdAt: true,
        sessionType: true,
      },
    });
    if (!paid) throw new Error("session vanished after payment");

    // Normalize keys for matching
    const normDiscord = (s?: string | null) => (s ?? "").trim();
    const normRiot = (s?: string | null) => {
      const v = (s ?? "").trim();
      const m = v.match(/^([^#]+)#(.+)$/);
      return m ? `${m[1].trim()}#${m[2].trim()}` : v;
    };

    const discordKey = normDiscord(paid.discord);
    const riotKey = normRiot(paid.riotTag);
    const emailKey = (paid.customerEmail ?? "").trim().toLowerCase();
    const ipKey = (paid.waiverIp ?? "").trim();

    // 4.1 Try strong matches on Student
    let student =
      (discordKey ? await prisma.student.findUnique({ where: { discord: discordKey } }) : null) ||
      (riotKey ? await prisma.student.findFirst({ where: { riotTag: riotKey } }) : null);

    // 4.2 Reuse prior sessions by email/IP (already linked to a student)
    if (!student && emailKey) {
      const priorByEmail = await prisma.session.findFirst({
        where: { customerEmail: emailKey, studentId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { studentId: true },
      });
      if (priorByEmail?.studentId) {
        student = await prisma.student.findUnique({ where: { id: priorByEmail.studentId } });
      }
    }
    if (!student && ipKey) {
      const priorByIp = await prisma.session.findFirst({
        where: { waiverIp: ipKey, studentId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { studentId: true },
      });
      if (priorByIp?.studentId) {
        student = await prisma.student.findUnique({ where: { id: priorByIp.studentId } });
      }
    }

    // 4.3 Create new student if still none
    if (!student) {
      const fallbackName =
        discordKey ||
        riotKey ||
        (emailKey ? emailKey.split("@")[0] : "") ||
        `Student ${new Date().toISOString().slice(0, 10)}`;

      let name = fallbackName;
      for (let i = 0; i < 5; i++) {
        try {
          student = await prisma.student.create({
            data: { name, discord: discordKey || null, riotTag: riotKey || null },
          });
          break;
        } catch (e: any) {
          if (e?.code === "P2002") {
            name = `${fallbackName}-${Math.floor(Math.random() * 1000)}`;
            continue;
          }
          throw e;
        }
      }
      if (!student) throw new Error("failed to create student");
    }

    // 4.4 Link the session to this student
    await prisma.session.update({
      where: { id: paid.id },
      data: { studentId: student.id },
    });

    // 4.5 Create a SessionDoc if not linked yet (1:1 by sessionId)
    const already = await prisma.sessionDoc.findFirst({
      where: { sessionId: paid.id },
      select: { id: true },
    });

    if (!already) {
      const last = await prisma.sessionDoc.findFirst({
        where: { studentId: student.id },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      const nextNumber = (last?.number ?? 0) + 1;

      await prisma.sessionDoc.create({
        data: {
          studentId: student.id,
          sessionId: paid.id,                       // <-- tie directly to this session
          number: nextNumber,
          notes: { title: paid.sessionType, md: "" } // <-- title from sessionType
        },
      });
    }
  } catch (e) {
    console.warn("[finalizeBooking] student/doc linking failed:", e);
  }
}

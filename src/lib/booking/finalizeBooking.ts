// src/lib/booking/finalizeBooking.ts
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import { SlotStatus } from "@prisma/client";
import { getPreset } from "@/lib/sessions/preset";
import { Prisma as P } from '@prisma/client';

export type FinalizeMeta = {
  bookingId?: string;
  slotId?: string;
  slotIds?: string;

  sessionType?: string;
  liveMinutes?: string;
  followups?: string;
  liveBlocks?: string;

  // optional passthrough (usually the session already has it)
  riotTag?: string;

  // echoes (normally already stored on Session via /booking/update-waiver)
  waiverAccepted?: string; // "true" | "false"
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

function isP2002(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as any).code === "P2002";
}

// ---- Student resolution (canonical) -----------------------------------------

async function resolveCanonicalStudent(
  tx: Prisma.TransactionClient,
  args: { discordId?: string | null; discordName?: string | null; riotTag: string }
) {
  const { discordId, discordName, riotTag } = args;

  // 1) find by discordId (immutable) or riotTag
  let student =
    (discordId ? await tx.student.findUnique({ where: { discordId } }) : null) ??
    (await tx.student.findUnique({ where: { riotTag } }));

  // 2) create if none
  if (!student) {
    const baseName = riotTag || "Student";
    let name = baseName;
    for (let i = 0; i < 5; i++) {
      try {
        student = await tx.student.create({
          data: {
            name,
            riotTag: riotTag || null,
            discordId: discordId ?? null,
            discordName: discordName ?? null,
          },
        });
        break;
      } catch (e) {
        if (isP2002(e)) {
          name = `${baseName}-${Math.floor(Math.random() * 1000)}`;
          continue;
        }
        throw e;
      }
    }
    if (!student) throw new Error("failed_to_create_student");
  }

  // 3) force latest identity fields
  // 3a) discordId (unique)
  if (discordId && discordId !== student.discordId) {
    try {
      student = await tx.student.update({ where: { id: student.id }, data: { discordId } });
    } catch (e) {
      if (!isP2002(e)) throw e;
      const conflict = await tx.student.findUnique({ where: { discordId } });
      if (conflict && conflict.id !== student.id) {
        await tx.student.update({ where: { id: conflict.id }, data: { discordId: null } });
      }
      student = await tx.student.update({ where: { id: student.id }, data: { discordId } });
    }
  }

  // 3b) discordName (not unique)
  if (discordName && discordName !== student.discordName) {
    student = await tx.student.update({ where: { id: student.id }, data: { discordName } });
  }

  // 3c) riotTag (unique)
  if (riotTag && riotTag !== student.riotTag) {
    try {
      student = await tx.student.update({ where: { id: student.id }, data: { riotTag } });
    } catch (e) {
      if (!isP2002(e)) throw e;
      const conflict = await tx.student.findUnique({ where: { riotTag } });
      if (conflict && conflict.id !== student.id) {
        await tx.student.update({ where: { id: conflict.id }, data: { riotTag: null } });
      }
      student = await tx.student.update({ where: { id: student.id }, data: { riotTag } });
    }
  }

  return student;
}

// ---- Main finalize ----------------------------------------------------------

export async function finalizeBooking(
  meta: FinalizeMeta,
  amountCents?: number,
  currency?: string,
  paymentRef?: string,
  provider: string = "stripe"
) {
  if (!paymentRef) throw new Error("paymentRef missing");

  const sessionSelect = {
    id: true,
    status: true,
    sessionType: true,
    slotId: true,
    liveMinutes: true,
    followups: true,
    liveBlocks: true,
    riotTag: true,
    discordId: true,
    discordName: true,
    waiverAccepted: true,
    waiverAcceptedAt: true,
    waiverIp: true,
    blockCsv: true,
    currency: true,
    amountCents: true,
  } as const;

  let sessionRow =
    (meta.bookingId &&
      (await prisma.session.findUnique({ where: { id: meta.bookingId }, select: sessionSelect }))) ||
    (meta.slotId &&
      (await prisma.session.findFirst({ where: { slotId: meta.slotId }, select: sessionSelect }))) ||
    null;

  if (!sessionRow && meta.slotIds) {
    const first = meta.slotIds.split(",").filter(Boolean)[0];
    if (first) {
      sessionRow = await prisma.session.findFirst({ where: { slotId: first }, select: sessionSelect });
    }
  }
  if (!sessionRow) throw new Error("booking not found");

  if (sessionRow.status === "paid") {
    return;
  }

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

  const riotTag = (meta.riotTag ?? sessionRow.riotTag ?? "").trim();
  if (!riotTag) throw new Error("riotTag missing on session");
  const discordId = sessionRow.discordId ?? null;
  const discordName = sessionRow.discordName ?? null;

  const waiverAccepted = sessionRow.waiverAccepted || meta.waiverAccepted === "true" ? true : false;
  const waiverAcceptedAt =
    waiverAccepted && !sessionRow.waiverAccepted ? new Date() : sessionRow.waiverAcceptedAt || undefined;
  const waiverIp = sessionRow.waiverIp || (meta.waiverIp || undefined);

  await prisma.$transaction(async (tx) => {
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

    const student = await resolveCanonicalStudent(tx, { discordId, discordName, riotTag });

    const sessionId = sessionRow.id;
    const currencyLower = (currency ?? sessionRow.currency ?? "eur").toLowerCase();
    const blockCsv = slotIds.join(",");

    await tx.$executeRaw(PrismaNS.sql`
      UPDATE "public"."Session"
      SET
        "studentId" = ${student.id},
        "sessionType" = ${sessionType},
        "status" = 'paid',
        "amountCents" = ${amountCents ?? sessionRow.amountCents ?? null},
        "currency" = ${currencyLower},
        "blockCsv" = ${blockCsv},
        "paymentProvider" = ${provider},
        "paymentRef" = ${paymentRef},
        "scheduledStart" = ${startSlot.startTime},
        "scheduledMinutes" = ${liveMinutes},
        "liveBlocks" = ${liveBlocks},
        "waiverAccepted" = ${waiverAccepted},
        "waiverAcceptedAt" = ${waiverAcceptedAt ?? null},
        "waiverIp" = ${waiverIp ?? null}
      WHERE "id" = ${sessionId}
    `);

    const exists = await tx.sessionDoc.findFirst({
      where: { sessionId: sessionRow.id },
      select: { id: true },
    });
    if (!exists) {
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
  });
}

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getPreset } from "@/engine/session/rules/preset";

export type FinalizeMeta = {
  bookingId?: string;
  slotId?: string;
  slotIds?: string;

  sessionType?: string;
  liveMinutes?: string;
  followups?: string;
  liveBlocks?: string;

  riotTag?: string;
  waiverAccepted?: string;
  waiverIp?: string;
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

function isP2002(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as any).code === "P2002";
}

async function resolveCanonicalStudent(
  tx: Prisma.TransactionClient,
  args: { discordId?: string | null; discordName?: string | null; riotTag: string }
) {
  const { discordId, discordName, riotTag } = args;

  let student =
    (discordId ? await tx.student.findUnique({ where: { discordId } }) : null) ??
    (await tx.student.findUnique({ where: { riotTag } }));

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

  if (discordName && discordName !== student.discordName)
    student = await tx.student.update({ where: { id: student.id }, data: { discordName } });

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
    couponCode: true,
    couponDiscount: true,
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

  if (sessionRow.status === "paid") return;

  const liveBlocks =
    Number.isFinite(Number(meta.liveBlocks)) ? parseInt(meta.liveBlocks!, 10) : (sessionRow.liveBlocks ?? 0);
  const liveMinutes =
    Number.isFinite(Number(meta.liveMinutes)) ? parseInt(meta.liveMinutes!, 10) : sessionRow.liveMinutes;
  const followups =
    Number.isFinite(Number(meta.followups)) ? parseInt(meta.followups!, 10) : (sessionRow.followups ?? 0);

  const baseMinutes = Math.max(30, liveMinutes - liveBlocks * 45);
  const providedTitle = (meta.sessionType ?? "").trim();
  const sessionType = providedTitle || sessionRow.sessionType || titleFromPreset(baseMinutes, followups, liveBlocks);

  const slotIdsCsv = (meta.slotIds ?? sessionRow.blockCsv ?? "").trim();
  const slotIds = slotIdsCsv ? slotIdsCsv.split(",").filter(Boolean) : [];
  const firstSlotId = sessionRow.slotId || slotIds[0];
  if (!firstSlotId) throw new Error("slotId missing");

  const riotTag = (meta.riotTag ?? sessionRow.riotTag ?? "").trim();
  if (!riotTag) throw new Error("riotTag missing on session");
  const discordId = sessionRow.discordId ?? null;
  const discordName = sessionRow.discordName ?? null;

  const incomingWaiver = meta.waiverAccepted === "true";
  const waiverAccepted = sessionRow.waiverAccepted || incomingWaiver;
  const waiverAcceptedAt =
    waiverAccepted && !sessionRow.waiverAccepted ? new Date() : sessionRow.waiverAcceptedAt || undefined;
  const waiverIp = sessionRow.waiverIp || (meta.waiverIp || undefined);

  await prisma.$transaction(async (tx) => {

    const student = await resolveCanonicalStudent(tx, { discordId, discordName, riotTag });

    await tx.session.update({
      where: { id: sessionRow.id },
      data: {
        studentId: student.id,
        sessionType,
        status: "paid",
        amountCents: amountCents ?? sessionRow.amountCents ?? null,
        currency: (currency ?? sessionRow.currency ?? "eur").toLowerCase(),
        blockCsv: slotIds.join(","),
        paymentProvider: provider,
        paymentRef,
        scheduledStart: (await tx.slot.findUnique({ where: { id: firstSlotId }, select: { startTime: true } }))!.startTime,
        scheduledMinutes: liveMinutes,
        liveBlocks,
        waiverAccepted,
        waiverAcceptedAt: waiverAcceptedAt ?? null,
        waiverIp: waiverIp ?? null,
      },
    });

    // -------------------------------------------------------------
    // COUPON LOGIC
    // -------------------------------------------------------------
    if (sessionRow.couponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: sessionRow.couponCode },
      });

      if (coupon) {
        if (coupon.studentId === student.id) {
          await tx.coupon.update({
            where: { code: coupon.code },
            data: {
              value: 5,
              code: `${student.name}Diff`,
            },
          });
        } else {
          await tx.coupon.update({
            where: { code: coupon.code },
            data: {
              value: coupon.value + 5,
              code: coupon.code + "+",
            },
          });

          const existing = await tx.coupon.findFirst({
            where: { studentId: student.id },
          });

          if (!existing) {
            await tx.coupon.create({
              data: {
                code: `${student.name}Diff`,
                studentId: student.id,
                value: 5,
              },
            });
          }
        }
      }
    } else {
      // ⭐ NEW: student paid without coupon → create one if not owned already
      const existing = await tx.coupon.findFirst({
        where: { studentId: student.id },
      });

      if (!existing) {
        await tx.coupon.create({
          data: {
            code: `${student.name}Diff`,
            studentId: student.id,
            value: 5,
          },
        });
      }
    }

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

import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

export async function findSlotById(id: string, tx = prisma) {
  return tx.slot.findUnique({ where: { id } });
}

/**
 * All slot start times in [rangeStart, rangeEnd) that block availability:
 * taken, blocked, or free-but-held-by-other (holdUntil > now and holdKey != ourKey).
 * Used to validate many candidates in memory instead of one query per candidate.
 */
export async function findBusyStartTimesInRange(
  rangeStart: Date,
  rangeEnd: Date,
  now: Date,
  opts: { holdKey?: string | null },
  tx = prisma
) {
  const rows = await tx.slot.findMany({
    where: {
      startTime: { gte: rangeStart, lt: rangeEnd },
      OR: [
        { status: SlotStatus.taken },
        { status: SlotStatus.blocked },
        {
          status: SlotStatus.free,
          holdUntil: { gt: now },
          ...(opts.holdKey?.trim()
            ? { NOT: { holdKey: opts.holdKey.trim() } }
            : {}),
        },
      ],
    },
    select: { startTime: true },
    orderBy: { startTime: "asc" },
  });
  return rows.map((r) => r.startTime);
}

export async function findBusySlotsForDay(dayStart: Date, dayEnd: Date, now: Date, tx = prisma) {
  return tx.slot.findMany({
    where: {
      startTime: { gte: dayStart, lt: dayEnd },
      OR: [
        { status: SlotStatus.taken },
        { status: SlotStatus.blocked },
        { AND: [{ status: SlotStatus.free }, { holdUntil: { gt: now } }] },
      ],
    },
    orderBy: { startTime: "asc" },
    select: { startTime: true },
  });
}

export async function findFreeBlock(
  windowStart: Date,
  windowEnd: Date,
  now: Date,
  holdKey?: string,
  tx = prisma
) {
  return tx.slot.findMany({
    where: {
      startTime: { gte: windowStart, lt: windowEnd },
      status: SlotStatus.free,
      OR: [
        { holdUntil: null },
        { holdUntil: { lt: now } },
        ...(holdKey ? [{ holdKey }] as any : []),
      ],
    },
    orderBy: { startTime: "asc" },
  });
}

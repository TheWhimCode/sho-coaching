import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

export async function findSlotById(id: string, tx = prisma) {
  return tx.slot.findUnique({ where: { id } });
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

// src/lib/booking/block.ts
import { prisma } from "@/lib/prisma";
import { CFG_SERVER } from "@/lib/config.server";

export const SLOT_SIZE_MIN = 15;

export function addMin(d: Date, m: number) {
  return new Date(d.getTime() + m * 60_000);
}

export function ceilDiv(a: number, b: number) {
  return Math.floor((a + b - 1) / b);
}

export async function getBlockIds(startSlotId: string, liveMinutes: number, tx = prisma) {
  const start = await tx.slot.findUnique({ where: { id: startSlotId } });
  if (!start) return null;

  const { minStart, maxStart, isWithinHours } = guards(new Date());
  if (start.startTime < minStart) return null;
  if (start.startTime > maxStart) return null;
  if (!isWithinHours(start.startTime)) return null;

  const { BUFFER_BEFORE_MIN, BUFFER_AFTER_MIN } = CFG_SERVER.booking;

  const windowStart = addMin(start.startTime, -BUFFER_BEFORE_MIN);
  const windowEnd = addMin(start.startTime, liveMinutes + BUFFER_AFTER_MIN);
  const expected = ceilDiv(
    liveMinutes + BUFFER_BEFORE_MIN + BUFFER_AFTER_MIN,
    SLOT_SIZE_MIN
  );

  const block = await tx.slot.findMany({
    where: { startTime: { gte: windowStart, lt: windowEnd } },
    orderBy: { startTime: "asc" },
  });

  if (block.length !== expected) return null;
  if (block.some((s) => s.isTaken)) return null;

  for (let i = 1; i < block.length; i++) {
    if (block[i].startTime.getTime() !== addMin(block[i - 1].startTime, SLOT_SIZE_MIN).getTime()) {
      return null;
    }
  }

  return block.map((s) => s.id);
}

export async function canStartHere(startSlotId: string, liveMinutes: number, tx = prisma) {
  const block = await getBlockIds(startSlotId, liveMinutes, tx);
  return Array.isArray(block) && block.length > 0;
}

export function guards(now = new Date()) {
  const { LEAD_MINUTES, MAX_ADVANCE_DAYS, OPEN_HOUR, CLOSE_HOUR } = CFG_SERVER.booking;
  const minStart = addMin(now, LEAD_MINUTES);
  const maxStart = addMin(now, MAX_ADVANCE_DAYS * 24 * 60);
  const isWithinHours = (d: Date) => {
    const h = d.getHours();
    return h >= OPEN_HOUR && h < CLOSE_HOUR;
  };
  return { minStart, maxStart, isWithinHours };
}

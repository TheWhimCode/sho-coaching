import { prisma } from "@/lib/prisma";
import { CFG_SERVER } from "@/lib/config.server";

export const SLOT_SIZE_MIN = 15;

export function addMin(d: Date, m: number) {
  return new Date(d.getTime() + m * 60_000);
}

export function ceilDiv(a: number, b: number) {
  return Math.floor((a + b - 1) / b);
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

/**
 * ORIGINAL API (kept for compatibility).
 * NOTE: This version performs an extra read for the start slot.
 */
export async function getBlockIds(startSlotId: string, liveMinutes: number, tx = prisma) {
  const start = await tx.slot.findUnique({ where: { id: startSlotId } });
  if (!start) return null;
  return getBlockIdsByTime(start.startTime, liveMinutes, tx);
}

/**
 * New: compute the contiguous block by start time (no findUnique).
 * Returns the block slot IDs or null if invalid.
 */
export async function getBlockIdsByTime(startTime: Date, liveMinutes: number, tx = prisma) {
  const { minStart, maxStart, isWithinHours } = guards(new Date());
  if (startTime < minStart) return null;
  if (startTime > maxStart) return null;
  if (!isWithinHours(startTime)) return null;

  const { BUFFER_BEFORE_MIN, BUFFER_AFTER_MIN } = CFG_SERVER.booking;

  const windowStart = addMin(startTime, -BUFFER_BEFORE_MIN);
  const windowEnd = addMin(startTime, liveMinutes + BUFFER_AFTER_MIN);
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
    const prev = block[i - 1].startTime;
    const want = addMin(prev, SLOT_SIZE_MIN).getTime();
    if (block[i].startTime.getTime() !== want) return null;
  }

  return block.map((s) => s.id);
}

/**
 * New: fast boolean check used by /api/slots.
 * Avoids extra queries and keeps route code simple.
 */
export async function canStartAtTime(startTime: Date, liveMinutes: number, tx = prisma) {
  const ids = await getBlockIdsByTime(startTime, liveMinutes, tx);
  return Array.isArray(ids) && ids.length > 0;
}

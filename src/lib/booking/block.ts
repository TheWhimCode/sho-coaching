// src/lib/booking/block.ts
import { prisma } from "@/lib/prisma";

export const SLOT_SIZE_MIN = 15;

// Read from env with safe defaults
export function getConfig() {
  const cfg = {
    BUFFER_BEFORE_MIN: parseInt(process.env.BUFFER_BEFORE_MIN || "15", 10),
    BUFFER_AFTER_MIN: parseInt(process.env.BUFFER_AFTER_MIN || "15", 10),
    LEAD_MINUTES: parseInt(process.env.LEAD_MINUTES || "120", 10),          // 2h lead
    MAX_ADVANCE_DAYS: parseInt(process.env.MAX_ADVANCE_DAYS || "28", 10),   // 4 weeks
    OPEN_HOUR: parseInt(process.env.OPEN_HOUR || "13", 10),                 // 13:00 local
    CLOSE_HOUR: parseInt(process.env.CLOSE_HOUR || "24", 10),               // up to 24:00
    PER_DAY_CAP: parseInt(process.env.PER_DAY_CAP || "0", 10),              // 0 = unlimited
  };
  return cfg;
}

export function addMin(d: Date, m: number) {
  return new Date(d.getTime() + m * 60_000);
}

export function ceilDiv(a: number, b: number) {
  return Math.floor((a + b - 1) / b);
}

/**
 * Compute the full required slot block (buffers included) for a given start slot.
 * Returns null if any slice is missing or taken.
 */
export async function getBlockIds(startSlotId: string, liveMinutes: number, tx = prisma) {
  const start = await tx.slot.findUnique({ where: { id: startSlotId } });
  if (!start) return null;

  const { minStart, maxStart, isWithinHours } = guards(new Date());
  if (start.startTime < minStart) return null;
  if (start.startTime > maxStart) return null;
  if (!isWithinHours(start.startTime)) return null;

  const { BUFFER_BEFORE_MIN, BUFFER_AFTER_MIN } = getConfig();

  const windowStart = addMin(start.startTime, -BUFFER_BEFORE_MIN);
  const windowEnd = addMin(start.startTime, liveMinutes + BUFFER_AFTER_MIN);
  const expected = ceilDiv(liveMinutes + BUFFER_BEFORE_MIN + BUFFER_AFTER_MIN, SLOT_SIZE_MIN);

  const block = await tx.slot.findMany({
    where: { startTime: { gte: windowStart, lt: windowEnd } },
    orderBy: { startTime: "asc" },
  });

  if (block.length !== expected) return null;
  if (block.some((s) => s.isTaken)) return null;

  // Sanity: ensure slices are contiguous in 15m steps
  for (let i = 1; i < block.length; i++) {
    if (block[i].startTime.getTime() !== addMin(block[i - 1].startTime, SLOT_SIZE_MIN).getTime()) {
      return null;
    }
  }

  return block.map((s) => s.id);
}

/**
 * Returns true if this slot can be a valid starting slot for a block of liveMinutes.
 */
export async function canStartHere(startSlotId: string, liveMinutes: number, tx = prisma) {
  const block = await getBlockIds(startSlotId, liveMinutes, tx);
  return Array.isArray(block) && block.length > 0;
}

/**
 * Server-side guards shared by /api/slots.
 */
export function guards(now = new Date()) {
  const { LEAD_MINUTES, MAX_ADVANCE_DAYS, OPEN_HOUR, CLOSE_HOUR } = getConfig();
  const minStart = addMin(now, LEAD_MINUTES);
  const maxStart = addMin(now, MAX_ADVANCE_DAYS * 24 * 60);
  const isWithinHours = (d: Date) => {
    const h = d.getHours();
    // allow [OPEN_HOUR, CLOSE_HOUR). If CLOSE_HOUR === 24, allow up to 23:45 start.
    return h >= OPEN_HOUR && h < CLOSE_HOUR;
  };
  return { minStart, maxStart, isWithinHours };
}

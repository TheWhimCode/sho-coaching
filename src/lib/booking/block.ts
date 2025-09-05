import { prisma } from "@/lib/prisma";
import { CFG_SERVER } from "@/lib/config.server";
import { SlotStatus } from "@prisma/client";

export const SLOT_SIZE_MIN = 15;

// Toggle verbose logging with DEBUG_BOOKING=1
const DEBUG = process.env.DEBUG_BOOKING === "1";

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
    const h = d.getUTCHours();
    return h >= OPEN_HOUR && h < CLOSE_HOUR;
  };
  return { minStart, maxStart, isWithinHours };
}

/** Back-compat: find block ids starting from a slotId. */
export async function getBlockIds(startSlotId: string, liveMinutes: number, tx = prisma) {
  const start = await tx.slot.findUnique({ where: { id: startSlotId } });
  if (!start) return null;
  return getBlockIdsByTime(start.startTime, liveMinutes, tx);
}

/** Preferred: compute the contiguous FREE block by start time. */
export async function getBlockIdsByTime(
  startTime: Date,
  liveMinutes: number,
  tx = prisma,
  opts?: { holdKey?: string }
) {
  const { minStart, maxStart, isWithinHours } = guards(new Date());
  if (startTime < minStart) return null;
  if (startTime > maxStart) return null;
  if (!isWithinHours(startTime)) return null;

  const { BUFFER_BEFORE_MIN, BUFFER_AFTER_MIN } = CFG_SERVER.booking;
  const windowStart = addMin(startTime, -BUFFER_BEFORE_MIN);
  const windowEnd   = addMin(startTime, liveMinutes + BUFFER_AFTER_MIN);
  const expected    = ceilDiv(
    liveMinutes + BUFFER_BEFORE_MIN + BUFFER_AFTER_MIN,
    SLOT_SIZE_MIN
  );

  const now = new Date();
  const holdKey = opts?.holdKey;

  const block = await tx.slot.findMany({
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

  if (DEBUG) {
    try {
      // eslint-disable-next-line no-console
      console.info("[block:dbg]", {
        start: startTime.toISOString(),
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
        liveMinutes,
        expected,
        found: block.length,
        first: block[0]?.startTime?.toISOString?.(),
        last: block[block.length - 1]?.startTime?.toISOString?.(),
      });
    } catch {}
  }

  if (block.length !== expected) return null;

  // contiguous 15-min chain check
  for (let i = 1; i < block.length; i++) {
    const want = addMin(block[i - 1].startTime, SLOT_SIZE_MIN).getTime();
    const got = block[i].startTime.getTime();
    if (got !== want) {
      if (DEBUG) {
        try {
          // eslint-disable-next-line no-console
          console.warn("[block:gap]", {
            at: i,
            prev: block[i - 1].startTime.toISOString(),
            curr: block[i].startTime.toISOString(),
            deltaMin: (got - want) / 60_000,
          });
        } catch {}
      }
      return null;
    }
  }

  return block.map((s) => s.id);
}

export async function canStartAtTime(startTime: Date, liveMinutes: number, tx = prisma) {
  const ids = await getBlockIdsByTime(startTime, liveMinutes, tx);
  return Array.isArray(ids) && ids.length > 0;
}

import { SlotStatus } from "@prisma/client";
import { CFG_SERVER } from "@/lib/config.server";
import { findBusyStartTimesInRange } from "../db/slotQueries";
import { guards } from "../policy/guards";
import {
  addMin,
  ceilDiv,
  countContiguousSessions,
  SLOT_SIZE_MIN,
  utcMidnight,
} from "../time/timeMath";

const MIN_MINUTES = 30;
const MAX_MINUTES = 240;

export async function getBlockIdsByTime(
  startTime: Date,
  liveMinutes: number,
  tx: any,
  opts?: { holdKey?: string; leadMinutes?: number }
) {
  const minutes = Math.round(liveMinutes / SLOT_SIZE_MIN) * SLOT_SIZE_MIN;
  if (minutes < MIN_MINUTES || minutes > MAX_MINUTES) return null;

  const { minStart, maxStart } = guards(
    new Date(),
    opts?.leadMinutes != null ? { leadMinutes: opts.leadMinutes } : undefined
  );
  if (startTime < minStart || startTime > maxStart) return null;

  const now = new Date();
  const { BUFFER_AFTER_MIN, PER_DAY_CAP } = CFG_SERVER.booking;
  const holdKey = opts?.holdKey?.trim() || undefined;

  if (PER_DAY_CAP > 0) {
    const dayStart = utcMidnight(startTime);
    const dayEnd = addMin(dayStart, 24 * 60);
    const busyStartTimes = await findBusyStartTimesInRange(
      dayStart,
      dayEnd,
      now,
      { holdKey },
      tx
    );
    if (countContiguousSessions(busyStartTimes) >= PER_DAY_CAP) return null;
  }

  const expected = ceilDiv(minutes + BUFFER_AFTER_MIN, SLOT_SIZE_MIN);
  const windowEnd = addMin(startTime, minutes + BUFFER_AFTER_MIN);
  const requiredStarts = Array.from({ length: expected }, (_, i) =>
    addMin(startTime, i * SLOT_SIZE_MIN)
  );

  const busyStartTimes = await findBusyStartTimesInRange(
    startTime,
    windowEnd,
    now,
    { holdKey },
    tx
  );
  const busySet = new Set(busyStartTimes.map((d) => d.getTime()));

  for (const slotTime of requiredStarts) {
    if (busySet.has(slotTime.getTime())) return null;
  }

  const block = await tx.slot.findMany({
    where: {
      startTime: { in: requiredStarts },
      status: SlotStatus.free,
      OR: [
        { holdUntil: null },
        { holdUntil: { lt: now } },
        ...(holdKey ? [{ holdKey, holdUntil: { gte: now } }] : []),
      ],
    },
    orderBy: { startTime: "asc" },
    select: { id: true, startTime: true },
  });

  if (block.length !== expected) return null;

  for (let i = 1; i < block.length; i++) {
    if (
      block[i].startTime.getTime() !==
      addMin(block[i - 1].startTime, SLOT_SIZE_MIN).getTime()
    ) {
      return null;
    }
  }

  return block.map((s: { id: string }) => s.id);
}

import { CFG_SERVER } from "@/lib/config.server";
import { guards } from "../policy/guards";
import { addMin, ceilDiv, SLOT_SIZE_MIN, utcMidnight } from "../time/timeMath";
import { findBusySlotsForDay, findFreeBlock } from "../db/slotQueries";

const DEBUG = process.env.DEBUG_BOOKING === "1";

export async function getBlockIdsByTime(
  startTime: Date,
  liveMinutes: number,
  tx: any,
  opts?: { holdKey?: string }
) {
  const { minStart, maxStart } = guards(new Date());
  if (startTime < minStart || startTime > maxStart) return null;

  if (CFG_SERVER.booking.PER_DAY_CAP > 0) {
    const now = new Date();
    const dayStart = utcMidnight(startTime);
    const dayEnd = addMin(dayStart, 24 * 60);
    const busy = await findBusySlotsForDay(dayStart, dayEnd, now, tx);

    let sessions = 0;
    for (let i = 0; i < busy.length; i++) {
      const prev = busy[i - 1]?.startTime;
      const cur = busy[i].startTime;
      const expectedPrev = prev ? addMin(cur, -SLOT_SIZE_MIN).getTime() : NaN;
      if (!prev || prev.getTime() !== expectedPrev) sessions++;
    }

    if (sessions >= CFG_SERVER.booking.PER_DAY_CAP) return null;
  }

  const { BUFFER_AFTER_MIN } = CFG_SERVER.booking;
  const windowEnd = addMin(startTime, liveMinutes + BUFFER_AFTER_MIN);
  const expected = ceilDiv(liveMinutes + BUFFER_AFTER_MIN, SLOT_SIZE_MIN);

  const block = await findFreeBlock(
    startTime,
    windowEnd,
    new Date(),
    opts?.holdKey,
    tx
  );

  if (block.length !== expected) return null;

  for (let i = 1; i < block.length; i++) {
    if (
      block[i].startTime.getTime() !==
      addMin(block[i - 1].startTime, SLOT_SIZE_MIN).getTime()
    ) {
      if (DEBUG) console.warn("[block:gap]");
      return null;
    }
  }

  return block.map(s => s.id);
}

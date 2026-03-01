import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

import { CFG_SERVER } from "@/lib/config.server";
import { guards } from "../policy/guards";
import { getLeadMinutesOverride } from "../presetLead";
import { findBusyStartTimesInRange } from "../db/slotQueries";
import { addMin, ceilDiv, SLOT_SIZE_MIN, utcMidnight } from "../time/timeMath";

const MAX_RANGE_DAYS = 60;
const MIN_MINUTES = 30;
const MAX_MINUTES = 240;

type Params = {
  from: Date;
  to: Date;
  liveMinutes: number;
  /** If provided, slots held by this key (holdUntil > now) are still returned as available for that user to reselect */
  holdKey?: string | null;
  /** e.g. "instant" or "instant-insights" — use 2h lead for Instant Insights */
  preset?: string | null;
};

export async function getAvailableSlots(
  { from, to, liveMinutes, holdKey, preset }: Params,
  tx = prisma
) {
  // normalize liveMinutes
  const minutes = Math.round(liveMinutes / SLOT_SIZE_MIN) * SLOT_SIZE_MIN;
  if (minutes < MIN_MINUTES || minutes > MAX_MINUTES) return [];

  // cap requested range
  const days =
    (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (days > MAX_RANGE_DAYS) return [];

  const leadOverride = getLeadMinutesOverride(preset);
  const guardsOpts = leadOverride != null ? { leadMinutes: leadOverride } : undefined;

  // engine-owned policy window
  const { minStart, maxStart } = guards(new Date(), guardsOpts);
  const gte = from < minStart ? minStart : from;
  const lt = to > maxStart ? maxStart : to;
  if (gte >= lt) return [];

  const now = new Date();
  const { BUFFER_AFTER_MIN, PER_DAY_CAP } = CFG_SERVER.booking;

  // 1) Two queries in parallel: candidates + all busy slot times in range (no per-slot DB calls)
  const [rows, busyStartTimes] = await Promise.all([
    tx.slot.findMany({
      where: {
        status: SlotStatus.free,
        startTime: { gte, lt },
        OR: [
          { holdUntil: null },
          { holdUntil: { lt: now } },
          ...(holdKey?.trim()
            ? [{ holdKey: holdKey.trim(), holdUntil: { gte: now } }]
            : []),
        ],
      },
      select: { id: true, startTime: true },
      orderBy: { startTime: "asc" },
    }),
    findBusyStartTimesInRange(gte, lt, now, { holdKey: holdKey ?? undefined }, tx),
  ]);

  if (rows.length > 2000) return [];

  const busySet = new Set(busyStartTimes.map((d) => d.getTime()));

  // 2) Per-day cap: days that already have >= PER_DAY_CAP sessions (contiguous busy runs)
  const fullDays = new Set<number>();
  if (PER_DAY_CAP > 0 && busyStartTimes.length > 0) {
    const byDay = new Map<number, Date[]>();
    for (const d of busyStartTimes) {
      const dayStart = utcMidnight(d);
      const key = dayStart.getTime();
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(d);
    }
    for (const [, daySlots] of byDay) {
      daySlots.sort((a, b) => a.getTime() - b.getTime());
      let sessions = 0;
      for (let i = 0; i < daySlots.length; i++) {
        const prev = daySlots[i - 1];
        const cur = daySlots[i];
        const expectedPrev = prev ? addMin(cur, -SLOT_SIZE_MIN).getTime() : NaN;
        if (!prev || prev.getTime() !== expectedPrev) sessions++;
      }
      if (sessions >= PER_DAY_CAP) {
        fullDays.add(daySlots[0] ? utcMidnight(daySlots[0]).getTime() : 0);
      }
    }
  }

  const expectedSlots = ceilDiv(minutes + BUFFER_AFTER_MIN, SLOT_SIZE_MIN);
  const valid: { id: string; startTime: Date }[] = [];

  for (const r of rows) {
    const dayKey = utcMidnight(r.startTime).getTime();
    if (fullDays.has(dayKey)) continue;
    let blocked = false;
    for (let i = 0; i < expectedSlots; i++) {
      const slotTime = addMin(r.startTime, i * SLOT_SIZE_MIN);
      if (busySet.has(slotTime.getTime())) {
        blocked = true;
        break;
      }
    }
    if (!blocked) valid.push(r);
  }

  return valid;
}

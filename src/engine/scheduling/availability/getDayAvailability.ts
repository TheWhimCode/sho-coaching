import type { AvailabilityException, AvailabilityRule } from "@prisma/client";
import { type Interval, MIN_MINUTE, MAX_MINUTE } from "./model";
import { clampMinute, mergeIntervals, subtractInterval } from "./intervalMath";
import { utcMidnight } from "../time/timeMath";
import {
  getRulesForWeekdays,
  getExceptionsForDay,
} from "./repository";

/**
 * Group DB exception rows by UTC midnight timestamp for O(1) lookup per day in batch flows.
 */
export function groupExceptionsByUtcDay(
  rows: AvailabilityException[]
): Map<number, AvailabilityException[]> {
  const map = new Map<number, AvailabilityException[]>();
  for (const ex of rows) {
    const key = utcMidnight(ex.date).getTime();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ex);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.openMinute ?? 0) - (b.openMinute ?? 0));
  }
  return map;
}

/**
 * Pure availability for one UTC calendar day from preloaded rules + exceptions.
 * Mirrors the logic of the async path that used to query per day (see getDayAvailability).
 */
export function computeDayAvailability(
  date: Date,
  allRules: AvailabilityRule[],
  exceptionsForDay: AvailabilityException[]
): Interval[] | null {
  const day = utcMidnight(date);
  const wd = day.getUTCDay(); // 0–6
  const prev = (wd + 6) % 7;

  const byWd = new Map(allRules.map((r) => [r.weekday, r]));

  let windows: Interval[] = [];

  // spill from previous day if wrapping
  const rPrev = byWd.get(prev);
  if (rPrev && rPrev.closeMinute < rPrev.openMinute) {
    windows.push({
      openMinute: MIN_MINUTE,
      closeMinute: clampMinute(rPrev.closeMinute),
    });
  }

  // today's rule
  const rToday = byWd.get(wd);
  if (rToday) {
    const o = clampMinute(rToday.openMinute);
    const c = clampMinute(rToday.closeMinute);

    if (c > o) {
      windows.push({ openMinute: o, closeMinute: c });
    } else if (c < o) {
      windows.push({ openMinute: o, closeMinute: MAX_MINUTE });
    }
  }

  windows = mergeIntervals(windows);
  if (!windows.length) return null;

  const exceptions = exceptionsForDay;
  if (exceptions.some((e) => e.blocked)) return null;

  for (const ex of exceptions) {
    windows = subtractInterval(windows, {
      openMinute: clampMinute(ex.openMinute ?? MIN_MINUTE),
      closeMinute: clampMinute(ex.closeMinute ?? MAX_MINUTE),
    });
    if (!windows.length) break;
  }

  return windows.length ? windows : null;
}

export async function getDayAvailability(date: Date): Promise<Interval[] | null> {
  const day = utcMidnight(date);
  const wd = day.getUTCDay();
  const prev = (wd + 6) % 7;

  const rules = await getRulesForWeekdays([wd, prev]);
  const exceptions = await getExceptionsForDay(day);
  return computeDayAvailability(date, rules, exceptions);
}

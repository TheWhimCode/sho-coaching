import { Interval, MIN_MINUTE, MAX_MINUTE } from "./model";
import { clampMinute, mergeIntervals, subtractInterval } from "./intervalMath";
import { utcMidnight } from "../time/timeMath";
import {
  getRulesForWeekdays,
  getExceptionsForDay,
} from "./repository";


export async function getDayAvailability(date: Date): Promise<Interval[] | null> {
  const day = utcMidnight(date);
  const wd = day.getUTCDay();          // 0–6
  const prev = (wd + 6) % 7;

  const rules = await getRulesForWeekdays([wd, prev]);
  const byWd = new Map(rules.map(r => [r.weekday, r]));

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

  const exceptions = await getExceptionsForDay(day);
  if (exceptions.some(e => e.blocked)) return null;

  for (const ex of exceptions) {
    windows = subtractInterval(windows, {
      openMinute: clampMinute(ex.openMinute ?? MIN_MINUTE),
      closeMinute: clampMinute(ex.closeMinute ?? MAX_MINUTE),
    });
    if (!windows.length) break;
  }

  return windows.length ? windows : null;
}

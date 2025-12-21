import type { DayStarts } from "./groupByDay";

export function getDayStartCounts(days: DayStarts) {
  const out = new Map<string, number>();
  for (const [k, arr] of days.entries()) {
    if (arr.length > 0) out.set(k, arr.length);
  }
  return out;
}

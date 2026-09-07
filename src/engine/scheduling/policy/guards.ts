import { CFG_SERVER } from "@/lib/config.server";
import { addMin } from "../time/timeMath";

export type GuardsOptions = {
  /** Override lead time (minutes from now until earliest bookable slot). e.g. 120 for 2h for Instant Insights. */
  leadMinutes?: number;
};

/** End of the upcoming Saturday (UTC), inclusive of today when today is Saturday. */
export function endOfUpcomingSaturdayUtc(now: Date): Date {
  const end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);
  const day = end.getUTCDay(); // 0 Sun … 6 Sat
  const daysUntilSat = (6 - day + 7) % 7;
  end.setUTCDate(end.getUTCDate() + daysUntilSat);
  return end;
}

export function guards(now = new Date(), opts?: GuardsOptions) {
  const { LEAD_MINUTES, MAX_ADVANCE_DAYS } = CFG_SERVER.booking;
  const leadMin = opts?.leadMinutes ?? LEAD_MINUTES;
  const minStart = addMin(now, leadMin);

  // Rolling horizon from today, uniquely capped at end of this week’s Saturday.
  const rollingMax = addMin(now, MAX_ADVANCE_DAYS * 24 * 60);
  const saturdayMax = endOfUpcomingSaturdayUtc(now);
  const maxStart = rollingMax < saturdayMax ? rollingMax : saturdayMax;

  return { minStart, maxStart };
}

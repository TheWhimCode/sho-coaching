import { CFG_SERVER } from "@/lib/config.server";
import { addMin } from "../time/timeMath";

export type GuardsOptions = {
  /** Override lead time (minutes from now until earliest bookable slot). e.g. 120 for 2h for Instant Insights. */
  leadMinutes?: number;
};

export function guards(now = new Date(), opts?: GuardsOptions) {
  const { LEAD_MINUTES, MAX_ADVANCE_DAYS } = CFG_SERVER.booking;
  const leadMin = opts?.leadMinutes ?? LEAD_MINUTES;
  const minStart = addMin(now, leadMin);
  const maxStart = addMin(now, MAX_ADVANCE_DAYS * 24 * 60);
  return { minStart, maxStart };
}

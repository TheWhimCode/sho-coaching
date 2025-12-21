import { CFG_SERVER } from "@/lib/config.server";
import { addMin } from "../time/timeMath";

export function guards(now = new Date()) {
  const { LEAD_MINUTES, MAX_ADVANCE_DAYS } = CFG_SERVER.booking;
  const minStart = addMin(now, LEAD_MINUTES);
  const maxStart = addMin(now, MAX_ADVANCE_DAYS * 24 * 60);
  return { minStart, maxStart };
}

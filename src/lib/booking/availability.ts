import { prisma } from "@/lib/prisma";

/**
 * Returns availability intervals for a given UTC date.
 * Exceptions are interpreted as BLOCKS.
 */
export async function getDayAvailability(date: Date) {
  const weekday = date.getUTCDay(); // 0–6
  const midnight = new Date(date);
  midnight.setUTCHours(0, 0, 0, 0);

  // Weekly rule for this weekday
  const rule = await prisma.availabilityRule.findUnique({
    where: { weekday },
  });
  if (!rule) return null;

  // Exceptions (blocks) for this date
  const exceptions = await prisma.availabilityException.findMany({
    where: { date: midnight },
    orderBy: { openMinute: "asc" },
  });

  // Full-day block?
  if (exceptions.some((e) => e.blocked)) return null;

  // Start with the weekly window, then subtract each exception window.
  let intervals: { openMinute: number; closeMinute: number }[] = [
    { openMinute: clamp(rule.openMinute), closeMinute: clamp(rule.closeMinute) },
  ];

  for (const ex of exceptions) {
    const blockStart = clamp(ex.openMinute ?? 0);
    const blockEnd   = clamp(ex.closeMinute ?? 24 * 60);
    intervals = subtractBlocked(intervals, blockStart, blockEnd);
    if (!intervals.length) break;
  }

  return intervals.length ? intervals : null;
}

// --- helpers ---
function clamp(n: number) {
  return Math.max(0, Math.min(1440, n));
}

/** subtract [bStart, bEnd) from a list of [s,e) intervals */
function subtractBlocked(
  intervals: { openMinute: number; closeMinute: number }[],
  bStart: number,
  bEnd: number
) {
  const out: { openMinute: number; closeMinute: number }[] = [];
  for (const { openMinute: s, closeMinute: e } of intervals) {
    // no overlap
    if (bEnd <= s || bStart >= e) {
      out.push({ openMinute: s, closeMinute: e });
      continue;
    }
    // left remainder
    if (bStart > s) out.push({ openMinute: s, closeMinute: Math.min(bStart, e) });
    // right remainder
    if (bEnd < e) out.push({ openMinute: Math.max(bEnd, s), closeMinute: e });
  }
  // keep only positive-length intervals
  return out.filter((x) => x.closeMinute > x.openMinute);
}

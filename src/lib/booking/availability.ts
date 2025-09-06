import { prisma } from "@/lib/prisma";

type Interval = { openMinute: number; closeMinute: number };
const MIN = 0, MAX = 1440;

export async function getDayAvailability(date: Date) {
  const day = utcMidnight(date);
  const wd = day.getUTCDay();           // 0–6
  const prev = (wd + 6) % 7;

  // --- rules (need today + previous weekday) ---
  const rules = await prisma.availabilityRule.findMany({
    where: { weekday: { in: [wd, prev] } },
  });
  const byWd = new Map(rules.map(r => [r.weekday, r]));

  let windows: Interval[] = [];

  // spill from previous day if it wraps (e.g., 20:00→02:00)
  const rPrev = byWd.get(prev);
  if (rPrev && rPrev.closeMinute < rPrev.openMinute) {
    windows.push({ openMinute: MIN, closeMinute: clamp(rPrev.closeMinute) }); // 00:00→prev.close
  }

  // today's own window (split if wraps)
  const rToday = byWd.get(wd);
  if (rToday) {
    const o = clamp(rToday.openMinute);
    const c = clamp(rToday.closeMinute);
    if (c > o) windows.push({ openMinute: o, closeMinute: c });      // same-day
    else if (c < o) windows.push({ openMinute: o, closeMinute: MAX });// wrap: today part to midnight
    // c===o ⇒ closed
  }

  windows = mergeIntervals(windows);
  if (!windows.length) return null;

  // --- exceptions for THIS calendar day (treated as blocks) ---
  const exceptions = await prisma.availabilityException.findMany({
    where: { date: day },
    orderBy: { openMinute: "asc" },
  });

  if (exceptions.some(e => e.blocked)) return null;

  for (const ex of exceptions) {
    const b: Interval = {
      openMinute: clamp(ex.openMinute ?? MIN),
      closeMinute: clamp(ex.closeMinute ?? MAX),
    };
    windows = subtractOne(windows, b);
    if (!windows.length) break;
  }

  return windows.length ? windows : null;
}

/* ---------- helpers ---------- */

function utcMidnight(d: Date) {
  const t = new Date(d);
  t.setUTCHours(0, 0, 0, 0);
  return t;
}

function clamp(n: number) {
  return Math.max(MIN, Math.min(MAX, n));
}

function mergeIntervals(iv: Interval[]): Interval[] {
  if (!iv.length) return iv;
  iv.sort((a,b)=>a.openMinute-b.openMinute);
  const out: Interval[] = [ { ...iv[0] } ];
  for (let i = 1; i < iv.length; i++) {
    const cur = iv[i], last = out[out.length-1];
    if (cur.openMinute <= last.closeMinute) {
      last.closeMinute = Math.max(last.closeMinute, cur.closeMinute);
    } else {
      out.push({ ...cur });
    }
  }
  return out.filter(w => w.closeMinute > w.openMinute);
}

function subtractOne(base: Interval[], cut: Interval): Interval[] {
  const out: Interval[] = [];
  for (const w of base) {
    // no overlap
    if (cut.closeMinute <= w.openMinute || cut.openMinute >= w.closeMinute) {
      out.push(w);
      continue;
    }
    // left remainder
    if (cut.openMinute > w.openMinute)
      out.push({ openMinute: w.openMinute, closeMinute: Math.min(cut.openMinute, w.closeMinute) });
    // right remainder
    if (cut.closeMinute < w.closeMinute)
      out.push({ openMinute: Math.max(cut.closeMinute, w.openMinute), closeMinute: w.closeMinute });
  }
  return mergeIntervals(out);
}

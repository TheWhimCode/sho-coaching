// src/lib/booking/quickPicks.ts

export type QuickIn = { id: string; startISO: string };
export type QuickOut = QuickIn & { label?: "ASAP" | "Weekend" };

export function computeQuickPicks(
  slots: QuickIn[],
  now = new Date()
): QuickOut[] {
  const sorted = [...slots].sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
  );
  if (!sorted.length) return [];

  const out: QuickOut[] = [];

  // 1) Soonest
  const ASAP = sorted[0];
  out.push({ ...ASAP, label: "ASAP" });

  const ASAPTs = new Date(ASAP.startISO).getTime();

// 2) Weekend (latest time on the earliest weekend day)
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

const firstWkndIdx = sorted.findIndex((s) => {
  const d = new Date(s.startISO);
  return d.getTime() > ASAPTs && isWeekend(d);
});

let wknd: QuickIn | undefined;

if (firstWkndIdx !== -1) {
  const firstDate = new Date(sorted[firstWkndIdx].startISO);

  // advance to the last slot on that same (local) day
  let i = firstWkndIdx;
  while (i + 1 < sorted.length) {
    const nextDate = new Date(sorted[i + 1].startISO);
    if (
      nextDate.getFullYear() !== firstDate.getFullYear() ||
      nextDate.getMonth() !== firstDate.getMonth() ||
      nextDate.getDate() !== firstDate.getDate()
    ) break;
    i++;
  }

  wknd = sorted[i];
}

if (wknd) out.push({ ...wknd, label: "Weekend" });


  // 3) In 4+ days (no label)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const threshold = new Date(startOfToday);
  threshold.setDate(startOfToday.getDate() + 4);

  const fourPlus = sorted.find((s) => {
    const t = new Date(s.startISO).getTime();
    return t >= threshold.getTime() && t > ASAPTs && (!wknd || s.id !== wknd.id);
  });
  if (fourPlus) out.push({ ...fourPlus });

  return out.sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
  );
}

// src/lib/booking/quickPicks.ts
export type QuickIn = { id: string; startISO: string };
export type QuickOut = QuickIn & { label?: "ASAP" | "Weekend" }; 
// label optional now

export function computeQuickPicks(slots: QuickIn[], now = new Date()): QuickOut[] {
  // ✅ only consider slots aligned to :00 / :30
  const aligned = slots.filter((s) => {
    const m = new Date(s.startISO).getMinutes();
    return m === 0 || m === 30;
  });

  const sorted = [...aligned].sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
  );
  if (!sorted.length) return [];

  const out: QuickOut[] = [];

  // 1) Soonest
  const ASAP = sorted[0];
  out.push({ ...ASAP, label: "ASAP" });

  const ASAPTs = new Date(ASAP.startISO).getTime();

  // 2) Weekend
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
  const wknd = sorted.find((s) => {
    const d = new Date(s.startISO);
    return d.getTime() > ASAPTs && isWeekend(d);
  });
  if (wknd) out.push({ ...wknd, label: "Weekend" });

  // 3) In 4+ days (no label)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const threshold = new Date(startOfToday);
  threshold.setDate(startOfToday.getDate() + 4); // >= 4 days after today
  const thresholdTs = threshold.getTime();

  const fourPlus = sorted.find((s) => {
    const t = new Date(s.startISO).getTime();
    return t >= thresholdTs && t > ASAPTs && (!wknd || s.id !== wknd.id);
  });
  if (fourPlus) out.push({ ...fourPlus }); // 👈 no label here

  // ✅ Sort by actual date so order always feels natural
  return out.sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
  );
}

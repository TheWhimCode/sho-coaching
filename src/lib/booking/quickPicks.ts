// src/lib/booking/quickPicks.ts
export type QuickIn = { id: string; startISO: string };
export type QuickOut = QuickIn & { label: "Soonest" | "Weekend" | "Next week" };

export function computeQuickPicks(slots: QuickIn[], now = new Date()): QuickOut[] {
  const sorted = [...slots].sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
  );
  if (!sorted.length) return [];

  const soonest = sorted[0];
  const soonestTs = new Date(soonest.startISO).getTime();

  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  // Weekend: first Sat/Sun strictly after the soonest slot
  const wknd = sorted.find((s) => {
    const d = new Date(s.startISO);
    return d.getTime() > soonestTs && isWeekend(d);
  });

  // Next week: first slot on/after start-of-today + 7 days, strictly after soonest
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const nextWeekThreshold = new Date(startOfToday);
  nextWeekThreshold.setDate(startOfToday.getDate() + 7);
  const nextWeekTs = nextWeekThreshold.getTime();

  const nxtWeek = sorted.find((s) => {
    const t = new Date(s.startISO).getTime();
    return (
      t >= nextWeekTs &&
      t > soonestTs &&
      (!wknd || s.id !== wknd.id)
    );
  });

  const out: QuickOut[] = [{ ...soonest, label: "Soonest" }];
  if (wknd) out.push({ ...wknd, label: "Weekend" });
  if (nxtWeek) out.push({ ...nxtWeek, label: "Next week" });
  return out;
}

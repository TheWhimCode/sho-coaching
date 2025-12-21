export type StartRef = { id: string; start: Date };

export function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

/**
 * Group start times by local day key, sorted ascending within each day.
 * Pure. No policy, no filtering.
 */
export function groupStartsByLocalDay(starts: StartRef[]) {
  const map = new Map<string, StartRef[]>();

  for (const s of starts) {
    const key = dayKeyLocal(s.start);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }

  for (const arr of map.values()) {
    arr.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  return map;
}

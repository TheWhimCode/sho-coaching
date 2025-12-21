import { isDisplayableStart } from "../policy/display";

export type DayStarts = Map<string, { id: string; start: Date }[]>;

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`; // local YYYY-MM-DD
}

export function groupStartsByDay(
  slots: { id: string; startTime: Date }[]
): DayStarts {
  const map: DayStarts = new Map();

  for (const s of slots) {
    if (!isDisplayableStart(s.startTime)) continue;
    const key = dayKeyLocal(s.startTime); // ✅ local day for display
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ id: s.id, start: s.startTime });
  }

  for (const arr of map.values()) {
    arr.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  return map;
}

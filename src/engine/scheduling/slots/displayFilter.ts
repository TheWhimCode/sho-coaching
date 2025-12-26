import type { StartRef } from "./groupByDay";

/**
 * UI cadence rule: what starts are "displayable" (e.g. 30-min grid).
 * Pure. No DB. No lead/max-advance. No contiguity.
 */
export function isDisplayableStart(d: Date, displayStepMin: number) {
  return d.getMinutes() % displayStepMin === 0;
}

export function filterDisplayableStarts(starts: StartRef[], displayStepMin: number) {
  return starts.filter((s) => isDisplayableStart(s.start, displayStepMin));
}

export function displayableCountByDay(
  startsByDay: Map<string, StartRef[]>,
  displayStepMin: number
) {
  const out = new Map<string, number>();
  for (const [k, arr] of startsByDay.entries()) {
    const n = arr.reduce((acc, s) => acc + (isDisplayableStart(s.start, displayStepMin) ? 1 : 0), 0);
    if (n > 0) out.set(k, n);
  }
  return out;
}

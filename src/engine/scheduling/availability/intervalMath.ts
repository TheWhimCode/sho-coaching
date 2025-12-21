import { Interval, MIN_MINUTE, MAX_MINUTE } from "./model";

export function clampMinute(n: number) {
  return Math.max(MIN_MINUTE, Math.min(MAX_MINUTE, n));
}

export function mergeIntervals(iv: Interval[]): Interval[] {
  if (!iv.length) return iv;

  const sorted = [...iv].sort((a, b) => a.openMinute - b.openMinute);
  const out: Interval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = out[out.length - 1];

    if (cur.openMinute <= last.closeMinute) {
      last.closeMinute = Math.max(last.closeMinute, cur.closeMinute);
    } else {
      out.push({ ...cur });
    }
  }

  return out.filter(w => w.closeMinute > w.openMinute);
}

export function subtractInterval(base: Interval[], cut: Interval): Interval[] {
  const out: Interval[] = [];

  for (const w of base) {
    // no overlap
    if (cut.closeMinute <= w.openMinute || cut.openMinute >= w.closeMinute) {
      out.push(w);
      continue;
    }

    // left remainder
    if (cut.openMinute > w.openMinute) {
      out.push({
        openMinute: w.openMinute,
        closeMinute: Math.min(cut.openMinute, w.closeMinute),
      });
    }

    // right remainder
    if (cut.closeMinute < w.closeMinute) {
      out.push({
        openMinute: Math.max(cut.closeMinute, w.openMinute),
        closeMinute: w.closeMinute,
      });
    }
  }

  return mergeIntervals(out);
}

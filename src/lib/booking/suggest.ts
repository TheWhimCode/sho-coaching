// src/lib/booking/suggest.ts

export type SlotLite = { id: string; startTime: string };

function addMin(d: Date, m: number) {
  return new Date(d.getTime() + m * 60_000);
}

/**
 * Selects suggested starts from already-available slots.
 * Assumes slots are engine-approved and sorted by startTime.
 */
export function suggestStarts(
  slots: SlotLite[],
  count = 3,
  opts?: {
    gapMin?: number;
    primeStart?: number;
    primeEnd?: number;
  }
): SlotLite[] {
  const gapMin = opts?.gapMin ?? 90;
  const primeStart = opts?.primeStart ?? 18; // 18:00
  const primeEnd = opts?.primeEnd ?? 22;     // 22:00

  if (!Array.isArray(slots) || !slots.length) return [];

  const items = slots.map(s => ({
    ...s,
    dt: new Date(s.startTime),
  }));

  const out: SlotLite[] = [];
  const now = new Date();

  // S1: soonest
  out.push({ id: items[0].id, startTime: items[0].dt.toISOString() });

  // S2: at least gapMin after S1
  if (out.length < count) {
    const baseTime = new Date(out[0].startTime);
    const s2 = items.find(s => s.dt >= addMin(baseTime, gapMin));
    if (s2) out.push({ id: s2.id, startTime: s2.dt.toISOString() });
  }

  // S3: prime-time slot, fallback = next ≥ gapMin after last
  if (out.length < count) {
    const pickedIds = new Set(out.map(x => x.id));

    const prime = items.find(s => {
      if (pickedIds.has(s.id)) return false;
      const h = s.dt.getHours();
      return h >= primeStart && h < primeEnd;
    });

    if (prime) {
      out.push({ id: prime.id, startTime: prime.dt.toISOString() });
    } else {
      const baseTime = new Date(out[out.length - 1].startTime);
      const next = items.find(
        s => !pickedIds.has(s.id) && s.dt >= addMin(baseTime, gapMin)
      );
      if (next) out.push({ id: next.id, startTime: next.dt.toISOString() });
    }
  }

  return out.slice(0, count);
}

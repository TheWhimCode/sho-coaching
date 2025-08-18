export type SlotLite = { id: string; startTime: string };

function iso(d: Date) { return d.toISOString(); }
function addMin(d: Date, m: number) { return new Date(d.getTime() + m*60_000); }

export async function fetchSuggestedStarts(
  liveMinutes: number,
  count = 3,
  opts?: { gapMin?: number; horizonDays?: number; primeStart?: number; primeEnd?: number }
): Promise<SlotLite[]> {
  const gapMin = opts?.gapMin ?? 90;
  const horizonDays = opts?.horizonDays ?? 7;
  const primeStart = opts?.primeStart ?? 18; // 18:00
  const primeEnd   = opts?.primeEnd   ?? 22; // 22:00

  const now = new Date();
  const from = now;
  const to = addMin(now, horizonDays * 24 * 60);

  // hit your real API (same as CalLikeOverlay), passing liveMinutes
  const qs = new URLSearchParams({
    from: iso(from),
    to: iso(to),
    liveMinutes: String(liveMinutes),
  });
  const res = await fetch(`/api/slots?${qs}`, { cache: "no-store" });
  const slots: SlotLite[] = await res.json();
  if (!Array.isArray(slots)) return [];

  // already sorted by API; convert to Date for filtering
  const items = slots.map(s => ({ ...s, dt: new Date(s.startTime) }));

  const out: SlotLite[] = [];

  // S1: soonest
  if (items.length) {
    out.push({ id: items[0].id, startTime: items[0].dt.toISOString() });
  }

  // S2: at least gapMin after S1 (or next available if S1 missing)
  if (out.length < count) {
    const base = out[0]?.startTime ? new Date(out[0].startTime) : now;
    const s2 = items.find(s => s.dt >= addMin(base, gapMin));
    if (s2) out.push({ id: s2.id, startTime: s2.dt.toISOString() });
  }

  // S3: prime-time within 7 days, not duplicating S1/S2; fallback = next ≥ gapMin after S2
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
      const base = out[out.length-1]?.startTime ? new Date(out[out.length-1].startTime) : now;
      const nxt = items.find(s => !pickedIds.has(s.id) && s.dt >= addMin(base, gapMin));
      if (nxt) out.push({ id: nxt.id, startTime: nxt.dt.toISOString() });
    }
  }

  return out.slice(0, count);
}

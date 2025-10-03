// Reusable rank math + formatting

export const TIER_ORDER = [
  'IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER',
] as const;
export type Tier = typeof TIER_ORDER[number];
export const DIV_ORDER = ['IV','III','II','I'] as const;
export type Division = typeof DIV_ORDER[number] | null;

export const MASTER_BASE = TIER_ORDER.indexOf('MASTER') * 400; // 2800

export function rankToPoints(tier: string, division: string | null | undefined, lp: number): number {
  const t = (tier ?? '').toUpperCase();
  if (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER') return MASTER_BASE + Math.max(0, lp);
  const d  = (division ?? 'IV').toUpperCase();
  const ti = Math.max(0, TIER_ORDER.indexOf(t as Tier));
  const di = Math.max(0, DIV_ORDER.indexOf(d as any));
  return ti * 400 + (DIV_ORDER.length - 1 - di) * 100 + Math.max(0, lp);
}

// Below-Master inverse (labels). For Master+, use labelWithCutoffs.
export function pointsToRank(points: number): { tier: Tier; division: Division; lp: number } {
  if (points >= MASTER_BASE) return { tier: 'MASTER', division: null, lp: Math.max(0, Math.floor(points - MASTER_BASE)) };
  const ti = Math.floor(points / 400);
  const within = points - ti * 400;           // 0..399
  const di = 3 - Math.floor(within / 100);    // 3..0 => I..IV reversed
  const lp = Math.floor(within % 100);        // 0..99
  return { tier: TIER_ORDER[ti], division: DIV_ORDER[di], lp };
}

// Optional dynamic labeling for Master+ using fetched cutoffs (do NOT use for math).
export function labelWithCutoffs(points: number, gmCutoff?: number, challCutoff?: number) {
  if (points < MASTER_BASE) return pointsToRank(points);
  const lp = Math.max(0, Math.floor(points - MASTER_BASE));
  if (challCutoff != null && lp >= challCutoff) return { tier: 'CHALLENGER', division: null, lp };
  if (gmCutoff != null && lp >= gmCutoff)      return { tier: 'GRANDMASTER', division: null, lp };
  return { tier: 'MASTER', division: null, lp };
}

export function rankText(tier: string, division: string | null | undefined, lp: number) {
  const t = (tier ?? '').toUpperCase();
  return (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER')
    ? `${t} · ${lp} LP`
    : `${t} ${division ?? 'IV'} · ${lp} LP`;
}

// Utilities you’ll reuse across API + UI
export function addPoints<T extends { tier: string; division?: string | null; lp: number }>(row: T) {
  return { ...row, points: rankToPoints(row.tier, row.division ?? null, row.lp) };
}

export function computeDeltaSince(
  series: { date: string; points: number }[],
  baselineDateISO: string
) {
  const base = series.find(s => s.date >= baselineDateISO) ?? series[0];
  if (!base) return [];
  return series
    .filter(s => s.date >= baselineDateISO)
    .map(s => ({ date: s.date, pointsDelta: s.points - base.points }));
}

// Chart helpers
export function tierTicksFrom(pointsArr: number[]) {
  if (!pointsArr.length) return [];
  let minTier = Infinity, maxTier = -Infinity;
  for (const p of pointsArr) {
    const ti = Math.min(TIER_ORDER.indexOf('MASTER'), Math.floor(Math.min(p, MASTER_BASE) / 400));
    minTier = Math.min(minTier, ti);
    maxTier = Math.max(maxTier, ti);
  }
  minTier = Math.max(0, minTier - 1);
  maxTier = Math.min(TIER_ORDER.length - 1, maxTier + 1);
  return Array.from({ length: maxTier - minTier + 1 }, (_, k) => {
    const ti = minTier + k;
    return { value: ti * 400, tier: TIER_ORDER[ti] as string };
  });
}

export function yDomainFrom(pointsArr: number[]) {
  if (!pointsArr.length) return [rankToPoints('SILVER','IV',0), rankToPoints('PLATINUM','I',100)] as [number, number];
  const pMin = Math.min(...pointsArr);
  const pMax = Math.max(...pointsArr);
  return [Math.floor(pMin / 100) * 100, (pMax >= MASTER_BASE ? pMax + 50 : Math.ceil((pMax + 1) / 100) * 100)] as [number, number];
}

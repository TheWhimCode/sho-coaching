'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { rankMiniCrestSvg } from '@/lib/league/datadragon';

type RankPoint = { date: string; tier: string; division?: string | null; lp: number };
type PointsDatum = { date: string; points: number; tier: string; division: string | null; lp: number };

const fetcher = (url: string) => fetch(url).then(r => r.json() as Promise<RankPoint[]>);

const TIER_ORDER = [
  'IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'
] as const;
const DIV_ORDER = ['IV','III','II','I'] as const;

function rankToPoints(tier: string, division: string | null | undefined, lp: number): number {
  const t = (tier ?? '').toUpperCase();
  const d = (division ?? 'IV').toUpperCase();
  const ti = Math.max(0, TIER_ORDER.indexOf(t as typeof TIER_ORDER[number]));
  const base = ti * 400;
  if (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER') return base + Math.max(0, lp);
  const di = Math.max(0, DIV_ORDER.indexOf(d as typeof DIV_ORDER[number]));
  const divOffset = (DIV_ORDER.length - 1 - di) * 100;
  return base + divOffset + Math.max(0, lp);
}
const pointsAt = (tier: string, division: 'IV'|'III'|'II'|'I', lp = 0) =>
  rankToPoints(tier, division, lp);

const rankText = (tier: string, division: string | null, lp: number) => {
  const t = (tier ?? '').toUpperCase();
  if (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER') return `${t} · ${lp} LP`;
  return `${t} ${division ?? 'IV'} · ${lp} LP`;
};

export default function RankGraph({ studentId }: { studentId: string }) {
  const { data } = useSWR<RankPoint[]>(
    `/api/admin/students/climb-since-session?studentId=${encodeURIComponent(studentId)}`,
    fetcher
  );

  const { chartData, yDomain, tierTicks } = useMemo(() => {
    const rows: RankPoint[] = Array.isArray(data) ? [...data] : [];
    rows.sort((a, b) => a.date.localeCompare(b.date));

    const pts: PointsDatum[] = rows.map(d => ({
      date: d.date,
      points: rankToPoints(d.tier, d.division ?? null, d.lp),
      tier: (d.tier ?? '').toUpperCase(),
      division: (d.division ?? null) as string | null,
      lp: d.lp,
    }));

    if (pts.length === 0) {
      const yMin = pointsAt('SILVER', 'IV', 0);
      const yMax = pointsAt('PLATINUM', 'I', 100);
      return { chartData: [] as PointsDatum[], yDomain: [yMin, yMax] as [number, number], tierTicks: [] as { value:number; tier:string }[] };
    }

    // compute min/max tiers seen and expand one league on each side
    let minSeenIdx = Infinity;
    let maxSeenIdx = -Infinity;
    for (const p of pts) {
      const ti = Math.max(0, TIER_ORDER.indexOf(p.tier as typeof TIER_ORDER[number]));
      if (ti < minSeenIdx) minSeenIdx = ti;
      if (ti > maxSeenIdx) maxSeenIdx = ti;
    }
    const minIdx = Math.max(0, minSeenIdx - 1);
    const maxIdx = Math.min(TIER_ORDER.length - 1, maxSeenIdx + 1);

    const yMin = pointsAt(TIER_ORDER[minIdx], 'IV', 0);
    const yMax =
      maxIdx >= TIER_ORDER.indexOf('MASTER')
        ? Math.max(...pts.map(p => p.points)) + 50
        : pointsAt(TIER_ORDER[maxIdx], 'I', 100);

    // ticks on TIER BOUNDARIES so bottom tick == baseline
    const tierTicks = Array.from({ length: maxIdx - minIdx + 1 }, (_, k) => {
      const ti = minIdx + k;
      return { value: ti * 400, tier: TIER_ORDER[ti] as string };
    });

    return { chartData: pts, yDomain: [yMin, yMax] as [number, number], tierTicks };
  }, [data]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }} // kill outer padding
          style={{ overflow: 'visible' }} // allow crest to extend outside
        >
          {/* X axis: line only; zero reserved height */}
          <XAxis dataKey="date" tick={false} tickLine={false} axisLine height={1} />
          {/* Y axis: crest ticks; bottom crest sits ON baseline */}
          <YAxis
            type="number"
            domain={yDomain}
            ticks={tierTicks.map(t => t.value)}
            tickLine={false}
            axisLine
            width={36}
            tick={(props: any) => {
              const { x, y, payload } = props;
              const tier = tierTicks.find(t => t.value === payload.value)?.tier ?? 'UNRANKED';
              const href = rankMiniCrestSvg(tier as any);
              const size = 24;
              const isBottom = payload.value === yDomain[0];
              const yPos = isBottom ? (y - size + 0.5) : (y - size / 2);
              return (
                <g transform={`translate(${x - size - 6},${yPos})`}>
                  <image href={href} width={size} height={size} />
                </g>
              );
            }}
          />

          <Tooltip
            cursor={{ strokeOpacity: 0.25 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as PointsDatum;
              const dateLabel = new Date(d.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div className="bg-zinc-900/90 text-white text-xs px-2 py-1 rounded">
                  <div>{rankText(d.tier, d.division, d.lp)}</div>
                  <div>{dateLabel}</div>
                </div>
              );
            }}
          />

          {/* smooth line */}
          <Line type="monotone" dataKey="points" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

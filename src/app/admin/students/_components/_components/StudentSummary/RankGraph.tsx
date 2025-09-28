'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { rankMiniCrestSvg } from '@/lib/league/datadragon';

type RankPoint = { date: string; tier: string; division?: string | null; lp: number };
type PointsDatum = {
  date: string;
  points: number;
  tier: string;
  division: string | null;
  lp: number;
};

const fetcher = (url: string) => fetch(url).then(r => r.json() as Promise<RankPoint[]>);

const TIER_ORDER = [
  'IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND',
  'MASTER','GRANDMASTER','CHALLENGER'
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
function pointsAt(tier: string, division: 'IV'|'III'|'II'|'I', lp = 0) {
  return rankToPoints(tier, division, lp);
}

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
      division: d.division ?? null,
      lp: d.lp,
    }));

    if (pts.length === 0) {
      const yMin = pointsAt('SILVER', 'IV', 0);
      const yMax = pointsAt('PLATINUM', 'I', 100);
      return {
        chartData: [] as PointsDatum[],
        yDomain: [yMin, yMax] as [number, number],
        tierTicks: [] as { value:number; tier:string }[],
      };
    }

    // min/max tiers seen
    let minSeenIdx = Number.POSITIVE_INFINITY;
    let maxSeenIdx = Number.NEGATIVE_INFINITY;
    for (const p of pts) {
      const ti = Math.max(0, TIER_ORDER.indexOf(p.tier as typeof TIER_ORDER[number]));
      if (ti < minSeenIdx) minSeenIdx = ti;
      if (ti > maxSeenIdx) maxSeenIdx = ti;
    }
    const minIdx = Math.max(0, minSeenIdx - 1);
    const maxIdx = Math.min(TIER_ORDER.length - 1, maxSeenIdx + 1);

    const lowTier = TIER_ORDER[minIdx];
    const highTier = TIER_ORDER[maxIdx];

    const yMin = pointsAt(lowTier, 'IV', 0);
    const yMax =
      maxIdx >= TIER_ORDER.indexOf('MASTER')
        ? Math.max(...pts.map(p => p.points)) + 50
        : pointsAt(highTier, 'I', 100);

    // ticks at tier boundaries
    const tierTicks = Array.from({ length: maxIdx - minIdx + 1 }, (_, k) => {
      const ti = minIdx + k;
      return { value: ti * 400, tier: TIER_ORDER[ti] as string };
    });

    return { chartData: pts, yDomain: [yMin, yMax] as [number, number], tierTicks };
  }, [data]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={false} tickLine={false} axisLine />
          <YAxis
            type="number"
            domain={yDomain}
            ticks={tierTicks.map(t => t.value)}
            tickLine={false}
            axisLine
            width={40}
            tick={(props: any) => {
              const { x, y, payload } = props;
              const tierMeta = tierTicks.find(t => t.value === payload.value);
              const tier = tierMeta?.tier ?? 'UNRANKED';
              const href = rankMiniCrestSvg(tier as any);
              const size = 20;
              const isBottom = payload.value === yDomain[0];
              const yPos = isBottom ? (y - size + 1) : (y - size / 2);
              return (
                <g transform={`translate(${x - size - 8},${yPos})`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <image href={href} width={size} height={size} />
                </g>
              );
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as PointsDatum;
              const date = new Date(d.date);
              const dateLabel = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              const rankLabel =
                d.tier === 'MASTER' || d.tier === 'GRANDMASTER' || d.tier === 'CHALLENGER'
                  ? `${d.tier} · ${d.lp} LP`
                  : `${d.tier} ${(d.division ?? 'IV')} · ${d.lp} LP`;
              return (
                <div className="bg-zinc-900/90 text-white text-xs px-2 py-1 rounded">
                  <div>{rankLabel}</div>
                  <div>{dateLabel}</div>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="points" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

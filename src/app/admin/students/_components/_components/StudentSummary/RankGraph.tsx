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
  ReferenceLine,
} from 'recharts';
import { rankMiniCrestSvg } from '@/lib/league/datadragon';

type ApiSeries = { date: string; tier: string; division?: string | null; lp: number };
type ApiResp = {
  series: ApiSeries[];
  sessions: { id: string; scheduledStart: string; day: string }[];
  climbed?: { date: string; climbed: number }[];
  sessionId?: string;
};

type PointsDatum = {
  date: string;
  points: number;
  tier: string;
  division: string | null;
  lp: number;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TIER_ORDER = [
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'EMERALD',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
] as const;
const DIV_ORDER = ['IV', 'III', 'II', 'I'] as const;

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
const pointsAt = (tier: string, division: 'IV' | 'III' | 'II' | 'I', lp = 0) =>
  rankToPoints(tier, division, lp);

const rankText = (tier: string, division: string | null, lp: number) => {
  const t = (tier ?? '').toUpperCase();
  if (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER') return `${t} · ${lp} LP`;
  return `${t} ${division ?? 'IV'} · ${lp} LP`;
};

export default function RankGraph({ studentId }: { studentId: string }) {
  const { data } = useSWR<ApiResp>(
    `/api/climb-since-session?studentId=${encodeURIComponent(studentId)}`,
    fetcher
  );

  const { chartData, yDomain, tierTicks, sessionXs } = useMemo(() => {
    const rows: ApiSeries[] = Array.isArray(data?.series) ? [...data.series] : [];
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
      return {
        chartData: [] as PointsDatum[],
        yDomain: [yMin, yMax] as [number, number],
        tierTicks: [] as { value: number; tier: string }[],
        sessionXs: [] as string[],
      };
    }

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

    const tierTicks = Array.from({ length: maxIdx - minIdx + 1 }, (_, k) => {
      const ti = minIdx + k;
      return { value: ti * 400, tier: TIER_ORDER[ti] as string };
    });

    const sessionXs = (data?.sessions ?? []).map(s => s.scheduledStart);

    return { chartData: pts, yDomain: [yMin, yMax] as [number, number], tierTicks, sessionXs };
  }, [data]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          style={{ overflow: 'visible' }}
        >
          <XAxis dataKey="date" tick={false} tickLine={false} axisLine height={1} />
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
              const yPos = isBottom ? y - size + 0.5 : y - size / 2;
              return (
                <g transform={`translate(${x - size - 6},${yPos})`}>
                  <image href={href} width={size} height={size} />
                </g>
              );
            }}
          />

          {/* Vertical dotted lines for sessions */}
          {sessionXs.map((x, i) => (
            <ReferenceLine
              key={x + i}
              x={x}
              ifOverflow="extendDomain"
              strokeDasharray="3 3"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ))}

          <Tooltip
            cursor={{ strokeOpacity: 0.25 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as PointsDatum;
              const dateLabel = new Date(d.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              const isSessionDay =
                !!(data?.sessions ?? []).some(s => s.day === d.date);

              return (
                <div className="bg-zinc-900/90 text-white text-xs px-2 py-1 rounded">
                  <div>{rankText(d.tier, d.division, d.lp)}</div>
                  <div>
                    {dateLabel}
                    {isSessionDay ? ' · Coaching session' : ''}
                  </div>
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

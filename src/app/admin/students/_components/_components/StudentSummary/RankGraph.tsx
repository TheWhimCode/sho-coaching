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

// --- shared rank math (keep identical to server) ---
const TIER_ORDER = [
  'IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'
] as const;
const DIV_ORDER  = ['IV','III','II','I'] as const;
const MASTER_BASE = TIER_ORDER.indexOf('MASTER') * 400; // 2800
const MASTER_IDX  = TIER_ORDER.indexOf('MASTER');

function rankToPoints(tier: string, division: string | null | undefined, lp: number): number {
  const t = (tier ?? '').toUpperCase();
  if (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER') {
    return MASTER_BASE + Math.max(0, lp);
  }
  const d  = (division ?? 'IV').toUpperCase();
  const ti = Math.max(0, TIER_ORDER.indexOf(t as any));
  const di = Math.max(0, DIV_ORDER.indexOf(d as any));
  return ti * 400 + (DIV_ORDER.length - 1 - di) * 100 + Math.max(0, lp);
}

const rankText = (tier: string, division: string | null | undefined, lp: number) => {
  const t = (tier ?? '').toUpperCase();
  return (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER')
    ? `${t} · ${lp} LP`
    : `${t} ${division ?? 'IV'} · ${lp} LP`;
};

// --- types ---
type ApiSeries = {
  date: string;
  tier: string;
  division?: string | null;
  lp: number;
  points?: number;
};
type ApiResp = {
  series: ApiSeries[];
  sessions: { id: string; scheduledStart: string; day: string }[];
};

// --- helpers ---
const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatDayLabel(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function RankGraph({ studentId }: { studentId: string }) {
  const { data } = useSWR<ApiResp>(
    `/api/admin/students/climb-since-session?studentId=${encodeURIComponent(studentId)}`,
    fetcher
  );

  const { chartData, yDomain, crestTiers, sessionXs } = useMemo(() => {
    const rows: ApiSeries[] = Array.isArray(data?.series) ? [...data!.series] : [];
    rows.sort((a, b) => a.date.localeCompare(b.date));

    const pts = rows.map(d => ({
      date: d.date,
      points: Number.isFinite(Number(d.points))
        ? Number(d.points)
        : rankToPoints(d.tier, d.division ?? 'IV', d.lp ?? 0),
      tier: (d.tier ?? '').toUpperCase(),
      division: (d.division ?? 'IV') as string | null,
      lp: d.lp ?? 0,
    })).filter(p => Number.isFinite(p.points));

    // --- determine seen tier range ---
    let minSeen = Infinity;
    let maxSeen = -Infinity;
    for (const p of pts) {
      const ti = Math.floor(p.points / 400);
      if (ti < minSeen) minSeen = ti;
      if (ti > maxSeen) maxSeen = ti;
    }

    if (!Number.isFinite(minSeen) || !Number.isFinite(maxSeen)) {
      // fallback window if no valid data
      minSeen = TIER_ORDER.indexOf('SILVER');
      maxSeen = TIER_ORDER.indexOf('PLATINUM');
    }

    // bottom = lowest seen tier, top = MASTER (0 LP)
    const bottomTier = Math.max(0, Math.floor(minSeen));
    const topTier = MASTER_IDX; // Always show up to Master 0 LP

    // domain spans exactly from bottom tier start → Master 0 LP
    const yDomain: [number, number] = [bottomTier * 400, topTier * 400];

    // crests: include all tiers from bottom → top (Master included)
    const crestTiers = [];
    for (let ti = bottomTier; ti <= topTier; ti++) {
      crestTiers.push({ ti, tier: TIER_ORDER[ti] as string, value: ti * 400 });
    }

    const sessionXs = (data?.sessions ?? []).map(s => s.day);
    return { chartData: pts, yDomain, crestTiers, sessionXs };
  }, [data]);

  // overlay crest column
  const CREST_COL = 44;
  const CREST_SIZE = 24;

  const pctFromPoints = (v: number, yDomain: [number, number]) => {
    const [y0, y1] = yDomain;
    const span = Math.max(1, y1 - y0);
    return Math.min(1, Math.max(0, (v - y0) / span));
  };

  return (
    <div className="relative w-full h-full">
      {/* Left crest column */}
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{ width: CREST_COL }}
      >
        {crestTiers.map(({ ti, tier, value }) => {
          const pct = pctFromPoints(value, yDomain);
          const topPct = 100 - pct * 100;
          const src = rankMiniCrestSvg(tier as any);
          return (
            <img
              key={ti}
              src={src}
              alt={tier}
              width={CREST_SIZE}
              height={CREST_SIZE}
              style={{
                position: 'absolute',
                left: (CREST_COL - CREST_SIZE) / 2,
                top: `calc(${topPct}% - ${CREST_SIZE / 2}px)`,
                userSelect: 'none',
              }}
            />
          );
        })}
      </div>

      {/* Chart area */}
      <div className="w-full h-full" style={{ paddingLeft: CREST_COL }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
          >
            <XAxis dataKey="date" tick={false} tickLine={false} axisLine height={1} />
            <YAxis
              type="number"
              domain={yDomain}
              tick={false}
              tickLine={false}
              width={2}
              axisLine={{ stroke: 'rgba(255,255,255,0.18)' }}
            />

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
                const d = payload[0].payload as {
                  date: string; tier: string; division: string | null; lp: number;
                };
                const isSessionDay = !!(data?.sessions ?? []).some(s => s.day === d.date);
                return (
                  <div className="bg-zinc-900/90 text-white text-xs px-2 py-1 rounded">
                    <div>{rankText(d.tier, d.division, d.lp)}</div>
                    <div>
                      {formatDayLabel(d.date)}
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
    </div>
  );
}

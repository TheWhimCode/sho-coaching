// src/app/admin/students/_components/RankCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { rankEmblemUrl, type RankTier } from '@/lib/league/datadragon';

type Props = {
  puuid: string;
  server: string;
  widthClass?: string;
  heightClass?: string; // e.g. "h-20"
  zoom?: number;        // e.g. 2.2
  className?: string;
};

type RankData = {
  tier: string;
  lp: number;
  wins: number;
  losses: number;
  division?: string; // e.g. "I", "II", "III", "IV"
  rank?: string;     // some APIs use "rank" instead of "division"
} | null;

// Tier → hex color (tweak as you like)
const RANK_COLOR: Record<string, string> = {
  IRON:        '#6E6E6E',
  BRONZE:      '#B26A2E',
  SILVER:      '#A5A5A5',
  GOLD:        '#D4AF37',
  PLATINUM:    '#00E5FF',
  EMERALD:     '#1ABC9C',
  DIAMOND:     '#00B5CC',
  MASTER:      '#C84CFF',
  GRANDMASTER: '#FF4C4C',
  CHALLENGER:  '#FFD700',
};

export default function RankCard({
  puuid,
  server,
  widthClass,
  heightClass = 'h-20',
  zoom = 2.2,
  className = '',
}: Props) {
  const [data, setData] = useState<RankData>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!puuid || !server) return;
    const c = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr(null);
        const r = await fetch(
          `/api/riot/rank?server=${encodeURIComponent(server)}&puuid=${encodeURIComponent(puuid)}`,
          { signal: c.signal }
        );
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || j.detail || `Rank ${r.status}`);
        setData(j.solo ?? null);
      } catch (e: any) {
        if (!c.signal.aborted) { setErr(String(e?.message || e)); setData(null); }
      } finally {
        if (!c.signal.aborted) setLoading(false);
      }
    })();
    return () => c.abort();
  }, [puuid, server]);

  if (loading) return <div className="text-sm text-zinc-400">Loading rank…</div>;
  if (err)     return <div className="text-sm text-amber-400">{err}</div>;
  if (!data)   return <div className="text-sm text-zinc-300">Unranked</div>;

  const { tier, lp, wins, losses } = data;
  const tierUpper = tier?.toUpperCase?.() || '';
  const emblem = rankEmblemUrl(tier as RankTier);
  const color  = RANK_COLOR[tierUpper] || '#ffffff';

  // Show division for all tiers below Master/GM/Challenger.
  const isTopTier = tierUpper === 'MASTER' || tierUpper === 'GRANDMASTER' || tierUpper === 'CHALLENGER';
  const division = (data?.division ?? data?.rank ?? '').toString(); // fallback to whatever field exists
  const tierLine = isTopTier
    ? `${tier} ${lp} LP`
    : `${tier}${division ? ` ${division}` : ''} ${lp} LP`;

  return (
    <div className={`inline-flex flex-col items-center justify-center p-0 ${widthClass ?? ''} ${className}`}>
      {/* Emblem (zoomed; overflow visible so PNG padding doesn't clip) */}
      <div className={`relative ${heightClass} w-full`} style={{ overflow: 'visible' }}>
        <img
          src={emblem}
          alt={tier}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
            userSelect: 'none',
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/emblems/placeholder.png'; }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text */}
      <div className="mt-3 text-center leading-tight">
        <p className="font-bold text-base" style={{ color }}>
          {tierLine}
        </p>
        <p className="text-sm text-zinc-300">
          {wins}W - {losses}L ({Math.round((wins / (wins + losses)) * 100)}%)
        </p>
      </div>
    </div>
  );
}

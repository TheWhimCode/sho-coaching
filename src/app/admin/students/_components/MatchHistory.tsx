'use client';
import { useMemo } from 'react';

export default function MatchHistory({
  matches = [],
  puuid,
}: {
  matches?: any[];
  puuid?: string;
}) {
  const list = useMemo(() => (Array.isArray(matches) ? matches : []), [matches]);

  // relative time: show "Xd Xh", but:
  // - no "d" if < 1 day (show "Xh")
  // - no "h" if >= 2 days (show "Xd")
  function fmtRelative(whenMs: number | null | undefined): string | null {
    if (!whenMs) return null;
    const now = Date.now();
    const diffMs = Math.max(0, now - Number(whenMs));
    const H = 3600_000;
    const D = 24 * H;

    const days = Math.floor(diffMs / D);
    const hours = Math.floor((diffMs % D) / H);

    if (days >= 2) return `${days}d ago`;
    if (days >= 1) return `${days}d ${hours}h ago`;
    return `${Math.floor(diffMs / H)}h ago`;
  }

  return (
    <>
      {list.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-400">No recent SoloQ games.</div>
      ) : (
        <ul className="mt-4 space-y-4">
          {list.map((m, i) => {
            const info = m?.info;
            if (!info) return null;

            const p =
              (info.participants || []).find((x: any) => (puuid ? x.puuid === puuid : false)) ||
              (info.participants || [])[0];
            if (!p) return null;

            const win = !!p.win;
            const k = p.kills ?? 0,
              d = p.deaths ?? 0,
              a = p.assists ?? 0;
            const kda = ((k + a) / Math.max(1, d)).toFixed(2);
            const champ = p.championName ?? '—';
            const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0);

            // duration in seconds
            const sec =
              typeof info.gameDuration === 'number'
                ? info.gameDuration
                : typeof info.gameDuration === 'string'
                ? parseInt(info.gameDuration, 10)
                : null;

            const mmss =
              sec != null
                ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
                : null;

            // CS/min
            const csPerMin =
              sec && sec > 0 ? (cs * 60) / sec : null;
            const csPerMinStr = csPerMin != null ? ` (${csPerMin.toFixed(1)})` : '';

            // relative played time
            const playedAtMs =
              info.gameStartTimestamp ?? info.gameCreation ?? info.gameEndTimestamp ?? null;
            const rel = fmtRelative(playedAtMs);

            return (
              <li
                key={m.metadata?.matchId ?? info.gameId ?? i}
                className={[
                  // ↓ 20% lower height: reduce padding (p-5→p-4; sm:p-6→sm:p-5)
                  'w-full rounded-2xl p-4 sm:p-5 ring-1 shadow transition text-white',
                  win
                    ? 'bg-blue-600/20 ring-blue-400/25 hover:ring-blue-300/40'
                    : 'bg-rose-600/20 ring-rose-400/25 hover:ring-rose-300/40',
                ].join(' ')}
              >
                <h4 className="text-2xl font-extrabold tracking-tight">
                  {champ} <span className="font-bold">{k}/{d}/{a}</span>
                </h4>
                <div className="mt-1 text-base text-zinc-200">
                  KDA {kda} • CS {cs}{csPerMinStr}
                  {mmss ? ` • ${mmss}` : ''}
                  {rel ? ` • ${rel}` : ''}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

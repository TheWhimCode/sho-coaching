// src/app/admin/students/_components/MatchHistory.tsx
'use client';
import { useMemo } from 'react';

export default function MatchHistory({
  matches = [],
}: {
  matches?: any[];
}) {
  const list = useMemo(() => Array.isArray(matches) ? matches : [], [matches]);

  return (
    <>
      <h3 className="text-lg font-semibold">Recent Ranked Solo (420)</h3>

      {list.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-400">No recent SoloQ games.</div>
      ) : (
        <ul className="mt-4 space-y-4">
          {list.map((m, i) => {
            const info = m?.info;
            if (!info) return null;
            const p = (info.participants || [])[0];
            if (!p) return null;

            const win = !!p.win;
            const k = p.kills ?? 0, d = p.deaths ?? 0, a = p.assists ?? 0;
            const kda = ((k + a) / Math.max(1, d)).toFixed(2);
            const champ = p.championName ?? '—';
            const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0);

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

            const playedAtMs =
              info.gameStartTimestamp ?? info.gameCreation ?? info.gameEndTimestamp ?? null;
            const playedAt = playedAtMs ? new Date(playedAtMs).toLocaleString() : null;

            return (
              <li
                key={m.metadata?.matchId ?? info.gameId ?? i}
                className={[
                  'w-full rounded-2xl p-5 sm:p-6 ring-1 shadow transition text-white',
                  win
                    ? 'bg-blue-600/20 ring-blue-400/25 hover:ring-blue-300/40'
                    : 'bg-rose-600/20 ring-rose-400/25 hover:ring-rose-300/40',
                ].join(' ')}
              >
                <h4 className="text-2xl font-extrabold tracking-tight">
                  {champ} <span className="font-bold">{k}/{d}/{a}</span>
                </h4>
                <div className="mt-1 text-base text-zinc-200">
                  KDA {kda} • CS {cs}
                  {mmss ? ` • ${mmss}` : ''}
                  {playedAt ? ` • ${playedAt}` : ''}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

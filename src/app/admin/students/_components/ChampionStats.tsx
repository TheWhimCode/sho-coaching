// src/app/admin/students/_components/ChampionStats.tsx
'use client';
import { memo } from 'react';

export default memo(function ChampionStats({
  rows,
}: {
  rows: Array<{
    championId: number;
    championName: string;
    games: number;
    winrate: number;
    kda: number;
    k: number; d: number; a: number;
    cs: number;
  }> | null;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold">SoloQ — By Champion</h3>

      {!rows ? (
        <div className="mt-3 text-sm text-zinc-400">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-3 text-sm text-zinc-400">No SoloQ games.</div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.championId} className="text-sm text-zinc-200">
              <span className="font-bold">{r.championName}</span> — {r.games} games — {r.winrate}% WR — {r.kda} KDA — {r.k}/{r.d}/{r.a} — {r.cs} CS
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

// src/app/admin/students/_components/ChampionStats.tsx
'use client'
import { memo, useEffect } from 'react'

// ✅ DDragon helpers (single source of truth)
import {
  championAvatarByName,
  ensureLiveDDragonPatch,
} from '@/lib/league/datadragon'

export default memo(function ChampionStats({
  rows,
}: {
  rows: Array<{
    championId: number
    championName: string
    games: number
    winrate: number // percent, e.g. 60 means 60%
    kda: number
    k: number
    d: number
    a: number
    cs: number // average CS
  }> | null
}) {
  // Ensure we use the live DDragon patch (fallback still works if this fails)
  useEffect(() => {
    ensureLiveDDragonPatch()
  }, [])

  // tighter gap between columns
  const grid =
    'grid grid-cols-[40px_minmax(0,1fr)_80px_56px_64px_48px] items-center gap-x-2 px-1'

  const wrText = (wr: number) => {
    if (wr >= 70) return 'text-emerald-400'
    if (wr >= 60) return 'text-lime-300'
    if (wr >= 55) return 'text-amber-300'
    return 'text-zinc-300'
  }

  if (!rows) return <div className="mt-3 text-sm text-zinc-400">Loading…</div>
  if (rows.length === 0)
    return <div className="mt-3 text-sm text-zinc-400">No SoloQ games.</div>

  return (
    <div>
      <h3 className="text-base font-semibold text-zinc-100">Champion Performance</h3>

      {/* Header — identical columns to the list */}
      <div className={`${grid} mt-3 pb-1 text-[11px] uppercase tracking-wide text-zinc-500`}>
        <div className="col-span-2 pl-1">Champion</div>
        <div className="text-center">KDA</div>
        <div className="text-right">Games</div>
        <div className="text-right">WR</div>
        <div className="text-right">CS</div>
      </div>

      <ul className="divide-y divide-zinc-800/40">
        {rows.map((r) => {
          const icon = championAvatarByName(r.championName)
          return (
            <li key={r.championId} className={`${grid} py-2`}>
              {/* Image */}
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-black/30">
                <img
                  src={icon}
                  alt={r.championName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/champ-placeholder.png'
                  }}
                />
              </div>

              {/* Champion name */}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-5 text-zinc-100">
                  {r.championName}
                </div>
              </div>

              {/* KDA column: centered */}
              <div className="flex flex-col items-center leading-tight">
                <div className="text-sm font-semibold tabular-nums text-zinc-100">
                  {Number.isFinite(r.kda) ? r.kda.toFixed(1) : '-'}
                </div>
                <div className="text-[11px] tabular-nums text-zinc-500">
                  {r.k} / {r.d} / {r.a}
                </div>
              </div>

              {/* Games */}
              <div className="text-right text-sm tabular-nums text-zinc-200">{r.games}</div>

              {/* Winrate */}
              <div className="text-right text-sm font-semibold tabular-nums">
                <span className={wrText(r.winrate)}>{Math.round(r.winrate)}%</span>
              </div>

              {/* Average CS */}
              <div className="text-right text-sm tabular-nums text-zinc-300">{r.cs.toFixed(1)}</div>
            </li>
          )
        })}
      </ul>
    </div>
  )
})

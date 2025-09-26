// src/app/admin/students/_components/MatchHistory.tsx
'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { ensureLiveDDragonPatch } from '@/lib/league/datadragon'
import MatchRow from './_components/MatchHistory/MatchRow'
import MatchDetails from './_components/MatchHistory/MatchDetails'

export default function MatchHistory({
  matches = [],
  puuid,
}: {
  matches?: any[]
  puuid?: string
}) {
  const list = useMemo(() => (Array.isArray(matches) ? matches : []), [matches])
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        // Patch first
        await ensureLiveDDragonPatch()
        // Load runes + summoner spells without changing static imports
        const dd = await import('@/lib/league/datadragon')
        await Promise.all([
          dd.ensureRunesAssets?.(),
          dd.ensureSummonerSpellsAssets?.(),
        ])
        // Gate rendering until both maps are ready (if helpers exist)
        const runesOK = dd.areRunesReady ? dd.areRunesReady() : true
        const spellsOK = dd.areSummonerSpellsReady ? dd.areSummonerSpellsReady() : true
        setReady(runesOK && spellsOK)
      } catch {
        // Fail-open so UI still renders
        setReady(true)
      }
    })()
  }, [])

  const toggle = useCallback((id: string) => {
    setOpen((s) => ({ ...s, [id]: !s[id] }))
  }, [])

  if (!list.length) {
    return <div className="mt-4 text-sm text-zinc-400">No recent SoloQ games.</div>
  }

  // Hold rows until assets (runes + spells) are ready
  if (!ready) {
    return (
      <ul className="mt-3 space-y-2">
        {list.slice(0, Math.min(5, list.length)).map((_, i) => (
          <li key={i} className="w-full rounded-2xl p-3 ring-1 shadow text-white">
            <div className="animate-pulse grid grid-cols-[64px_minmax(0,1fr)_260px_110px] items-center gap-x-6">
              <div className="h-14 w-14 rounded-lg bg-zinc-800/60" />
              <div className="min-w-0">
                <div className="h-5 w-28 rounded bg-zinc-800/60" />
                <div className="mt-2 h-4 w-40 rounded bg-zinc-800/60" />
              </div>
              <div className="h-14 w-full rounded bg-zinc-800/40" />
              <div className="justify-self-end w-16">
                <div className="h-5 w-full rounded bg-zinc-800/60" />
                <div className="mt-2 h-3 w-12 rounded bg-zinc-800/60" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="mt-3 space-y-2">
      {list.map((m, i) => {
        const info = m?.info
        if (!info) return null
        const id = m?.metadata?.matchId ?? info?.gameId ?? String(i)
        return (
          <li key={id}>
            <MatchRow match={m} puuid={puuid} open={!!open[id]} onToggle={() => toggle(id)} />
            {open[id] && <MatchDetails match={m} puuid={puuid} />}
          </li>
        )
      })}
    </ul>
  )
}

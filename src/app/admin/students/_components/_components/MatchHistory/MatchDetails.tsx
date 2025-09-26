// src/app/admin/students/_components/_components/MatchHistory/MatchDetails.tsx
'use client'
import {
  championAvatarByName,
  itemIconUrl,
  runeIconsFromPerks,
  ensureRunesAssets,
  ensureSummonerSpellsAssets,
  summonerSpellIconById,
  runeStyleIconUrl,
} from '@/lib/league/datadragon'
import { useEffect } from 'react'

export default function MatchDetails({ match, puuid }: { match: any; puuid?: string }) {
  const info = match.info
  const parts: any[] = info.participants || []
  const blue = parts.filter((p) => p.teamId === 100)
  const red = parts.filter((p) => p.teamId === 200)
  const teams = info.teams || []

  // total seconds (for CS/min and dmg/min)
  const sec =
    typeof info.gameDuration === 'number'
      ? info.gameDuration
      : typeof info.gameDuration === 'string'
      ? parseInt(info.gameDuration, 10)
      : 0

  // max damage to champions in match for normalization
  const maxDmg =
    parts.reduce((mx, p: any) => Math.max(mx, Number(p?.totalDamageDealtToChampions || 0)), 0) || 1

  useEffect(() => {
    ensureRunesAssets()
    ensureSummonerSpellsAssets()
  }, [])

  return (
    <div className="rounded-b-2xl -mt-2 border-t border-white/10 bg-black/20 p-3">
      {/* Team summary */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {teams.map((t: any) => (
          <div key={t.teamId} className="space-y-1">
            <div className="font-semibold text-zinc-200">
              {t.teamId === 100 ? 'Blue' : 'Red'} • {t.win ? 'Win' : 'Defeat'}
            </div>
            <div className="text-zinc-300">
              Dragons {t.objectives?.dragon?.kills ?? 0} • Barons {t.objectives?.baron?.kills ?? 0} • Heralds {t.objectives?.riftHerald?.kills ?? 0} • Towers {t.objectives?.tower?.kills ?? 0}
            </div>
            {!!t.bans?.length && (
              <div className="flex flex-wrap gap-1">
                {t.bans.map((b: any, i: number) => (
                  <img
                    key={i}
                    src={championAvatarByName(String(b?.championId ?? ''))}
                    alt={`ban-${b?.championId}`}
                    className="h-6 w-6 rounded ring-1 ring-black/30"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Two team columns; vertical divider on right column */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-0">
        <TeamBlock title="Blue Team" players={blue} puuid={puuid} sec={sec} maxDmg={maxDmg} />
        <TeamBlock
          title="Red Team"
          players={red}
          puuid={puuid}
          sec={sec}
          maxDmg={maxDmg}
          className="md:border-l md:border-white/10 md:pl-3"
        />
      </div>
    </div>
  )
}

function TeamBlock({
  title,
  players,
  puuid,
  sec,
  maxDmg,
  className = '',
}: {
  title: string
  players: any[]
  puuid?: string
  sec: number
  maxDmg: number
  className?: string
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-sm font-semibold text-zinc-200">{title}</div>
      {/* Divider lines only */}
      <div className="divide-y divide-white/10">
        {players.map((pl) => (
          <PlayerLine key={pl.puuid} p={pl} sec={sec} maxDmg={maxDmg} highlight={pl.puuid === puuid} />
        ))}
      </div>
    </div>
  )
}

function PlayerLine({
  p,
  sec,
  maxDmg,
  highlight,
}: {
  p: any
  sec: number
  maxDmg: number
  highlight: boolean
}) {
  const perks = runeIconsFromPerks(p.perks)

  const champIcon = championAvatarByName(p.championName)

  const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0)
  const cspm = sec > 0 ? (cs * 60) / sec : null

  const dmg = Number(p?.totalDamageDealtToChampions || 0)
  const dpm = sec > 0 ? Math.round((dmg * 60) / sec) : null
  const ratio = Math.max(0, Math.min(1, dmg / Math.max(1, maxDmg)))

  // spells + runes (spells first), bare icons
  const s1 = summonerSpellIconById(p.summoner1Id)
  const s2 = summonerSpellIconById(p.summoner2Id)
  const keystone = perks.keystone
  const secondaryTree =
    perks.secondaryStyleId != null ? runeStyleIconUrl(perks.secondaryStyleId) : null

  // items: 2 rows (2x3) + trinket in top row col 4
  const mainItems = [0, 1, 2, 3, 4, 5].map(
    (i) => (p as any)[`item${i}`] as number | undefined
  )
  const trinket = (p as any).item6 as number | undefined
  const gridSlots: (number | null | undefined)[] = [
    mainItems[0],
    mainItems[1],
    mainItems[2],
    trinket,
    mainItems[3],
    mainItems[4],
    mainItems[5],
    null,
  ]

  // Make the row taller so left elements can be larger
  const ITEM = 22
  const BUILD_H = ITEM * 2 + 2 // two rows + 2px gap

  return (
    <div
      className={[
        'flex items-stretch gap-2 py-1.5 px-0 text-[14px] leading-5',
        highlight ? 'bg-white/5' : '',
      ].join(' ')}
      style={{ minHeight: BUILD_H }}
    >
      {/* Champ: full row height */}
      <img
        src={champIcon}
        alt={p.championName}
        className="rounded"
        style={{ height: BUILD_H, width: BUILD_H }}
      />

      {/* Left text: larger KDA; CS on next line with CS/min */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-zinc-200">{p.summonerName}</div>
        <div className="mt-0.5 font-extrabold text-[16px] text-zinc-50">
          {p.kills}/{p.deaths}/{p.assists}
        </div>
        <div className="text-[13px] text-zinc-300">
          CS {cs}
          {cspm != null ? ` (${cspm.toFixed(1)})` : ''}
        </div>
      </div>

      {/* Builds: spells | runes | items — tight gaps */}
      <div className="flex items-center gap-1.5" style={{ height: BUILD_H }}>
        {/* Spells column */}
        <div className="flex flex-col gap-1">
          <IconOrBox src={s1} size={ITEM} />
          <IconOrBox src={s2} size={ITEM} />
        </div>

        {/* Runes column */}
        <div className="flex flex-col gap-1">
          <IconOrBox src={keystone} size={ITEM} contain />
          <IconOrBox src={secondaryTree} size={ITEM} contain />
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-4 gap-1">
          {gridSlots.map((id, idx) => (
            <ItemCell key={idx} id={id ?? undefined} size={ITEM} />
          ))}
        </div>
      </div>

      {/* Damage bar column */}
      <div className="ml-2 w-40">
        <div className="mb-1 text-right text-[12px] text-zinc-300">
          {fmtK(dmg)}
          {dpm != null ? ` (${dpm}/m)` : ''}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400/90"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- UI bits -------------------------------- */

function ItemCell({ id, size = 22 }: { id?: number; size?: number }) {
  const src = id ? itemIconUrl(id) : null
  const style = { height: size, width: size }
  return src ? (
    <img
      src={src}
      alt="item"
      className="rounded bg-zinc-800/60"
      style={style}
      loading="lazy"
    />
  ) : (
    <div className="rounded bg-zinc-800/60" style={style} aria-hidden />
  )
}

/** Bare icon (no wrappers). `contain` for rune styling to avoid cropping. */
function IconOrBox({
  src,
  size = 22,
  alt = '',
  contain = false,
}: {
  src?: string | null
  size?: number
  alt?: string
  contain?: boolean
}) {
  const style = { height: size, width: size }
  if (!src) return <div className="rounded bg-zinc-800/60" style={style} aria-hidden />
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded ring-1 ring-white/10 ${contain ? 'object-contain' : 'object-cover'}`}
      style={style}
      loading="lazy"
    />
  )
}

/* -------------------------------- helpers --------------------------------- */

function fmtK(n: number) {
  if (!Number.isFinite(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

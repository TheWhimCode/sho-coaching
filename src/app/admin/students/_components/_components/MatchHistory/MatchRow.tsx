'use client'

import {
  championAvatarByName,
  itemIconUrl,
  runeIconsFromPerks,
  runeStyleIconUrl,
  summonerSpellIconById,
} from '@/lib/league/datadragon'

export default function MatchRow({
  match, puuid, open, onToggle,
}: { match: any; puuid?: string; open: boolean; onToggle: () => void }) {
  const info = match.info
  const p =
    (info.participants || []).find((x: any) => (puuid ? x.puuid === puuid : false)) ||
    (info.participants || [])[0]
  if (!p) return null

  const win = !!p.win
  const k = p.kills ?? 0, d = p.deaths ?? 0, a = p.assists ?? 0
  const kda = ((k + a) / Math.max(1, d)).toFixed(2)
  const champ = p.championName ?? '—'
  const cs = (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0)

  const sec = Number(info.gameDuration ?? 0) || 0
  const mmss = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  const rel = fmtRelative(info.gameStartTimestamp ?? info.gameCreation ?? info.gameEndTimestamp ?? null)

  const champIcon = championAvatarByName(champ)

  // Runes (keystone + secondary tree)
  const perks = runeIconsFromPerks(p.perks)
  const keystone = perks.keystone
  const secondaryTree = perks.secondaryStyleId != null ? runeStyleIconUrl(perks.secondaryStyleId) : null

  // Summoner spells
  const s1 = summonerSpellIconById(p.summoner1Id)
  const s2 = summonerSpellIconById(p.summoner2Id)

  // Items: 2x3 + trinket in top-row col 4
  const mainItems = [0, 1, 2, 3, 4, 5].map((i) => (p as any)[`item${i}`] as number | undefined)
  const trinket = (p as any).item6 as number | undefined
  const gridSlots: (number | null | undefined)[] = [
    mainItems[0], mainItems[1], mainItems[2], trinket,
    mainItems[3], mainItems[4], mainItems[5], null,
  ]

  // Build block height = 2 item rows (26px) + gap (4px) + vertical padding (8px) = 64px
  const ITEM_SIZE = 26
  const BUILD_H = ITEM_SIZE * 2 + 4 + 8 // px

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={[
        // slightly reduced edge padding
        'w-full rounded-2xl px-2.5 py-2 ring-1 shadow transition text-white text-left',
        // tighter column gaps
        'grid grid-cols-[64px_minmax(0,1fr)_260px_100px] items-center gap-x-4',
        win
          ? 'bg-blue-600/20 ring-blue-400/25 hover:ring-blue-300/40'
          : 'bg-rose-600/20 ring-rose-400/25 hover:ring-rose-300/40',
      ].join(' ')}
    >
      {/* Avatar */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/30">
        <img
          src={champIcon}
          alt={champ}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/images/champ-placeholder.png')}
        />
      </div>

      {/* Center: more legible text; reduced spacing to the left block */}
      <div className="min-w-0">
        <h4 className="truncate text-[20px] font-extrabold leading-7 text-zinc-50">{k}/{d}/{a}</h4>
        <div className="mt-0 text-[13px] text-zinc-300 leading-5">
          {/* reduced “average KDA” prominence */}
          KDA {kda} • CS {cs}{sec ? ` (${((cs * 60) / sec).toFixed(1)})` : ''}
        </div>
      </div>

      {/* Builds: [spells] [runes] [items] — icons stretch full height, tighter inner padding */}
      <div className="flex items-stretch gap-1" style={{ height: BUILD_H }}>
        {/* Spells column (first) */}
        <div className="flex h-full w-[44px] flex-col gap-1 rounded-lg bg-zinc-900/50 p-1 ring-1 ring-white/10">
          <BuildIcon src={s1} alt="Spell 1" />
          <BuildIcon src={s2} alt="Spell 2" />
        </div>

        {/* Runes column (second) */}
        <div className="flex h-full w-[44px] flex-col gap-1 rounded-lg bg-zinc-900/50 p-1 ring-1 ring-white/10">
          <BuildIcon src={keystone} alt="Keystone" />
          <BuildIcon src={secondaryTree} alt="Secondary" />
        </div>

        {/* Items grid (2x4; trinket at top col 4) */}
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-zinc-900/40 p-1 ring-1 ring-white/10">
          {gridSlots.map((id, idx) => (
            <ItemCell key={idx} id={id ?? undefined} size={ITEM_SIZE} />
          ))}
        </div>
      </div>

      {/* Right: duration + time-since */}
      <div className="justify-self-end text-right leading-tight">
        <div className="text-sm font-semibold text-zinc-100">{mmss}</div>
        <div className="mt-0.5 text-[11px] text-zinc-300">{rel ?? ''}</div>
      </div>

      <div className="sr-only">{open ? 'Collapse' : 'Expand'}</div>
    </button>
  )
}

/* --------------------------------- UI bits -------------------------------- */

function ItemCell({ id, size = 26 }: { id?: number; size?: number }) {
  const src = id ? itemIconUrl(id) : null
  const style = { height: size, width: size }
  return src ? (
    <img src={src} alt="item" className="rounded bg-zinc-800/60" style={style} loading="lazy" />
  ) : (
    <div className="rounded bg-zinc-800/60" style={style} aria-hidden />
  )
}

/** Full-height cell inside the spells/runes columns */
function BuildIcon({ src, alt = '' }: { src?: string | null; alt?: string }) {
  return (
    <div className="flex-1 overflow-hidden rounded bg-zinc-800/40 ring-1 ring-white/10">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-contain" loading="lazy" />
      ) : (
        <div className="h-full w-full" aria-hidden />
      )}
    </div>
  )
}

/* -------------------------------- utils ----------------------------------- */

function fmtRelative(whenMs: number | null | undefined): string | null {
  if (!whenMs) return null
  const now = Date.now()
  const diffMs = Math.max(0, now - Number(whenMs))
  const H = 3600_000, D = 24 * H
  const days = Math.floor(diffMs / D)
  const hours = Math.floor((diffMs % D) / H)
  if (days >= 2) return `${days}d ago`
  if (days >= 1) return `${days}d ${hours}h ago`
  return `${Math.floor(diffMs / H)}h ago`
}

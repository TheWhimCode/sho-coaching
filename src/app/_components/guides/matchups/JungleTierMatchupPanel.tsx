"use client";

import clsx from "clsx";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import GuideImage from "@/app/_components/guides/GuideImage";
import { JungleTierMatchupPanelSkeleton } from "@/app/_components/guides/GuideSectionSkeletons";
import GuideNewBadge from "@/app/_components/guides/GuideNewBadge";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { useGuideSectionImages } from "@/app/_components/guides/useGuideSectionImages";
import type {
  GuideJungleTierMatchupPageData,
  SerializedJungleTier,
  SerializedJungleTierMatchup,
  SerializedMatchupUpgradeItem,
} from "@/lib/guides/matchupGuideTypes";
import { collectJungleTierMatchupSectionImageUrls } from "@/lib/guides/preloadGuideImages";
import { guideChampionIconImgClass, guideSectionHeaderPadClass, guideSectionTitleClass } from "@/lib/guides/guideTheme";

const METER_TONE = {
  blue: {
    label: "text-[#73B3D2]",
    track: "bg-[#73B3D2]/20",
    fill: "bg-[#73B3D2] shadow-[0_0_3px_1px_rgba(115,179,210,0.38),0_0_6px_2px_rgba(115,179,210,0.2)]",
  },
  orange: {
    label: "text-[#C4895C]",
    track: "bg-[#C4895C]/22",
    fill: "bg-[#C4895C] shadow-[0_0_3px_1px_rgba(196,137,92,0.28),0_0_6px_2px_rgba(196,137,92,0.14)]",
  },
  red: {
    label: "text-[#FF526C]",
    track: "bg-[#FF526C]/25",
    fill: "bg-[#FF526C] shadow-[0_0_3px_1px_rgba(255,82,108,0.34),0_0_6px_2px_rgba(255,82,108,0.18)]",
  },
} as const;

function meterTone(value: number) {
  if (value >= 5) return METER_TONE.red;
  if (value >= 3) return METER_TONE.orange;
  return METER_TONE.blue;
}

const POSSESSION_TONE = {
  low: {
    label: "Useless possession",
    card: "border-[#F5E6D3]/8 bg-[#120F19]/40",
    labelText: "text-[#F5E6D3]/34",
    score: "text-[#F5E6D3]/54",
  },
  decent: {
    label: "Underwhelming possession",
    card: "border-[#A6C4D4]/14 bg-[#18202A]/35",
    labelText: "text-[#B8D8EA]/46",
    score: "text-[#D7E8EF]/64",
  },
  great: {
    label: "Great possession",
    card: "border-[#73B3D2]/22 bg-[#163040]/35",
    labelText: "text-[#73B3D2]/68",
    score: "text-[#B8E4F7] [text-shadow:0_0_12px_rgba(115,179,210,0.16)]",
  },
  amazing: {
    label: "Amazing possession",
    card: "border-[#E78BC0]/48 bg-[linear-gradient(145deg,rgba(231,139,192,0.2),rgba(65,38,73,0.28)_70%)] shadow-[0_0_22px_rgba(231,139,192,0.1)]",
    labelText: "text-[#F0ABCF]",
    score: "text-[#FFD0E6] [text-shadow:0_0_18px_rgba(240,171,207,0.38)]",
  },
  perfect: {
    label: "Perfect possession",
    card: "border-[#E8C56B]/58 bg-[linear-gradient(145deg,rgba(232,197,107,0.24),rgba(75,57,27,0.26)_70%)] shadow-[0_0_26px_rgba(232,197,107,0.13)]",
    labelText: "text-[#F6D67A]",
    score: "text-[#FFE8A0] [text-shadow:0_0_20px_rgba(232,197,107,0.42)]",
  },
} as const;

function possessionTone(value: number) {
  if (value === 10) return POSSESSION_TONE.perfect;
  if (value >= 8) return POSSESSION_TONE.amazing;
  if (value >= 6) return POSSESSION_TONE.great;
  if (value >= 4) return POSSESSION_TONE.decent;
  return POSSESSION_TONE.low;
}

const METER_HINTS = {
  "Invade Threat": {
    low: "They can't really invade",
    mid: "They might look for invade angles",
    high: "They're always looking to find and kill you",
  },
  "Tempo Pressure": {
    low: "Doesn't punish you as hard for wasting time",
    mid: "They can crossmap comfortably",
    high: "Waste time and they will always take your camps",
  },
  "1v1 Power": {
    low: "You will usually be able to win",
    mid: "They are generally favored until LDR",
    high: "If you go in they will always annihilate you",
  },
} as const;

function meterHint(label: keyof typeof METER_HINTS, value: number) {
  const hints = METER_HINTS[label];
  if (value >= 5) return hints.high;
  if (value >= 3) return hints.mid;
  return hints.low;
}

const DETAIL_DURATION_MS = 320;
const DETAIL_HEIGHT_TRANSITION =
  "overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

const TIER_TONE = {
  nightmare: {
    title: "text-[#F87171]",
    iconRing: "ring-[#F87171]/70",
    cardSelected: "border-[#F87171]/55 bg-[#F87171]/8 ring-1 ring-[#F87171]/25",
    cardIdle: "border-[#F87171]/22 bg-[#1E1724]/55 hover:border-[#F87171]/35 hover:bg-[#F87171]/5",
    nameSelected: "text-[#F87171]",
    tierBorder: "border-[#F87171]/18",
    detailRing: "ring-[#F87171]/35",
  },
  difficult: {
    title: "text-[#FB923C]",
    iconRing: "ring-[#FB923C]/65",
    cardSelected: "border-[#FB923C]/50 bg-[#FB923C]/8 ring-1 ring-[#FB923C]/22",
    cardIdle: "border-[#FB923C]/20 bg-[#1E1724]/55 hover:border-[#FB923C]/32 hover:bg-[#FB923C]/5",
    nameSelected: "text-[#FB923C]",
    tierBorder: "border-[#FB923C]/16",
    detailRing: "ring-[#FB923C]/35",
  },
  even: {
    title: "text-[#B8D8EA]",
    iconRing: "ring-[#B8D8EA]/55",
    cardSelected: "border-[#B8D8EA]/45 bg-[#B8D8EA]/8 ring-1 ring-[#B8D8EA]/20",
    cardIdle: "border-[#B8D8EA]/18 bg-[#1E1724]/55 hover:border-[#B8D8EA]/30 hover:bg-[#B8D8EA]/5",
    nameSelected: "text-[#B8D8EA]",
    tierBorder: "border-[#B8D8EA]/14",
    detailRing: "ring-[#B8D8EA]/35",
  },
  favorable: {
    title: "text-[#8ECAE6]",
    iconRing: "ring-[#8ECAE6]/60",
    cardSelected: "border-[#8ECAE6]/48 bg-[#8ECAE6]/8 ring-1 ring-[#8ECAE6]/22",
    cardIdle: "border-[#8ECAE6]/20 bg-[#1E1724]/55 hover:border-[#8ECAE6]/32 hover:bg-[#8ECAE6]/5",
    nameSelected: "text-[#8ECAE6]",
    tierBorder: "border-[#8ECAE6]/15",
    detailRing: "ring-[#8ECAE6]/35",
  },
  free: {
    title: "text-[#7AADD6]",
    iconRing: "ring-[#7AADD6]/70",
    cardSelected: "border-[#7AADD6]/55 bg-[#7AADD6]/8 ring-1 ring-[#7AADD6]/25",
    cardIdle: "border-[#7AADD6]/22 bg-[#1E1724]/55 hover:border-[#7AADD6]/35 hover:bg-[#7AADD6]/5",
    nameSelected: "text-[#7AADD6]",
    tierBorder: "border-[#7AADD6]/18",
    detailRing: "ring-[#7AADD6]/35",
  },
} as const;

type TierMatchupEntry = {
  tier: SerializedJungleTier;
  matchup: SerializedJungleTierMatchup;
};

function TierIconButton({
  matchup,
  tone,
  selected,
  onSelect,
}: {
  matchup: SerializedJungleTierMatchup;
  tone: SerializedJungleTier["tone"];
  selected: boolean;
  onSelect: () => void;
}) {
  const accent = TIER_TONE[tone];
  const clickable = Boolean(matchup.explanation?.trim());

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={clickable ? onSelect : undefined}
      aria-label={clickable ? matchup.name : `${matchup.name}, no matchup notes`}
      className={clsx(
        "relative flex min-w-0 flex-col items-center rounded-lg border px-1 py-1.5 sm:py-2",
        "transition-[border-color,background-color,box-shadow,opacity] duration-200 ease-out",
        clickable
          ? selected
            ? accent.cardSelected
            : accent.cardIdle
          : "cursor-not-allowed border-[#F5E6D3]/8 bg-[#120F19]/35 opacity-40"
      )}
    >
      {matchup.banBadge ? (
        <span className="pointer-events-none absolute left-1/2 -top-px -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-[#1E1724] px-1 text-[8px] font-semibold leading-none text-[#F0ABCF] sm:text-[9px]">
          {matchup.banBadge}
        </span>
      ) : null}
      {matchup.isNew ? (
        <GuideNewBadge className="pointer-events-none absolute right-2 top-1 z-10 text-[6px] sm:text-[7px]" />
      ) : null}
      <div
        className={clsx(
          "relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#352839]/80 ring-2 sm:h-9 sm:w-9",
          clickable ? accent.iconRing : "ring-[#F5E6D3]/12"
        )}
      >
        <GuideImage
          src={matchup.icon}
          alt={matchup.name}
          loading="lazy"
          className={guideChampionIconImgClass}
        />
      </div>
      <span
        className={clsx(
          "mt-1 line-clamp-2 w-full text-center text-[0.5rem] font-medium leading-tight sm:text-[0.58rem]",
          clickable
            ? selected
              ? accent.nameSelected
              : "text-[#F5E6D3]/78"
            : "text-[#F5E6D3]/40"
        )}
      >
        {matchup.name}
      </span>
    </button>
  );
}

function TierRow({
  tier,
  selectedId,
  onSelect,
}: {
  tier: SerializedJungleTier;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const accent = TIER_TONE[tier.tone];

  return (
    <div
      className={clsx(
        "max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0",
        "rounded-xl border bg-[#1E1724]/35 px-3 py-3 sm:px-4 sm:py-3.5",
        accent.tierBorder
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h3 className={clsx("text-xs font-bold uppercase tracking-[0.14em] sm:text-sm", accent.title)}>
          {tier.label}
        </h3>
        <p className="text-[0.65rem] normal-case text-[#F5E6D3]/48 sm:text-xs">{tier.subtitle}</p>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-1.5 md:grid-cols-8 lg:grid-cols-10">
        {tier.matchups.map((matchup) => (
          <TierIconButton
            key={matchup.id}
            matchup={matchup}
            tone={tier.tone}
            selected={selectedId === matchup.id}
            onSelect={() => {
              onSelect(matchup.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MatchupUpgradeItem({
  item,
}: {
  item: SerializedMatchupUpgradeItem;
}) {
  return (
    <div className="mt-5 flex min-h-12 w-full items-center gap-3 border-y border-[#E8C56B]/18 bg-[#E8C56B]/[0.035] px-3 py-2">
      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-sm bg-[#120F19] shadow-[0_0_10px_rgba(232,197,107,0.16)]">
        {item.icon ? (
          <GuideImage src={item.icon} alt={item.name} loading="lazy" className="h-full w-full scale-125 object-cover" />
        ) : (
          <span aria-hidden className="flex h-full w-full items-center justify-center text-xs font-bold text-[#F6D67A]/70">+</span>
        )}
      </div>
      <p className="min-w-0 truncate text-xs font-semibold text-[#F5E6D3]/82">{item.name}</p>
      {item.purchaseOrder ? <span className="whitespace-nowrap text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#F5E6D3]/48">{item.purchaseOrder}</span> : null}
      <span className="ml-auto whitespace-nowrap text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#F6D67A]/70">Higher value</span>
    </div>
  );
}

function MatchupDetailPanel({
  entry,
  guideTextIcons,
}: {
  entry: TierMatchupEntry;
  guideTextIcons: Record<string, string>;
}) {
  const accent = TIER_TONE[entry.tier.tone];
  const detailText = entry.matchup.explanation;
  const possession = possessionTone(entry.matchup.possessionValue);
  const isExceptionalPossession = entry.matchup.possessionValue >= 8;

  const explanationBody = (
    <>
      {detailText?.split("\n").map((paragraph, index) => (
        <p key={index} className={index > 0 ? "mt-[0.5em]" : undefined}>
          {renderGuideHighlightedText(paragraph, guideTextIcons)}
        </p>
      ))}
    </>
  );

  return (
    <div className="w-full min-w-0 max-w-full rounded-2xl border border-[#F0ABCF]/14 bg-[#1E1724]/65 p-4 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-[8rem_minmax(0,1fr)_10rem] sm:items-stretch sm:gap-7">
        <div className="flex items-center gap-3 sm:h-full sm:flex-col sm:items-start sm:border-r sm:border-[#F5E6D3]/10 sm:pr-6">
            <div className={clsx("relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#352839]/80 ring-1 sm:h-28 sm:w-28", accent.detailRing)}>
              <GuideImage src={entry.matchup.icon} alt={entry.matchup.name} loading="lazy" className={guideChampionIconImgClass} />
            </div>
            <div>
              <p className={clsx("text-base font-bold sm:text-lg", accent.nameSelected)}>{entry.matchup.name}</p>
              <p className="mt-0.5 text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.08em] text-[#F5E6D3]/42">
                {entry.matchup.gameplayStyle
                  ? entry.matchup.gameplayStyle.split(" / ").map((part, index, parts) => (
                      <span key={`${part}-${index}`}>
                        {index > 0 ? <br /> : null}
                        {part}
                        {index === 0 && parts.length > 1 ? " /" : null}
                      </span>
                    ))
                  : `${entry.tier.label} matchup`}
              </p>
            </div>
        </div>

        <div className="flex min-w-0 flex-col justify-start">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#F0ABCF]/65">Matchup notes</p>
          {detailText ? (
            <div className="mt-2 min-w-0 text-[0.98rem] leading-7 text-[#F5E6D3]/76 sm:text-[1.05rem]">{explanationBody}</div>
          ) : (
            <p className="mt-2 text-sm italic leading-6 text-[#F5E6D3]/38">No matchup notes yet.</p>
          )}

          {entry.matchup.upgradeItem ? <MatchupUpgradeItem item={entry.matchup.upgradeItem} /> : null}

          {entry.matchup.snapshot ? (
            <div className="mt-5 flex w-full max-w-xl flex-col gap-1.5">
                {([
                  ["Invade Threat", entry.matchup.snapshot.invadePressure],
                  ["Tempo Pressure", entry.matchup.snapshot.oneVOneThreat],
                  ["1v1 Power", entry.matchup.snapshot.tempo],
                ] as const).map(([label, value]) => {
                  const tone = meterTone(value);
                  const hint = meterHint(label, value);
                  const hintId = `${entry.matchup.id}-${label}-hint`;
                  return (
                    <div key={label} className="group relative -mx-1.5 grid grid-cols-[7rem_minmax(0,12rem)_minmax(0,1fr)] items-center gap-x-4 rounded-md px-1.5 py-1.5 transition-colors hover:bg-[#F5E6D3]/10" aria-describedby={hintId}>
                      <div className={clsx("text-[0.62rem] font-bold uppercase tracking-[0.13em]", tone.label)}>
                        <span>{label}</span>
                      </div>
                      <div className="relative">
                        {value >= 5 ? <p className="absolute right-0 bottom-full mb-0.5 text-[0.48rem] font-bold uppercase leading-none tracking-[0.12em] text-[#FF526C]">Danger</p> : null}
                        <div className={clsx("flex h-[3px] items-stretch", tone.track)} aria-label={`${label}: ${value} out of 5`}>
                          <div className={clsx("h-[3px] shrink-0 transition-[width] duration-300", tone.fill)} style={{ width: `${(value / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div className="relative self-stretch">
                        <p
                          id={hintId}
                          role="tooltip"
                          className="pointer-events-none absolute top-1/2 left-0 z-20 flex -translate-y-1/2 items-center whitespace-nowrap rounded-md border border-[#F0ABCF]/25 bg-[#2A1F2E] px-2 py-1 text-left text-[0.62rem] font-medium normal-case leading-none tracking-normal text-[#F5E6D3]/90 opacity-0 shadow-[0_8px_20px_rgba(30,23,36,0.45)] transition-opacity group-hover:opacity-100"
                        >
                          {hint}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div
            className={clsx(
              "relative flex isolate min-h-[5.25rem] overflow-hidden items-center justify-between rounded-xl border px-4 py-3 sm:min-h-[8.5rem] sm:flex-col sm:items-start sm:justify-between sm:px-5 sm:py-4",
              possession.card
            )}
          >
            {isExceptionalPossession ? <span aria-hidden className="matchup-possession-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12" /> : null}
            <div>
              <p className={clsx("text-[0.62rem] font-bold uppercase tracking-[0.15em]", possession.labelText)}>{possession.label}</p>
            </div>
            <p className={clsx("relative font-mono text-3xl font-bold tracking-tight sm:text-5xl", possession.score)}>
              {entry.matchup.possessionValue}<span className="text-base text-[#F5E6D3]/35 sm:text-lg">/10</span>
            </p>
          </div>

          {entry.matchup.dangerHint ? (
            <div className="relative flex min-h-[5.25rem] overflow-hidden rounded-xl border border-[#FF526C]/32 bg-[linear-gradient(145deg,rgba(255,82,108,0.14),rgba(50,25,38,0.28)_70%)] px-4 py-3 sm:min-h-[8.5rem] sm:flex-col sm:justify-between sm:px-5 sm:py-4">
              <span aria-hidden className="absolute -right-1 -top-5 font-serif text-7xl font-bold leading-none text-[#FF526C]/[0.09] sm:text-8xl">!</span>
              <p className="relative text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[#FF9AAD]">Main danger</p>
              <div className="relative mt-auto sm:mt-0">
                <p className="text-sm font-bold leading-tight text-[#FFD4DB] sm:text-base">{entry.matchup.dangerHint.title}</p>
                {entry.matchup.dangerHint.detail ? <p className="mt-0.5 text-xs font-medium text-[#FFD4DB]/62">{entry.matchup.dangerHint.detail}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TierDetailSlot({
  open,
  entry,
  guideTextIcons,
}: {
  open: boolean;
  entry: TierMatchupEntry | null;
  guideTextIcons: Record<string, string>;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [visibleEntry, setVisibleEntry] = useState<TierMatchupEntry | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const wasOpenRef = useRef(false);

  const measureHeight = useCallback(() => {
    const node = contentRef.current;
    if (!node) return;
    setContentHeight(node.scrollHeight);
  }, []);

  useLayoutEffect(() => {
    if (open && entry) {
      setVisibleEntry(entry);
    }
  }, [open, entry]);

  useLayoutEffect(() => {
    measureHeight();
  }, [visibleEntry, measureHeight]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node || !visibleEntry) return;

    const observer = new ResizeObserver(() => measureHeight());
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleEntry, measureHeight]);

  useEffect(() => {
    if (open && entry) {
      if (!wasOpenRef.current) {
        setExpanded(false);
        const frame = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            measureHeight();
            setExpanded(true);
            wasOpenRef.current = true;
          });
        });
        return () => cancelAnimationFrame(frame);
      }

      return;
    }

    wasOpenRef.current = false;
    setExpanded(false);

    const timer = window.setTimeout(() => {
      setVisibleEntry(null);
      setContentHeight(0);
    }, DETAIL_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [open, entry, measureHeight]);

  if (!visibleEntry) return null;

  return (
    <div
      className={DETAIL_HEIGHT_TRANSITION}
      style={{ height: expanded ? contentHeight : 0 }}
      aria-hidden={!expanded}
    >
      <div ref={contentRef}>
        <MatchupDetailPanel entry={visibleEntry} guideTextIcons={guideTextIcons} />
      </div>
    </div>
  );
}

export default function JungleTierMatchupPanel({
  data,
  guideTextIcons = {},
}: {
  data: GuideJungleTierMatchupPageData;
  guideTextIcons?: Record<string, string>;
}) {
  const clickableMatchups = useMemo(
    () =>
      data.tiers.flatMap((tier) =>
        tier.matchups.map((matchup) => ({ tier, matchup }))
      ),
    [data.tiers]
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    () => data.tiers.find((tier) => tier.id === "nightmare")?.matchups[0]?.id ?? null
  );
  const [query, setQuery] = useState("");

  const tierImageUrls = useMemo(() => collectJungleTierMatchupSectionImageUrls(data), [data]);
  const { sectionRef, shouldLoad, imagesReady } = useGuideSectionImages(tierImageUrls);
  const showContent = shouldLoad && imagesReady;

  const normalizedQuery = query.trim().toLowerCase();

  const visibleTiers = useMemo(() => {
    if (!normalizedQuery) return data.tiers;

    return data.tiers
      .map((tier) => ({
        ...tier,
        matchups: tier.matchups.filter((matchup) =>
          matchup.name.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((tier) => tier.matchups.length > 0);
  }, [data.tiers, normalizedQuery]);

  const selectedEntry = useMemo(() => {
    const found = clickableMatchups.find((entry) => entry.matchup.id === selectedId);
    return found ?? null;
  }, [clickableMatchups, selectedId]);

  const activeTierId = useMemo(() => {
    if (!selectedEntry) return null;

    const visibleTier = visibleTiers.find((tier) => tier.id === selectedEntry.tier.id);
    if (!visibleTier) return null;

    const champVisible = visibleTier.matchups.some(
      (matchup) => matchup.id === selectedEntry.matchup.id
    );

    return champVisible ? visibleTier.id : null;
  }, [selectedEntry, visibleTiers]);

  return (
    <section
      ref={sectionRef}
      id="matchups"
      className="scroll-mt-24 w-full min-w-0 max-w-full"
      aria-label={data.title}
      aria-busy={shouldLoad && !imagesReady}
    >
      {!shouldLoad ? (
        <JungleTierMatchupPanelSkeleton data={data} />
      ) : (
        <div className="grid">
          {!showContent ? (
            <div className="col-start-1 row-start-1 transition-opacity duration-300 ease-out">
              <JungleTierMatchupPanelSkeleton data={data} />
            </div>
          ) : null}

          <div
            className={clsx(
              "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
              showContent ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!showContent}
          >
      <div
        className={clsx(
          "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          guideSectionHeaderPadClass
        )}
      >
          <h2 className={guideSectionTitleClass}>{data.title}</h2>

          <label className="block w-full sm:max-w-xs sm:shrink-0">
            <span className="sr-only">Search junglers</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search junglers..."
              className="w-full rounded-lg border border-[#F0ABCF]/18 bg-[#1E1724]/70 px-3 py-2 text-sm text-[#F5E6D3]/88 outline-none transition placeholder:text-[#F5E6D3]/32 focus:border-[#F0ABCF]/40 focus:ring-1 focus:ring-[#F0ABCF]/25"
            />
          </label>
        </div>

        <div className={clsx("flex flex-col gap-3", guideSectionHeaderPadClass)}>
          {visibleTiers.length > 0 ? (
            visibleTiers.map((tier) => (
              <div key={tier.id} className="flex flex-col gap-3">
                <TierRow
                  tier={tier}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />

                <TierDetailSlot
                  open={
                    activeTierId === tier.id && Boolean(selectedEntry)
                  }
                  entry={
                    activeTierId === tier.id && selectedEntry
                      ? selectedEntry
                      : null
                  }
                  guideTextIcons={guideTextIcons}
                />
              </div>
            ))
          ) : (
              <p className="rounded-xl border border-[#F0ABCF]/12 bg-[#1E1724]/55 px-4 py-6 text-center text-sm text-[#F5E6D3]/48">
                No junglers match &ldquo;{query.trim()}&rdquo;
              </p>
            )}
          </div>
          </div>
        </div>
      )}
    </section>
  );
}

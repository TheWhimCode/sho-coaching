"use client";

import clsx from "clsx";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import GuideImage from "@/app/_components/guides/GuideImage";
import GuideNewBadge from "@/app/_components/guides/GuideNewBadge";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { useGuideSectionImages } from "@/app/_components/guides/useGuideSectionImages";
import type {
  GuideJungleTierMatchupPageData,
  SerializedJungleTier,
  SerializedJungleTierMatchup,
} from "@/lib/guides/matchupGuideTypes";
import { guideChampionIconImgClass, guideSectionHeaderPadClass, guideSectionTitleClass } from "@/lib/guides/guideTheme";

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

function collectTierImageUrls(data: GuideJungleTierMatchupPageData): string[] {
  return data.tiers.flatMap((tier) => tier.matchups.map((matchup) => matchup.icon));
}

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
  const clickable = matchup.hasExplanation;

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={clickable ? onSelect : undefined}
      className={clsx(
        "relative flex min-w-0 flex-col items-center rounded-lg border px-1 py-1.5 sm:py-2",
        clickable
          ? "transition-[border-color,background-color,box-shadow] duration-200 ease-out"
          : "cursor-not-allowed border-[#F5E6D3]/8 bg-[#1E1724]/30 opacity-45",
        clickable && (selected ? accent.cardSelected : accent.cardIdle)
      )}
    >
      {matchup.isNew ? (
        <GuideNewBadge className="pointer-events-none absolute right-2 top-1 z-10 text-[6px] sm:text-[7px]" />
      ) : null}
      <div
        className={clsx(
          "relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#352839]/80 ring-2 sm:h-9 sm:w-9",
          clickable ? accent.iconRing : "ring-[#F5E6D3]/15 grayscale"
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
            : "text-[#F5E6D3]/38"
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
            selected={matchup.hasExplanation && selectedId === matchup.id}
            onSelect={() => {
              if (matchup.hasExplanation) onSelect(matchup.id);
            }}
          />
        ))}
      </div>
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
  const detailText = entry.matchup.explanation ?? "";

  const explanationBody = (
    <>
      {detailText.split("\n").map((paragraph, index) => (
        <p key={index} className={index > 0 ? "mt-[0.5em]" : undefined}>
          {renderGuideHighlightedText(paragraph, guideTextIcons)}
        </p>
      ))}
    </>
  );

  return (
    <div className="w-full min-w-0 max-w-full rounded-xl border border-[#F0ABCF]/12 bg-[#1E1724]/55 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex items-center gap-3 sm:contents">
          <div
            className={clsx(
              "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#352839]/80 ring-1 sm:h-[4.9rem] sm:w-[4.9rem]",
              accent.detailRing
            )}
          >
            <GuideImage
              src={entry.matchup.icon}
              alt={entry.matchup.name}
              loading="lazy"
              className={guideChampionIconImgClass}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-0 sm:flex-initial sm:gap-0">
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2.5 sm:gap-y-1">
              <p
                className={clsx(
                  "text-sm font-semibold leading-none sm:text-base",
                  accent.nameSelected
                )}
              >
                {entry.matchup.name}
              </p>
              <p className="text-xs font-medium tabular-nums text-[#F5E6D3]/52 sm:text-sm">
                Possession value {entry.matchup.possessionValue}/10
              </p>
            </div>

            <div className="mt-2 hidden min-w-0 text-sm leading-[1.7] text-[#F5E6D3]/62 sm:block sm:text-base">
              {explanationBody}
            </div>
          </div>
        </div>

        <div className="min-w-0 w-full text-sm leading-[1.7] text-[#F5E6D3]/62 sm:hidden">
          {explanationBody}
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
        tier.matchups
          .filter((matchup) => matchup.hasExplanation)
          .map((matchup) => ({ tier, matchup }))
      ),
    [data.tiers]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const tierImageUrls = useMemo(() => collectTierImageUrls(data), [data]);
  const { sectionRef, shouldLoad, imagesReady } = useGuideSectionImages(tierImageUrls);

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
    if (!selectedEntry?.matchup.hasExplanation) return null;

    const visibleTier = visibleTiers.find((tier) => tier.id === selectedEntry.tier.id);
    if (!visibleTier) return null;

    const champVisible = visibleTier.matchups.some(
      (matchup) => matchup.id === selectedEntry.matchup.id
    );

    return champVisible ? visibleTier.id : null;
  }, [selectedEntry, visibleTiers]);

  const showContent = shouldLoad && imagesReady;

  return (
    <section
      ref={sectionRef}
      id="matchups"
      className="scroll-mt-24 w-full min-w-0 max-w-full"
      aria-label={data.title}
      aria-busy={shouldLoad && !imagesReady}
    >
      <div
        className={clsx(
          "transition-opacity duration-300 ease-out",
          showContent ? "opacity-100" : "opacity-0",
          !shouldLoad && "opacity-100"
        )}
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
                    activeTierId === tier.id &&
                    Boolean(selectedEntry?.matchup.hasExplanation)
                  }
                  entry={
                    activeTierId === tier.id && selectedEntry?.matchup.hasExplanation
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
    </section>
  );
}

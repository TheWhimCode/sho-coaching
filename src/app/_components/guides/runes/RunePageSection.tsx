"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  guideRuneLayoutGapClass,
  guideSectionHeaderPadClass,
  guideSectionTitleClass,
  guideMobileFlushPanelClass,
} from "@/lib/guides/guideTheme";
import GuideCrossOverlay from "@/app/_components/guides/GuideCrossOverlay";
import GuideImage from "@/app/_components/guides/GuideImage";
import { RunePageSkeleton } from "@/app/_components/guides/GuideSectionSkeletons";
import { renderGuideHighlightedTextWithViegoAbilities } from "@/app/_components/guides/guideTextHighlights";
import { useGuideSectionImages } from "@/app/_components/guides/useGuideSectionImages";
import { collectRuneSectionImageUrls } from "@/lib/guides/preloadGuideImages";
import type { GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";
import type {
  GuideRunePageData,
  SerializedRune,
  SerializedRuneTree,
  SerializedStatShardRow,
} from "@/lib/guides/runeGuideTypes";

type TreeMode = "primary" | "secondary";

const TREE_ACCENT: Record<TreeMode, { border: string }> = {
  primary: {
    border: "border-[#F0ABCF]/45 shadow-[0_0_12px_rgba(240,171,207,0.18)]",
  },
  secondary: {
    border: "border-[#B8D8EA]/45 shadow-[0_0_12px_rgba(184,216,234,0.16)]",
  },
};

function RuneIcon({
  rune,
  selected,
  mode,
  large = false,
  situationalBadge,
}: {
  rune: SerializedRune;
  selected: boolean;
  mode: TreeMode;
  large?: boolean;
  /** 1-based option number for situational alternatives. */
  situationalBadge?: number;
}) {
  const accent = TREE_ACCENT[mode];
  const size = large ? "size-14 sm:size-16 lg:size-[4.5rem]" : "size-9 sm:size-11 lg:size-12";

  return (
    <div className={clsx("relative aspect-square shrink-0 flex-none", size)} title={rune.name}>
      <div
        className={clsx(
          "h-full w-full overflow-hidden rounded-full border-2 bg-[#352839]/80 transition",
          selected ? accent.border : "border-transparent opacity-35 grayscale"
        )}
      >
        <GuideImage
          src={rune.icon}
          alt={rune.name}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>
      {situationalBadge != null && selected ? (
        <span
          aria-label={`Option ${situationalBadge}`}
          className={clsx(
            "pointer-events-none absolute -left-0.5 -top-0.5 z-10 flex items-center justify-center rounded-full",
            "bg-[#B8D8EA] font-bold leading-none text-[#1A121C]",
            large
              ? "size-4 text-[0.6rem] sm:size-5 sm:text-[0.7rem]"
              : "size-3.5 text-[0.55rem] sm:size-4 sm:text-[0.6rem]"
          )}
        >
          {situationalBadge}
        </span>
      ) : null}
    </div>
  );
}

function StatShardIcon({
  shard,
  selected,
  optionBadge,
}: {
  shard: SerializedRune;
  selected: boolean;
  optionBadge?: number;
}) {
  return (
    <div className="relative aspect-square size-6 shrink-0 flex-none sm:size-8" title={shard.name}>
      <div
        className={clsx(
          "h-full w-full overflow-hidden rounded-full border-2 bg-[#352839]/80 transition",
          selected
            ? "border-[#F5E6D3]/40 shadow-[0_0_8px_rgba(245,230,211,0.14)]"
            : "border-transparent opacity-35 grayscale"
        )}
      >
        <GuideImage
          src={shard.icon}
          alt={shard.name}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>
      {optionBadge != null && selected ? (
        <span
          aria-label={`Option ${optionBadge}`}
          className={clsx(
            "pointer-events-none absolute -left-0.5 -top-0.5 z-10 flex items-center justify-center rounded-full",
            "size-3 bg-[#B8D8EA] text-[0.5rem] font-bold leading-none text-[#1A121C]",
            "sm:size-3.5 sm:text-[0.55rem]"
          )}
        >
          {optionBadge}
        </span>
      ) : null}
    </div>
  );
}

function StatShardGrid({
  rows,
  className,
}: {
  rows: SerializedStatShardRow[];
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mt-1 flex flex-col gap-2 border-t border-[#F0ABCF]/15 pt-3 sm:gap-3.5",
        className
      )}
    >
      {rows.map((row, rowIdx) => {
        const showOptionBadges = row.selectedIds.length > 1;

        return (
          <div
            key={rowIdx}
            className="flex items-center justify-center gap-2 sm:gap-3.5"
          >
            {row.shards.map((shard) => {
              const optionIndex = row.selectedIds.indexOf(shard.id);
              const selected = optionIndex >= 0;

              return (
                <StatShardIcon
                  key={`${rowIdx}-${shard.id}`}
                  shard={shard}
                  selected={selected}
                  optionBadge={
                    showOptionBadges && selected ? optionIndex + 1 : undefined
                  }
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function RuneTreePanel({
  tree,
  selectedIds,
  situationalIds = [],
  mode,
  hideKeystone = false,
  statShardRows,
  statShardClassName,
}: {
  tree: SerializedRuneTree;
  selectedIds: number[];
  situationalIds?: number[];
  mode: TreeMode;
  hideKeystone?: boolean;
  statShardRows?: SerializedStatShardRow[];
  statShardClassName?: string;
}) {
  const selected = new Set(selectedIds);
  const slots = hideKeystone ? tree.slots.slice(1) : tree.slots;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-2.5 sm:gap-4">
        {slots.map((row, rowIdx) => {
          const isKeystoneRow = !hideKeystone && rowIdx === 0;
          return (
            <div
              key={`${tree.id}-row-${rowIdx}`}
              className={clsx(
                "flex items-center justify-center",
                isKeystoneRow ? "gap-1.5 sm:gap-2.5" : "gap-1 sm:gap-3.5 lg:gap-4"
              )}
            >
              {row.map((rune) => {
                const situationalIndex = situationalIds.indexOf(rune.id);
                const situationalBadge =
                  situationalIndex >= 0 ? situationalIndex + 1 : undefined;

                return (
                  <div key={rune.id} className="relative flex flex-none items-center justify-center">
                    <RuneIcon
                      rune={rune}
                      selected={selected.has(rune.id)}
                      mode={mode}
                      large={isKeystoneRow}
                      situationalBadge={situationalBadge}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {statShardRows && statShardRows.length > 0 ? (
        <StatShardGrid rows={statShardRows} className={statShardClassName} />
      ) : null}
    </div>
  );
}

function ExplanationPanel({
  title,
  body,
  runeIcon,
  accent,
  compactIcon = false,
  className,
  guideTextIcons = {},
  viegoAbilityIcons,
}: {
  title: string;
  body: string;
  runeIcon?: string | null;
  accent: TreeMode;
  compactIcon?: boolean;
  className?: string;
  guideTextIcons?: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
}) {
  const accentStyles = TREE_ACCENT[accent];

  return (
    <article
      className={clsx(
        "flex h-full flex-col rounded-xl border border-[#F0ABCF]/12 bg-[#352839]/50 p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {runeIcon ? (
          <div
            className={clsx(
              "relative flex aspect-square size-10 shrink-0 flex-none items-center justify-center overflow-hidden rounded-full border-2 bg-[#352839]/80",
              accentStyles.border
            )}
          >
            <GuideImage
              src={runeIcon}
              alt=""
              loading="eager"
              className={clsx(
                "block object-cover",
                compactIcon ? "size-7 object-contain" : "h-full w-full object-cover"
              )}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-[#F5E6D3] sm:text-lg">{title}</h4>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#F5E6D3]/65 sm:text-base">
        {renderGuideHighlightedTextWithViegoAbilities(
          body,
          guideTextIcons,
          viegoAbilityIcons
        )}
      </p>
    </article>
  );
}

function findRuneIcon(tree: SerializedRuneTree, perkId: number): string | null {
  for (const row of tree.slots) {
    for (const rune of row) {
      if (rune.id === perkId) return rune.icon;
    }
  }
  return null;
}

export default function RunePageSection({
  data,
  guideTextIcons = {},
  viegoAbilityIcons,
}: {
  data: GuideRunePageData;
  guideTextIcons?: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
}) {
  const { heading, headerIcon, tabs, defaultTabId } = data;
  const [activeTabId, setActiveTabId] = useState(defaultTabId);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const { build, primaryTree, secondaryTree, statShardRows } = activeTab;
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelHeight, setLeftPanelHeight] = useState<number | null>(null);
  const runeImageUrls = useMemo(() => collectRuneSectionImageUrls(data), [data]);
  const { sectionRef, imagesReady } = useGuideSectionImages(runeImageUrls, { eager: true });

  const hailOfBladesExplanation = build.explanations[0];
  const hailOfBladesIcon = hailOfBladesExplanation
    ? findRuneIcon(primaryTree, hailOfBladesExplanation.perkId)
    : null;

  useEffect(() => {
    if (!imagesReady) return;

    const el = leftPanelRef.current;
    if (!el) return;

    const syncHeight = () => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      setLeftPanelHeight(isDesktop ? el.offsetHeight : null);
    };

    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, [imagesReady, activeTabId]);

  return (
    <section
      ref={sectionRef}
      id="runes"
      className="scroll-mt-24"
      aria-busy={!imagesReady}
      aria-label={!imagesReady ? "Loading runes" : undefined}
    >
      <div className="grid">
        <div
          className={clsx(
            "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
            imagesReady ? "pointer-events-none opacity-0" : "opacity-100"
          )}
        >
          <RunePageSkeleton data={data} />
        </div>

        <div
          className={clsx(
            "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
            imagesReady ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!imagesReady}
        >
          <div className={clsx("mb-6 flex items-center gap-4 sm:gap-5", guideSectionHeaderPadClass)}>
            <h2 className={guideSectionTitleClass}>{heading}</h2>
            {headerIcon ? (
              <div className="relative shrink-0">
                <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-16">
                  <GuideImage
                    src={headerIcon.icon}
                    alt={headerIcon.name}
                    className="h-full w-full scale-[1.2] object-cover"
                    loading="eager"
                  />
                  <GuideCrossOverlay />
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={clsx(
              "overflow-hidden rounded-none border border-[#F0ABCF]/15 bg-[#2A1F2E]/75 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm sm:rounded-2xl",
              guideMobileFlushPanelClass
            )}
          >
            <div className="flex w-full">
              {tabs.map((tab, index) => {
                const active = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className={clsx(
                      "px-5 py-3.5 text-sm font-semibold tracking-wide transition sm:px-6",
                      "ring-1 ring-inset",
                      index === tabs.length - 1 && "sm:rounded-br-2xl",
                      active
                        ? "text-[#FAD4E8] ring-[#F0ABCF]/35"
                        : "text-[#F5E6D3]/38 ring-[#F0ABCF]/12 hover:text-[#F5E6D3]/62 hover:ring-[#F0ABCF]/20"
                    )}
                    aria-pressed={active}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-3 sm:p-4">
              <div
                className={clsx(
                  "flex flex-col lg:flex-row lg:items-stretch",
                  guideRuneLayoutGapClass
                )}
              >
                <div ref={leftPanelRef} className="w-full shrink-0 p-3 sm:p-5 lg:w-auto lg:flex-1">
                  <div className="flex flex-col">
                    <div className="flex flex-row items-start gap-1.5 sm:gap-6">
                      <RuneTreePanel
                        tree={primaryTree}
                        selectedIds={build.primaryPerkIds}
                        situationalIds={build.situationalPerkIds}
                        mode="primary"
                      />
                      <RuneTreePanel
                        tree={secondaryTree}
                        selectedIds={build.secondaryPerkIds}
                        situationalIds={build.situationalPerkIds}
                        mode="secondary"
                        hideKeystone
                        statShardRows={statShardRows}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="flex min-w-0 flex-col gap-4 lg:flex-1"
                  style={leftPanelHeight != null ? { height: leftPanelHeight } : undefined}
                >
                  {hailOfBladesExplanation ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <ExplanationPanel
                        title={hailOfBladesExplanation.title}
                        body={hailOfBladesExplanation.body}
                        runeIcon={hailOfBladesIcon}
                        accent="primary"
                        guideTextIcons={guideTextIcons}
                        viegoAbilityIcons={viegoAbilityIcons}
                      />
                    </div>
                  ) : null}

                  {build.secondarySection ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <ExplanationPanel
                        title={build.secondarySection.title}
                        body={build.secondarySection.body}
                        runeIcon={secondaryTree.icon}
                        accent="secondary"
                        compactIcon
                        guideTextIcons={guideTextIcons}
                        viegoAbilityIcons={viegoAbilityIcons}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

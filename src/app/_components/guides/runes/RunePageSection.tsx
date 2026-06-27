"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import {
  guideRuneLayoutGapClass,
  guideRuneOuterPanelClass,
  guideSectionTitleClass,
} from "@/lib/guides/guideTheme";
import GuideCrossOverlay from "@/app/_components/guides/GuideCrossOverlay";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
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
}: {
  rune: SerializedRune;
  selected: boolean;
  mode: TreeMode;
  large?: boolean;
}) {
  const accent = TREE_ACCENT[mode];
  const size = large ? "size-16 sm:size-[4.5rem]" : "size-11 sm:size-12";

  return (
    <div
      className={clsx(
        "relative aspect-square shrink-0 flex-none overflow-hidden rounded-full border-2 transition",
        size,
        selected ? accent.border : "border-transparent opacity-35 grayscale"
      )}
      title={rune.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={rune.icon}
        alt={rune.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

function StatShardIcon({ shard, selected }: { shard: SerializedRune; selected: boolean }) {
  return (
    <div
      className={clsx(
        "relative aspect-square size-7 shrink-0 flex-none overflow-hidden rounded-full border-2 transition sm:size-8",
        selected
          ? "border-[#F5E6D3]/40 shadow-[0_0_8px_rgba(245,230,211,0.14)]"
          : "border-transparent opacity-35 grayscale"
      )}
      title={shard.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shard.icon}
        alt={shard.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

function StatShardGrid({ rows }: { rows: SerializedStatShardRow[] }) {
  return (
    <div className="mt-1 flex flex-col gap-3 border-t border-[#F0ABCF]/15 pt-3 sm:gap-3.5">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center justify-center gap-3 sm:gap-3.5"
        >
          {row.shards.map((shard) => (
            <StatShardIcon
              key={`${rowIdx}-${shard.id}`}
              shard={shard}
              selected={shard.id === row.selectedId}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function RuneTreePanel({
  tree,
  selectedIds,
  mode,
  hideKeystone = false,
  statShardRows,
}: {
  tree: SerializedRuneTree;
  selectedIds: number[];
  mode: TreeMode;
  hideKeystone?: boolean;
  statShardRows?: SerializedStatShardRow[];
}) {
  const selected = new Set(selectedIds);
  const slots = hideKeystone ? tree.slots.slice(1) : tree.slots;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-4">
        {slots.map((row, rowIdx) => {
          const isKeystoneRow = !hideKeystone && rowIdx === 0;
          return (
            <div
              key={`${tree.id}-row-${rowIdx}`}
              className={clsx(
                "flex items-center justify-center",
                isKeystoneRow ? "gap-2 sm:gap-2.5" : "gap-3.5 sm:gap-4"
              )}
            >
              {row.map((rune) => (
                <div key={rune.id} className="flex flex-none items-center justify-center">
                  <RuneIcon
                    rune={rune}
                    selected={selected.has(rune.id)}
                    mode={mode}
                    large={isKeystoneRow}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {statShardRows && statShardRows.length > 0 ? (
        <StatShardGrid rows={statShardRows} />
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
}: {
  title: string;
  body: string;
  runeIcon?: string | null;
  accent: TreeMode;
  /** Smaller artwork inside the same bordered circle — used for tree icons. */
  compactIcon?: boolean;
  className?: string;
  guideTextIcons?: Record<string, string>;
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
              "relative flex aspect-square size-10 shrink-0 flex-none items-center justify-center overflow-hidden rounded-full border-2",
              accentStyles.border
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={runeIcon}
              alt=""
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
        {renderGuideHighlightedText(body, guideTextIcons)}
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
}: {
  data: GuideRunePageData;
  guideTextIcons?: Record<string, string>;
}) {
  const { build, primaryTree, secondaryTree, statShardRows, headerIcon } = data;
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelHeight, setLeftPanelHeight] = useState<number | null>(null);

  const hailOfBladesExplanation = build.explanations[0];
  const hailOfBladesIcon = hailOfBladesExplanation
    ? findRuneIcon(primaryTree, hailOfBladesExplanation.perkId)
    : null;

  useEffect(() => {
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
  }, []);

  return (
    <section id="runes" className="scroll-mt-24">
      <div className="mb-6 flex items-center gap-4 sm:gap-5">
        <h2 className={guideSectionTitleClass}>
          {build.heading}
        </h2>
        {headerIcon ? (
          <div className="relative shrink-0">
            <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-transparent sm:h-16 sm:w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headerIcon.icon}
                alt={headerIcon.name}
                className="h-full w-full scale-[1.2] object-cover"
              />
              <GuideCrossOverlay />
            </div>
          </div>
        ) : null}
      </div>

      <div className={guideRuneOuterPanelClass}>
        <div
          className={clsx(
            "flex flex-col lg:flex-row lg:items-stretch",
            guideRuneLayoutGapClass
          )}
        >
          <div ref={leftPanelRef} className="w-full shrink-0 p-4 sm:p-5 lg:w-auto lg:flex-1">
            <div
              className={clsx(
                "flex flex-col sm:flex-row",
                guideRuneLayoutGapClass
              )}
            >
              <RuneTreePanel
                tree={primaryTree}
                selectedIds={build.primaryPerkIds}
                mode="primary"
              />
              <div className="hidden w-px shrink-0 bg-[#F0ABCF]/15 sm:block" />
              <RuneTreePanel
                tree={secondaryTree}
                selectedIds={build.secondaryPerkIds}
                mode="secondary"
                hideKeystone
                statShardRows={statShardRows}
              />
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
                />
              </div>
            ) : null}

            {build.precisionSection ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <ExplanationPanel
                  title={build.precisionSection.title}
                  body={build.precisionSection.body}
                  runeIcon={secondaryTree.icon}
                  accent="secondary"
                  compactIcon
                  guideTextIcons={guideTextIcons}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

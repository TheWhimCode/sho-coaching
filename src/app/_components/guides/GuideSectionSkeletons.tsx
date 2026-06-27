import clsx from "clsx";
import { Fragment, type ReactNode } from "react";
import {
  guideRuneLayoutGapClass,
  guideRuneOuterPanelClass,
  guideSectionTitleClass,
} from "@/lib/guides/guideTheme";
import type { GuideItemPageData, SerializedGuideItemStep } from "@/lib/guides/itemGuideTypes";
import type { GuideMatchupPageData } from "@/lib/guides/matchupGuideTypes";
import type {
  GuideRunePageData,
  SerializedRuneTree,
  SerializedStatShardRow,
} from "@/lib/guides/runeGuideTypes";

const ITEM_TILE_CLASS =
  "aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#352839] ring-1 ring-[#F0ABCF]/30 sm:h-16 sm:w-16";

const ITEM_TILE_COMPACT_CLASS =
  "aspect-square h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#352839] ring-1 ring-[#F0ABCF]/30 sm:h-12 sm:w-12";

const ITEM_PANEL_OUTER =
  "w-full overflow-visible rounded-2xl border border-[#F0ABCF]/15 bg-[#16121A]/95 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm";

const ITEM_SECONDARY_SECTION = "w-full py-5 sm:py-6";

const ITEM_DETAIL_SECTION = "w-full py-8 sm:py-10";

const ITEM_SECONDARY_PAD_X = "px-6 sm:px-10 lg:px-14";

const ITEM_PRIMARY_MAIN =
  "relative w-full overflow-hidden rounded-2xl border-y border-[#F0ABCF]/15 bg-[#2A1F2E]/92";

const ITEM_PRIMARY_BODY =
  "overflow-visible px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14";

const ITEM_LANE_SPACER_H =
  "flex min-w-0 flex-1 items-center justify-center px-3 sm:px-5 md:px-6";

const PREBUILD_HEADER_CLASS =
  "text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/55";

const PREBUILD_SECTION_DIVIDER = "border-r border-[#F0ABCF]/14";

function SkeletonCircle({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse rounded-full bg-[#352839]/90", className)}
      aria-hidden
    />
  );
}

function SkeletonTile({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div
      className={clsx(
        compact ? ITEM_TILE_COMPACT_CLASS : ITEM_TILE_CLASS,
        "animate-pulse bg-[#352839]/90",
        className
      )}
      aria-hidden
    />
  );
}

function estimateTextLines(text: string, charsPerLine = 52): number {
  return text.split("\n").reduce((total, paragraph) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return total;
    return total + Math.max(1, Math.ceil(trimmed.length / charsPerLine));
  }, 0);
}

function TextLineSkeletons({ body, className }: { body: string; className?: string }) {
  const lineCount = estimateTextLines(body);

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {Array.from({ length: lineCount }, (_, index) => (
        <div
          key={index}
          className={clsx(
            "h-4 animate-pulse rounded bg-[#352839]/70 sm:h-[1.1rem]",
            index === lineCount - 1 ? "w-[88%]" : "w-full"
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

function RuneTreeSkeletonPanel({
  tree,
  hideKeystone = false,
  statShardRows,
}: {
  tree: SerializedRuneTree;
  hideKeystone?: boolean;
  statShardRows?: SerializedStatShardRow[];
}) {
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
                  <SkeletonCircle
                    className={
                      isKeystoneRow ? "size-16 sm:size-[4.5rem]" : "size-11 sm:size-12"
                    }
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {statShardRows && statShardRows.length > 0 ? (
        <div className="mt-1 flex flex-col gap-3 border-t border-[#F0ABCF]/15 pt-3 sm:gap-3.5">
          {statShardRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex items-center justify-center gap-3 sm:gap-3.5"
            >
              {row.shards.map((shard) => (
                <SkeletonCircle key={shard.id} className="size-7 sm:size-8" />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ExplanationPanelSkeleton({ title, body }: { title: string; body: string }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-[#F0ABCF]/12 bg-[#352839]/50 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <SkeletonCircle className="size-10 shrink-0 flex-none" />
        <h4 className="text-base font-semibold text-[#F5E6D3]/20 sm:text-lg">{title}</h4>
      </div>
      <TextLineSkeletons body={body} className="mt-3 flex-1" />
    </article>
  );
}

export function RunePageSkeleton({ data }: { data: GuideRunePageData }) {
  const { build, primaryTree, secondaryTree, statShardRows, headerIcon } = data;
  const hailOfBladesExplanation = build.explanations[0];

  return (
    <div aria-hidden>
      <div className="mb-6 flex items-center gap-4 sm:gap-5">
        <h2 className={clsx(guideSectionTitleClass, "text-[#F5E6D3]/20")}>{build.heading}</h2>
        {headerIcon ? (
          <SkeletonTile className="relative shrink-0 rounded-lg" />
        ) : null}
      </div>

      <div className={guideRuneOuterPanelClass}>
        <div
          className={clsx(
            "flex flex-col lg:flex-row lg:items-stretch",
            guideRuneLayoutGapClass
          )}
        >
          <div className="w-full shrink-0 p-4 sm:p-5 lg:w-auto lg:flex-1">
            <div className={clsx("flex flex-col sm:flex-row", guideRuneLayoutGapClass)}>
              <RuneTreeSkeletonPanel tree={primaryTree} />
              <div className="hidden w-px shrink-0 bg-[#F0ABCF]/15 sm:block" />
              <RuneTreeSkeletonPanel
                tree={secondaryTree}
                hideKeystone
                statShardRows={statShardRows}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4 lg:flex-1">
            {hailOfBladesExplanation ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <ExplanationPanelSkeleton
                  title={hailOfBladesExplanation.title}
                  body={hailOfBladesExplanation.body}
                />
              </div>
            ) : null}

            {build.precisionSection ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <ExplanationPanelSkeleton
                  title={build.precisionSection.title}
                  body={build.precisionSection.body}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreBuildColumnSkeleton({
  span,
  showDivider,
  children,
}: {
  span: 1 | 2;
  showDivider?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex min-w-0 justify-center",
        span === 2 ? "col-span-2" : "col-span-1",
        showDivider && PREBUILD_SECTION_DIVIDER
      )}
    >
      <div className="flex w-fit max-w-full flex-col items-start">{children}</div>
    </div>
  );
}

function PreBuildStripSkeleton({
  preBuild,
}: {
  preBuild: NonNullable<GuideItemPageData["preBuild"]>;
}) {
  return (
    <div className="grid grid-cols-4 items-stretch py-2 sm:py-2.5">
      <PreBuildColumnSkeleton span={1} showDivider>
        <p className={PREBUILD_HEADER_CLASS}>Starting</p>
        <div className="flex flex-row flex-nowrap items-center gap-0.5 pt-2">
          {preBuild.starting.map((_, index) => (
            <SkeletonTile
              key={index}
              compact
              className={index === 0 ? "ml-0 mr-1 sm:mr-1.5" : "mx-1 sm:mx-1.5"}
            />
          ))}
        </div>
        {preBuild.startingLink ? (
          <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-[#352839]/55" />
        ) : null}
      </PreBuildColumnSkeleton>

      <PreBuildColumnSkeleton span={2} showDivider>
        <p className={PREBUILD_HEADER_CLASS}>Boots</p>
        <div className="flex max-w-full flex-row flex-nowrap items-center pt-2">
          <SkeletonTile compact className="ml-0 mr-1 sm:mr-1.5" />
          <span aria-hidden className="shrink-0 px-1.5 text-base text-[#F0ABCF]/20 sm:px-2 sm:text-lg">
            ›
          </span>
          {preBuild.boots.map((_, index) => (
            <SkeletonTile key={index} compact className="mx-1 sm:mx-1" />
          ))}
        </div>
        {preBuild.bootsSubheading ? (
          <div className="mt-1.5 h-3 w-full max-w-[12rem] animate-pulse rounded bg-[#352839]/45" />
        ) : null}
      </PreBuildColumnSkeleton>

      <PreBuildColumnSkeleton span={1}>
        <p className={PREBUILD_HEADER_CLASS}>Full build</p>
        <div className="flex flex-row flex-nowrap items-center gap-0.5 pt-2">
          <SkeletonTile compact className="ml-0 mr-1 sm:mr-1.5" />
          <SkeletonTile compact className="mx-1 sm:mx-1.5" />
        </div>
        <div className="mt-1.5 h-3 w-28 animate-pulse rounded bg-[#352839]/45" />
      </PreBuildColumnSkeleton>
    </div>
  );
}

function ItemStepColumnSkeleton({ step }: { step: SerializedGuideItemStep }) {
  return (
    <div className="flex shrink-0 items-stretch self-stretch overflow-visible px-1 sm:px-2">
      {step.type === "choice" ? (
        <div className="flex flex-col items-center self-stretch">
          {step.items.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 ? (
                <div
                  className="w-full shrink-0 [height:var(--item-lane-gap,2rem)]"
                  aria-hidden
                />
              ) : null}
              <SkeletonTile className="mx-2 sm:mx-3" />
            </Fragment>
          ))}
        </div>
      ) : step.type === "branch" ? (
        <div className="flex flex-col items-center self-stretch justify-center">
          {step.branches.flatMap((branch) => branch.items).map((item, index) => (
            <Fragment key={`${item.id}-${index}`}>
              {index > 0 ? (
                <div
                  className="w-full shrink-0 [height:var(--item-diverge-gap,0.875rem)]"
                  aria-hidden
                />
              ) : null}
              <SkeletonTile className="mx-2 sm:mx-3" />
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center self-stretch">
          {step.items.map((item) => (
            <SkeletonTile key={item.id} className="mx-2 sm:mx-3" />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemBuildPathSkeleton({ steps }: { steps: SerializedGuideItemStep[] }) {
  return (
    <div className="w-full max-w-full overflow-visible">
      <div className="relative flex w-full min-w-0 items-stretch overflow-visible">
        {steps.map((step, index) => (
          <Fragment key={index}>
            {index > 0 ? <div className={ITEM_LANE_SPACER_H} aria-hidden /> : null}
            <ItemStepColumnSkeleton step={step} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function ChampionIconSkeleton({ highlighted = false }: { highlighted?: boolean }) {
  return (
    <div
      className={clsx(
        "h-11 w-11 animate-pulse rounded-lg bg-[#352839]/90 ring-1 sm:h-12 sm:w-12",
        highlighted ? "ring-2 ring-[#F0ABCF]/30" : "ring-[#B8D8EA]/20"
      )}
      aria-hidden
    />
  );
}

function BuildDetailSkeleton({
  variant,
}: {
  variant: GuideItemPageData["tabs"][number]["variants"][number];
}) {
  return (
    <div className={clsx(ITEM_DETAIL_SECTION, ITEM_SECONDARY_PAD_X, "rounded-b-2xl")}>
      <div className="flex flex-row items-stretch gap-8 sm:gap-10 lg:gap-12">
        <div className="min-w-0 flex-[3]">
          <h3 className="text-xl font-bold tracking-tight text-[#FAD4E8]/20 sm:text-2xl">
            {variant.header}
          </h3>
          <TextLineSkeletons
            body={variant.description}
            className="mt-5 min-h-[14em] sm:mt-6 sm:min-h-[11em]"
          />
          <div className="mt-8 sm:mt-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/35 sm:text-sm">
              Good against
            </p>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {variant.goodAgainst.map((champion) => (
                <ChampionIconSkeleton key={champion.id} />
              ))}
            </div>
          </div>
        </div>

        <div aria-hidden className="w-px shrink-0 self-stretch bg-[#F0ABCF]/14" />

        <div className="flex min-w-0 flex-[2] items-center justify-center">
          <div className="flex h-full items-center justify-center gap-5 sm:gap-7">
            <div className="flex flex-col items-center">
              <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/35 sm:text-[0.65rem]">
                Your team
              </p>
              <div className="flex flex-col gap-2 sm:gap-2.5">
                {variant.teamComp.ally.map((champion) => (
                  <ChampionIconSkeleton
                    key={champion.id}
                    highlighted={champion.id === "Viego"}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#F0ABCF]/35 sm:text-[0.65rem]">
                Enemy team
              </p>
              <div className="flex flex-col gap-2 sm:gap-2.5">
                {variant.teamComp.enemy.map((champion) => (
                  <ChampionIconSkeleton key={champion.id} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemBuildSectionSkeleton({ data }: { data: GuideItemPageData }) {
  const defaultTab = data.tabs[0];
  const defaultVariant =
    defaultTab?.variants.find((variant) => variant.id === defaultTab.defaultVariantId) ??
    defaultTab?.variants[0];

  return (
    <div aria-hidden>
      <div className="mb-6 flex items-center gap-4 sm:gap-5">
        <h2 className={clsx(guideSectionTitleClass, "text-[#F5E6D3]/20")}>{data.heading}</h2>
        {data.headerIcon ? <SkeletonTile className="relative shrink-0" /> : null}
      </div>

      <div className={ITEM_PANEL_OUTER}>
        {data.preBuild ? (
          <div className={clsx(ITEM_SECONDARY_SECTION, "rounded-t-2xl py-0")}>
            <PreBuildStripSkeleton preBuild={data.preBuild} />
          </div>
        ) : null}

        <div className={ITEM_PRIMARY_MAIN}>
          <div className="relative z-10">
            <div className="flex w-full">
              {data.tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  className={clsx(
                    "px-5 py-3.5 text-sm font-semibold tracking-wide sm:px-6",
                    "ring-1 ring-inset",
                    index === 0 && "rounded-tl-2xl",
                    index === data.tabs.length - 1 && "rounded-br-2xl",
                    index === 0
                      ? "text-[#FAD4E8]/25 ring-[#F0ABCF]/20"
                      : "text-[#F5E6D3]/15 ring-[#F0ABCF]/10"
                  )}
                >
                  {tab.label}
                </div>
              ))}
            </div>

            <div className={ITEM_PRIMARY_BODY}>
              {defaultTab?.steps.length ? (
                <ItemBuildPathSkeleton steps={defaultTab.steps} />
              ) : defaultTab?.sharedPath ? (
                <div className="flex w-full min-w-0 items-stretch overflow-visible">
                  <ItemStepColumnSkeleton
                    step={{ type: "fixed", items: [defaultTab.sharedPath.origin] }}
                  />
                  <div className={ITEM_LANE_SPACER_H} aria-hidden />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-[var(--item-path-gap,2.125rem)]">
                    {defaultTab.sharedPath.paths.map((path, pathIndex) => (
                      <div
                        key={pathIndex}
                        className="relative flex w-full min-w-0 items-stretch overflow-visible"
                      >
                        {path.diverge ? (
                          <>
                            <ItemStepColumnSkeleton
                              step={{ type: "choice", items: path.diverge }}
                            />
                            <div className={ITEM_LANE_SPACER_H} aria-hidden />
                          </>
                        ) : null}
                        <div className="flex shrink-0 items-stretch self-stretch overflow-visible px-1 sm:px-2">
                          <div className="flex h-full flex-col items-center justify-center self-stretch">
                            {path.items.map((item, index) => (
                              <Fragment key={item.id}>
                                {index > 0 ? (
                                  <div
                                    className="w-full shrink-0 [height:var(--item-lane-gap,2rem)]"
                                    aria-hidden
                                  />
                                ) : null}
                                <SkeletonTile className="mx-2 sm:mx-3" />
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {defaultVariant ? <BuildDetailSkeleton variant={defaultVariant} /> : null}
      </div>
    </div>
  );
}

function MatchupCardSkeleton({
  selected,
  tone,
}: {
  selected: boolean;
  tone: "hard" | "easy";
}) {
  const accent =
    tone === "hard"
      ? "border-[#F87171]/22 bg-[#1E1724]/55"
      : "border-[#7AADD6]/22 bg-[#1E1724]/55";

  return (
    <div
      className={clsx(
        "flex min-h-[5.75rem] min-w-0 flex-col items-center justify-center rounded-lg border px-1 sm:min-h-[6.25rem]",
        selected ? "flex-[1.35] py-2.5" : "flex-1 py-2",
        accent
      )}
    >
      <SkeletonCircle
        className={selected ? "size-9 sm:size-10" : "size-8 sm:size-9"}
      />
      <div
        className={clsx(
          "mt-1.5 animate-pulse rounded bg-[#352839]/70",
          selected ? "h-3 w-12" : "h-3 w-10"
        )}
      />
    </div>
  );
}

export function MatchupSectionSkeleton({ data }: { data: GuideMatchupPageData }) {
  const hardColumn = data.columns.find((column) => column.tone === "hard") ?? data.columns[0];
  const easyColumn =
    data.columns.find((column) => column.tone === "easy") ?? data.columns[1] ?? hardColumn;
  const selectedMatchup = hardColumn.matchups[0];

  return (
    <div aria-hidden>
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        {[hardColumn, easyColumn].map((column) => {
          const accent = column.tone === "hard" ? "text-[#F87171]/25" : "text-[#7AADD6]/25";
          return (
            <div key={column.id} className="min-w-0">
              <h2
                className={clsx(
                  "text-sm font-bold uppercase tracking-[0.14em] sm:text-base",
                  accent
                )}
              >
                {column.label}
              </h2>
              <p className="mt-1.5 text-xs text-[#F5E6D3]/20 sm:text-sm">{column.subtitle}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex w-full items-end gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-end justify-between gap-1 sm:gap-1.5">
          {hardColumn.matchups.map((matchup, index) => (
            <MatchupCardSkeleton key={matchup.id} tone="hard" selected={index === 0} />
          ))}
        </div>

        <div aria-hidden className="mb-2 w-px shrink-0 self-stretch bg-[#F0ABCF]/14" />

        <div className="flex min-w-0 flex-1 items-end justify-between gap-1 sm:gap-1.5">
          {easyColumn.matchups.map((matchup) => (
            <MatchupCardSkeleton key={matchup.id} tone="easy" selected={false} />
          ))}
        </div>
      </div>

      {selectedMatchup ? (
        <div className="mt-5 w-full rounded-xl border border-[#F0ABCF]/12 bg-[#1E1724]/55 p-4 sm:p-5">
          <div className="flex items-start gap-4 sm:gap-5">
            <SkeletonTile className="h-[4.2rem] w-[4.2rem] shrink-0 rounded-lg sm:h-[4.9rem] sm:w-[4.9rem]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none text-[#F87171]/25 sm:text-base">
                {selectedMatchup.name}
              </p>
              <TextLineSkeletons
                body={selectedMatchup.explanation}
                className="mt-2 text-sm leading-[1.7] sm:text-base"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

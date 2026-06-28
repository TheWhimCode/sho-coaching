import clsx from "clsx";
import { Fragment, type ReactNode } from "react";
import {
  guideRuneLayoutGapClass,
  guideRuneOuterPanelClass,
  guideSectionHeaderPadClass,
  guideSectionTitleClass,
  guideMobileFlushPanelClass,
} from "@/lib/guides/guideTheme";
import type {
  GuideItemPageData,
  SerializedGuideItemSharedPath,
  SerializedGuideItemStep,
} from "@/lib/guides/itemGuideTypes";
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
  "w-full min-w-0 max-w-full overflow-x-hidden rounded-none border border-[#F0ABCF]/15 border-x-0 bg-[#16121A]/95 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm sm:overflow-visible sm:rounded-2xl sm:border-x";

const ITEM_SECONDARY_SECTION = "w-full py-5 sm:py-6";

const ITEM_DETAIL_SECTION = "w-full py-8 sm:py-10";

const ITEM_SECONDARY_PAD_X = "px-6 sm:px-10 lg:px-14";

const ITEM_PRIMARY_MAIN =
  "relative w-full overflow-hidden rounded-none border-y border-[#F0ABCF]/15 bg-[#2A1F2E]/92 sm:rounded-2xl";

const ITEM_PRIMARY_BODY =
  "min-w-0 max-w-full overflow-x-auto px-6 py-10 sm:overflow-visible sm:px-10 sm:py-12 lg:px-14 lg:py-14";

const ITEM_LANE_SPACER_H =
  "flex min-w-0 flex-1 items-center justify-center px-3 sm:px-5 md:px-6";

const PREBUILD_HEADER_CLASS =
  "text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/55";

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

function StatShardSkeletonGrid({
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
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center justify-center gap-2 sm:gap-3.5"
        >
          {row.shards.map((shard) => (
            <SkeletonCircle key={shard.id} className="size-6 sm:size-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

function RuneTreeSkeletonPanel({
  tree,
  hideKeystone = false,
  statShardRows,
  statShardClassName,
}: {
  tree: SerializedRuneTree;
  hideKeystone?: boolean;
  statShardRows?: SerializedStatShardRow[];
  statShardClassName?: string;
}) {
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
              {row.map((rune) => (
                <div key={rune.id} className="flex flex-none items-center justify-center">
                  <SkeletonCircle
                    className={
                      isKeystoneRow
                        ? "size-14 sm:size-16 lg:size-[4.5rem]"
                        : "size-9 sm:size-11 lg:size-12"
                    }
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {statShardRows && statShardRows.length > 0 ? (
        <StatShardSkeletonGrid rows={statShardRows} className={statShardClassName} />
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
      <div className={clsx("mb-6 flex items-center gap-4 sm:gap-5", guideSectionHeaderPadClass)}>
        <h2 className={clsx(guideSectionTitleClass, "text-[#F5E6D3]/20")}>{build.heading}</h2>
        {headerIcon ? (
          <SkeletonTile className="relative shrink-0 rounded-lg" />
        ) : null}
      </div>

      <div className={clsx(guideRuneOuterPanelClass, guideMobileFlushPanelClass)}>
        <div
          className={clsx(
            "flex flex-col lg:flex-row lg:items-stretch",
            guideRuneLayoutGapClass
          )}
        >
          <div className="w-full shrink-0 p-3 sm:p-5 lg:w-auto lg:flex-1">
            <div className="flex flex-col">
              <div className="flex flex-row items-start gap-1.5 sm:gap-6">
                <RuneTreeSkeletonPanel tree={primaryTree} />
                <RuneTreeSkeletonPanel
                  tree={secondaryTree}
                  hideKeystone
                  statShardRows={statShardRows}
                />
              </div>
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
  className,
  children,
}: {
  span: 1 | 2;
  showDivider?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex min-w-0 justify-center",
        span === 2 ? "col-span-2" : "col-span-1",
        showDivider && "sm:border-r sm:border-[#F0ABCF]/14",
        className
      )}
    >
      <div className="flex w-fit max-w-full flex-col items-start max-sm:items-center max-sm:mx-auto">
        {children}
      </div>
    </div>
  );
}

function PreBuildStripSkeleton({
  preBuild,
}: {
  preBuild: NonNullable<GuideItemPageData["preBuild"]>;
}) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-x-4 gap-y-4 px-4 py-2 sm:grid-cols-4 sm:gap-0 sm:px-0 sm:py-2.5">
      <PreBuildColumnSkeleton span={1} showDivider className="col-start-1 row-start-1">
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

      <PreBuildColumnSkeleton span={1} className="col-start-2 row-start-1 sm:col-start-4">
        <p className={PREBUILD_HEADER_CLASS}>Full build</p>
        <div className="flex flex-row flex-nowrap items-center gap-0.5 pt-2">
          <SkeletonTile compact className="ml-0 mr-1 sm:mr-1.5" />
          <SkeletonTile compact className="mx-1 sm:mx-1.5" />
        </div>
        <div className="mt-1.5 h-3 w-28 animate-pulse rounded bg-[#352839]/45" />
      </PreBuildColumnSkeleton>

      <PreBuildColumnSkeleton span={2} showDivider className="col-span-2 row-start-2 sm:col-start-2 sm:row-start-1">
        <p className={PREBUILD_HEADER_CLASS}>Boots</p>
        <div className="flex max-w-full flex-row flex-nowrap items-center pt-2 max-sm:justify-center">
          <SkeletonTile compact className="ml-0 mr-1 sm:mr-1.5" />
          <span aria-hidden className="shrink-0 px-1.5 text-base text-[#F0ABCF]/20 sm:px-2 sm:text-lg">
            ›
          </span>
          {preBuild.boots.map((_, index) => (
            <SkeletonTile key={index} compact className="mx-1 sm:mx-1" />
          ))}
        </div>
        {preBuild.bootsSubheading ? (
          <div className="mt-1.5 h-3 w-full max-w-[12rem] animate-pulse rounded bg-[#352839]/45 max-sm:mx-auto" />
        ) : null}
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

function isThreeChoiceFixedPath(steps: SerializedGuideItemStep[]): boolean {
  if (steps.length < 2) return false;
  const first = steps[0];
  if (first.type !== "choice" || first.items.length !== 3) return false;
  return steps.slice(1).every((step) => step.type === "fixed" && step.items.length > 0);
}

function isMobileForkMergeSharedPath(sharedPath: SerializedGuideItemSharedPath): boolean {
  if (sharedPath.paths.length !== 2) return false;

  const [path0, path1] = sharedPath.paths;
  if (path0.items.length === 0 || path1.items.length === 0) return false;
  if (path0.diverge?.length || !path1.diverge?.length) return false;
  if (path0.items[0].id !== path1.items[0].id) return false;

  return true;
}

function ItemSharedPathsLayoutMobileSkeleton({
  sharedPath,
}: {
  sharedPath: SerializedGuideItemSharedPath;
}) {
  const path0 = sharedPath.paths[0];
  const path1 = sharedPath.paths[1];
  const diverge = path1.diverge ?? [];

  return (
    <div className="flex w-full justify-center">
      <div className="relative w-fit max-w-[24rem]">
        <div className="flex flex-col items-center gap-[var(--item-lane-gap,3rem)]">
          <SkeletonTile compact className="mx-1" />

          <div className="grid w-full grid-cols-2 items-start gap-x-6">
            <div className="flex flex-col items-center gap-[var(--item-lane-gap,3rem)]">
              {diverge.length === 2 ? (
                <div className="flex flex-row items-center gap-1.5">
                  <SkeletonTile compact className="mx-0" />
                  <SkeletonTile compact className="mx-0" />
                </div>
              ) : null}
              {path1.items.map((item) => (
                <SkeletonTile key={item.id} compact className="mx-1" />
              ))}
            </div>

            <div className="flex flex-col items-center gap-[var(--item-lane-gap,3rem)]">
              {path0.items.map((item) => (
                <SkeletonTile key={item.id} compact className="mx-1" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemSharedPathsLayoutSkeleton({
  sharedPath,
}: {
  sharedPath: SerializedGuideItemSharedPath;
}) {
  const useMobileLayout = isMobileForkMergeSharedPath(sharedPath);

  return (
    <>
      {useMobileLayout ? (
        <div className="flex w-full justify-center sm:hidden">
          <ItemSharedPathsLayoutMobileSkeleton sharedPath={sharedPath} />
        </div>
      ) : null}

      <div className={clsx("flex w-full min-w-0 items-stretch overflow-visible", useMobileLayout && "hidden sm:block")}>
        <ItemStepColumnSkeleton step={{ type: "fixed", items: [sharedPath.origin] }} />
        <div className={ITEM_LANE_SPACER_H} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[var(--item-path-gap,2.125rem)]">
          {sharedPath.paths.map((path, pathIndex) => (
            <div
              key={pathIndex}
              className="relative flex w-full min-w-0 items-stretch overflow-visible"
            >
              {path.diverge ? (
                <>
                  <ItemStepColumnSkeleton step={{ type: "choice", items: path.diverge }} />
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
    </>
  );
}

function ItemBuildPathMobileSkeleton({ steps }: { steps: SerializedGuideItemStep[] }) {
  const fixedSteps = steps.slice(1);

  return (
    <div className="flex w-full justify-center">
      <div className={clsx("relative w-fit max-w-full", "max-w-[24rem]")}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-6">
          <div className="flex justify-end pr-1">
            <SkeletonTile compact className="ml-1 mr-0" />
          </div>
          <div className="flex flex-col items-center gap-[var(--item-lane-gap,3rem)]">
            <SkeletonTile compact className="mx-1" />
            {fixedSteps.map((step) =>
              step.type === "fixed" ? (
                <SkeletonTile key={step.items[0].id} compact className="mx-1" />
              ) : null
            )}
          </div>
          <div className="flex justify-start pl-1">
            <SkeletonTile compact className="ml-0 mr-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemBuildPathSkeleton({ steps }: { steps: SerializedGuideItemStep[] }) {
  const useMobileLayout = isThreeChoiceFixedPath(steps);

  return (
    <>
      {useMobileLayout ? (
        <div className="flex w-full justify-center sm:hidden">
          <ItemBuildPathMobileSkeleton steps={steps} />
        </div>
      ) : null}

      <div className={clsx("w-full max-w-full overflow-visible", useMobileLayout && "hidden sm:block")}>
        <div className="relative flex w-full min-w-0 items-stretch overflow-visible">
          {steps.map((step, index) => (
            <Fragment key={index}>
              {index > 0 ? <div className={ITEM_LANE_SPACER_H} aria-hidden /> : null}
              <ItemStepColumnSkeleton step={step} />
            </Fragment>
          ))}
        </div>
      </div>
    </>
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
    <div className={clsx(ITEM_DETAIL_SECTION, ITEM_SECONDARY_PAD_X, "min-w-0 max-w-full overflow-x-hidden rounded-none sm:overflow-visible sm:rounded-b-2xl")}>
      <div className="flex w-full min-w-0 max-w-full flex-col items-stretch gap-8 sm:flex-row sm:gap-10 lg:gap-12">
        <div className="min-w-0 w-full max-w-full flex-[3]">
          <h3 className="break-words text-center text-xl font-bold tracking-tight text-[#FAD4E8]/20 sm:text-left sm:text-2xl">
            {variant.header}
          </h3>
          <TextLineSkeletons
            body={variant.description}
            className="mt-5 sm:mt-6 sm:min-h-[11em]"
          />
          <div className="mt-8 sm:mt-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/35 max-sm:text-center sm:text-sm">
              Good against
            </p>
            <div className="flex flex-wrap gap-2.5 max-sm:justify-center sm:gap-3">
              {variant.goodAgainst.map((champion) => (
                <ChampionIconSkeleton key={champion.id} />
              ))}
            </div>
          </div>
        </div>

        <div aria-hidden className="w-px shrink-0 self-stretch bg-[#F0ABCF]/14 max-sm:hidden" />

        <div className="flex min-w-0 flex-[2] items-center justify-center max-sm:hidden">
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
      <div className={clsx("mb-6 flex items-center gap-4 sm:gap-5", guideSectionHeaderPadClass)}>
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
                <ItemSharedPathsLayoutSkeleton sharedPath={defaultTab.sharedPath} />
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
        "flex min-w-0 flex-col items-center justify-center rounded-lg border px-1",
        "min-h-[4.25rem] max-sm:w-full sm:min-h-[6.25rem]",
        selected ? "max-sm:py-2 sm:flex-[1.35] sm:py-2.5" : "max-sm:py-1.5 sm:flex-1 sm:py-2",
        accent
      )}
    >
      <SkeletonCircle
        className={selected ? "size-7 sm:size-10" : "size-6 sm:size-9"}
      />
      <div
        className={clsx(
          "mt-1 animate-pulse rounded bg-[#352839]/70",
          selected ? "h-3 w-12" : "h-3 w-10"
        )}
      />
    </div>
  );
}

function MatchupColumnSkeleton({ column }: { column: GuideMatchupPageData["columns"][number] }) {
  const accent = column.tone === "hard" ? "text-[#F87171]/25" : "text-[#7AADD6]/25";

  return (
    <div className="min-w-0 w-full flex-1">
      <h2
        className={clsx(
          "text-sm font-bold uppercase tracking-[0.14em] sm:hidden",
          accent
        )}
      >
        {column.label}
      </h2>
      <div className="mt-3 grid w-full min-w-0 grid-cols-3 gap-1.5 sm:mt-0 sm:flex sm:items-end sm:justify-between sm:gap-1.5">
        {column.matchups.map((matchup, index) => (
          <MatchupCardSkeleton
            key={matchup.id}
            tone={column.tone}
            selected={column.tone === "hard" && index === 0}
          />
        ))}
      </div>
    </div>
  );
}

export function MatchupSectionSkeleton({ data }: { data: GuideMatchupPageData }) {
  const hardColumn = data.columns.find((column) => column.tone === "hard") ?? data.columns[0];
  const easyColumn =
    data.columns.find((column) => column.tone === "easy") ?? data.columns[1] ?? hardColumn;
  const selectedMatchup = hardColumn.matchups[0];

  return (
    <div aria-hidden className="w-full min-w-0 max-w-full">
      <div className={clsx("hidden w-full grid-cols-2 gap-8 sm:grid", guideSectionHeaderPadClass)}>
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

      <div
        className={clsx(
          "mt-0 flex w-full min-w-0 max-w-full flex-col gap-4 sm:mt-5 sm:flex-row sm:items-end sm:gap-3",
          guideSectionHeaderPadClass
        )}
      >
        <MatchupColumnSkeleton column={hardColumn} />

        <div aria-hidden className="mb-2 hidden w-px shrink-0 self-stretch bg-[#F0ABCF]/14 sm:block" />

        <MatchupColumnSkeleton column={easyColumn} />
      </div>

      {selectedMatchup ? (
        <div className="mt-4 w-full min-w-0 max-w-full rounded-none border border-[#F0ABCF]/12 border-x-0 bg-[#1E1724]/55 px-6 py-4 sm:mt-5 sm:rounded-xl sm:border-x sm:p-5">
          <div className="flex items-start gap-3 sm:gap-5">
            <SkeletonTile className="h-12 w-12 shrink-0 rounded-lg sm:h-[4.9rem] sm:w-[4.9rem]" />
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

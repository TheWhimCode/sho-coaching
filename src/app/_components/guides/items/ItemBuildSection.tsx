"use client";

import clsx from "clsx";
import { Fragment, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject, type TransitionEvent } from "react";
import { createPortal } from "react-dom";
import type {
  GuideItemPageData,
  SerializedGuideItem,
  SerializedGuideItemPreBuild,
  SerializedGuideItemSharedPath,
  SerializedGuideItemStep,
  SerializedGuideItemTeamComp,
  SerializedGuideItemVariant,
  SerializedGuideItemTab,
} from "@/lib/guides/itemGuideTypes";
import GuideCrossOverlay from "@/app/_components/guides/GuideCrossOverlay";
import GuideImage from "@/app/_components/guides/GuideImage";
import { ItemBuildSectionSkeleton } from "@/app/_components/guides/GuideSectionSkeletons";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { useGuideSectionImages } from "@/app/_components/guides/useGuideSectionImages";
import { collectItemSectionImageUrls } from "@/lib/guides/preloadGuideImages";
import { guideChampionIconImgClass, guideSectionHeaderPadClass, guideSectionTitleClass } from "@/lib/guides/guideTheme";

const GuideTextIconsContext = createContext<Record<string, string>>({});

function useGuideTextIcons() {
  return useContext(GuideTextIconsContext);
}

const ITEM_PANEL_OUTER =
  "w-full min-w-0 max-w-full overflow-x-hidden rounded-none border border-[#F0ABCF]/15 border-x-0 bg-[#16121A]/95 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm sm:overflow-visible sm:rounded-2xl sm:border-x";

const ITEM_SECONDARY_SECTION = "w-full py-5 sm:py-6";

const ITEM_DETAIL_SECTION = "w-full py-8 sm:py-10";

const BUILD_DETAIL_FADE_MS = 220;

const ITEM_SECONDARY_PAD_X = "px-6 sm:px-10 lg:px-14";

const ITEM_PRIMARY_MAIN =
  "relative w-full overflow-hidden rounded-none border-y border-[#F0ABCF]/15 bg-[#2A1F2E]/92 sm:rounded-2xl";

const ITEM_PRIMARY_BODY =
  "min-w-0 max-w-full overflow-x-auto px-6 py-10 sm:overflow-visible sm:px-10 sm:py-12 lg:px-14 lg:py-14";
const ITEM_LANE_SPACER_H =
  "flex min-w-0 flex-1 items-center justify-center px-3 sm:px-5 md:px-6";

const ITEM_MOBILE_PATH_MAX_W = "max-w-[24rem]";
const ITEM_MOBILE_PATH_COL_GAP = "gap-x-6";
const ITEM_MOBILE_PATH_ROW_GAP = "gap-[var(--item-lane-gap,3rem)]";
const ITEM_MOBILE_DIVERGE_PAIR_GAP = "gap-1.5";

const ITEM_TILE_CLASS =
  "aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#352839] ring-1 ring-[#F0ABCF]/30 sm:h-16 sm:w-16";

const ITEM_TILE_COMPACT_CLASS =
  "aspect-square h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#352839] ring-1 ring-[#F0ABCF]/30 sm:h-12 sm:w-12";

function ItemExplanationPanel({
  item,
  open,
  position,
  placement,
  tipId,
  onTransitionEnd,
}: {
  item: SerializedGuideItem;
  open: boolean;
  position: { top: number; left: number };
  placement: "right" | "below";
  tipId: string;
  onTransitionEnd?: (event: TransitionEvent<HTMLDivElement>) => void;
}) {
  const guideTextIcons = useGuideTextIcons();
  return (
    <div
      id={tipId}
      className={clsx(
        "pointer-events-none fixed z-[200]",
        placement === "right" && "-translate-y-1/2",
        placement === "below" && "-translate-x-1/2"
      )}
      style={{ top: position.top, left: position.left }}
      role="tooltip"
    >
      <div
        onTransitionEnd={onTransitionEnd}
        className={clsx(
          "transition-opacity duration-200 ease-out",
          open && placement === "right" && "animate-item-tip-in opacity-100",
          open && placement === "below" && "animate-item-tip-in-below opacity-100",
          !open && "opacity-0"
        )}
      >
        <div
          className={clsx(
            "relative w-72 overflow-visible rounded-xl border border-[#F0ABCF]/25 sm:w-80",
            "bg-[#2A1F2E] shadow-[0_12px_40px_rgba(30,23,36,0.55)] ring-1 ring-[#B8D8EA]/10 backdrop-blur-md",
            placement === "right" && [
              "before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:-translate-x-full before:-translate-y-1/2 before:content-['']",
              "before:border-y-[10px] before:border-r-[11px] before:border-y-transparent before:border-r-[#F0ABCF]/25",
              "after:pointer-events-none after:absolute after:left-0 after:top-1/2 after:-translate-x-[calc(100%-1px)] after:-translate-y-1/2 after:content-['']",
              "after:border-y-[9px] after:border-r-[10px] after:border-y-transparent after:border-r-[#2A1F2E]",
            ],
            placement === "below" && [
              "before:pointer-events-none before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:content-['']",
              "before:border-x-[10px] before:border-b-[11px] before:border-x-transparent before:border-b-[#F0ABCF]/25",
              "after:pointer-events-none after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:mb-px after:content-['']",
              "after:border-x-[9px] after:border-b-[10px] after:border-x-transparent after:border-b-[#2A1F2E]",
            ]
          )}
        >
          <div className="relative px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-sm font-semibold tracking-wide text-[#FAD4E8]">{item.title}</p>
            <p className="mt-2 text-sm leading-[1.65] text-[#F5E6D3]/72">
              {renderGuideHighlightedText(item.explanation, guideTextIcons)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemTile({
  item,
  tileKey,
  inactive = false,
  crossed = false,
  compact = false,
  flushEdge,
  compactSpacing = "normal",
  onSelect,
}: {
  item: SerializedGuideItem;
  tileKey?: string;
  inactive?: boolean;
  crossed?: boolean;
  compact?: boolean;
  /** Drop outer margin on one edge — for pre-build column flush alignment. */
  flushEdge?: "start" | "end";
  compactSpacing?: "normal" | "tight";
  onSelect?: () => void;
}) {
  const tileRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const [tipLayout, setTipLayout] = useState<{
    top: number;
    left: number;
    placement: "right" | "below";
  } | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);
  const interactive = Boolean(onSelect);
  const hoverEnabled = !inactive && !crossed;
  const showHover = hovered && hoverEnabled;
  const showTip = showHover || tipVisible;

  useEffect(() => setPortalMounted(true), []);

  useLayoutEffect(() => {
    if (showHover) setTipVisible(true);
  }, [showHover]);

  useLayoutEffect(() => {
    if (!showTip) {
      setTipLayout(null);
      return;
    }

    const dismissTip = () => {
      setHovered(false);
      if (tileRef.current?.contains(document.activeElement)) {
        (document.activeElement as HTMLElement).blur();
      }
    };

    const updatePosition = () => {
      const el = tileRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const below = window.matchMedia("(max-width: 639px)").matches;

      if (below) {
        const panelHalfWidth = 144;
        const edgePad = 12;
        const centerX = Math.min(
          Math.max(rect.left + rect.width / 2, panelHalfWidth + edgePad),
          window.innerWidth - panelHalfWidth - edgePad
        );
        setTipLayout({
          top: rect.bottom + 11,
          left: centerX,
          placement: "below",
        });
        return;
      }

      setTipLayout({
        top: rect.top + rect.height / 2,
        left: rect.right + 11,
        placement: "right",
      });
    };

    updatePosition();
    window.addEventListener("scroll", dismissTip, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", dismissTip, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showTip]);

  const handleTipTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "opacity" || showHover) return;
    setTipVisible(false);
  };

  const compactMargin =
    flushEdge === "start"
      ? "ml-0 mr-1 sm:mr-1.5"
      : flushEdge === "end"
        ? "ml-1 mr-0 sm:ml-1.5 sm:mr-0"
        : compactSpacing === "tight"
          ? "mx-1 sm:mx-1"
          : "mx-1 sm:mx-1.5";

  return (
    <div
      ref={tileRef}
      data-item-tile={tileKey}
      className={clsx(
        "relative z-[2] shrink-0 outline-none transition-[opacity,filter] duration-300 ease-out",
        compact ? compactMargin : "mx-2 sm:mx-3",
        inactive && "opacity-[0.32] saturate-[0.35]"
      )}
    >
      <div
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : undefined}
        className={clsx(
          compact ? ITEM_TILE_COMPACT_CLASS : ITEM_TILE_CLASS,
          "relative transition-[opacity,box-shadow,filter] duration-300 ease-out",
          interactive && "cursor-pointer",
          !interactive && "cursor-default",
          !inactive &&
            (showHover || interactive || !compact) &&
            "ring-[#F0ABCF]/55 shadow-[0_0_16px_rgba(240,171,207,0.2)]",
          !inactive &&
            "focus-visible:ring-[#F0ABCF]/55 focus-visible:shadow-[0_0_16px_rgba(240,171,207,0.2)]"
        )}
        aria-describedby={hoverEnabled ? `item-tip-${tileKey ?? item.id}` : undefined}
        aria-pressed={interactive ? !inactive : undefined}
        onMouseEnter={() => {
          if (hoverEnabled) setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => {
          if (hoverEnabled) setHovered(true);
        }}
        onBlur={() => setHovered(false)}
        onClick={onSelect}
        onKeyDown={
          onSelect
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect();
                }
              }
            : undefined
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <GuideImage
          src={item.icon}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {crossed ? <GuideCrossOverlay /> : null}
      </div>
      {portalMounted && showTip && tipLayout
        ? createPortal(
            <ItemExplanationPanel
              item={item}
              open={showHover}
              position={tipLayout}
              placement={tipLayout.placement}
              tipId={`item-tip-${tileKey ?? item.id}`}
              onTransitionEnd={handleTipTransitionEnd}
            />,
            document.body
          )
        : null}
    </div>
  );
}

const CONNECTOR_STROKE = "rgba(245, 230, 211, 0.42)";
const INACTIVE_CONNECTOR_OPACITY = "0.32";

type ConnectorSegment = { d: string; inactive: boolean };

function isChoiceItemInactive(
  itemId: number,
  activeChoiceIds?: number[] | null,
  pathInactive = false
) {
  if (pathInactive) return true;
  const hasSelection = Boolean(activeChoiceIds && activeChoiceIds.length > 0);
  return hasSelection && !activeChoiceIds!.includes(itemId);
}

function connectorPath(
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const bendX = start.x + (end.x - start.x) * 0.55;
  return `M ${start.x} ${start.y} C ${bendX} ${start.y}, ${bendX} ${end.y}, ${end.x} ${end.y}`;
}

/** Single-bend curve — one control point at the axis corner (no S-shape). */
function connectorPathCorner(
  start: { x: number; y: number },
  end: { x: number; y: number },
  bend: "vertical-first" | "horizontal-first" = "vertical-first"
) {
  if (bend === "vertical-first") {
    return `M ${start.x} ${start.y} Q ${start.x} ${end.y} ${end.x} ${end.y}`;
  }
  return `M ${start.x} ${start.y} Q ${end.x} ${start.y} ${end.x} ${end.y}`;
}

function collectTileRefs(row: HTMLElement): Map<string, HTMLElement> {
  const map = new Map<string, HTMLElement>();
  for (const el of row.querySelectorAll<HTMLElement>("[data-item-tile]")) {
    const key = el.dataset.itemTile;
    if (key) map.set(key, el);
  }
  return map;
}

function buildConnectorPaths(
  steps: SerializedGuideItemStep[],
  rowRect: DOMRect,
  tileRefs: Map<string, HTMLElement>,
  activeChoiceIds?: number[] | null
): ConnectorSegment[] {
  const paths: ConnectorSegment[] = [];

  const tilePoint = (stepIndex: number, itemId: number, side: "left" | "right") => {
    const el = tileRefs.get(`${stepIndex}-${itemId}`);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: side === "right" ? rect.right - rowRect.left : rect.left - rowRect.left,
      y: rect.top + rect.height / 2 - rowRect.top,
    };
  };

  const pushPath = (
    start: { x: number; y: number } | null,
    end: { x: number; y: number } | null,
    inactive = false
  ) => {
    if (start && end) paths.push({ d: connectorPath(start, end), inactive });
  };

  for (let i = 0; i < steps.length - 1; i++) {
    const left = steps[i];
    const right = steps[i + 1];

    if (left.type === "choice" && right.type === "fixed") {
      const end = tilePoint(i + 1, right.items[0].id, "left");
      for (const item of left.items) {
        pushPath(
          tilePoint(i, item.id, "right"),
          end,
          isChoiceItemInactive(item.id, activeChoiceIds)
        );
      }
    } else if (left.type === "fixed" && right.type === "choice") {
      const start = tilePoint(i, left.items[0].id, "right");
      for (const item of right.items) {
        pushPath(
          start,
          tilePoint(i + 1, item.id, "left"),
          isChoiceItemInactive(item.id, activeChoiceIds)
        );
      }
    } else if (left.type === "choice" && right.type === "branch") {
      for (const branch of right.branches) {
        pushPath(
          tilePoint(i, branch.afterItemId, "right"),
          tilePoint(i + 1, branch.items[0].id, "left"),
          isChoiceItemInactive(branch.afterItemId, activeChoiceIds)
        );
      }
    } else if (left.type === "branch" && right.type === "fixed") {
      const end = tilePoint(i + 1, right.items[0].id, "left");
      for (const branch of left.branches) {
        pushPath(tilePoint(i, branch.items[0].id, "right"), end);
      }
    } else if (left.type === "fixed" && right.type === "fixed") {
      pushPath(
        tilePoint(i, left.items[0].id, "right"),
        tilePoint(i + 1, right.items[0].id, "left")
      );
    }
  }

  return paths;
}

function isThreeChoiceFixedPath(steps: SerializedGuideItemStep[]): boolean {
  if (steps.length < 2) return false;
  const first = steps[0];
  if (first.type !== "choice" || first.items.length !== 3) return false;
  return steps.slice(1).every((step) => step.type === "fixed" && step.items.length > 0);
}

function tileEdgePoint(
  el: HTMLElement | undefined,
  containerRect: DOMRect,
  edge: "left" | "right" | "top" | "bottom"
): { x: number; y: number } | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 - containerRect.left;
  const centerY = rect.top + rect.height / 2 - containerRect.top;

  switch (edge) {
    case "left":
      return { x: rect.left - containerRect.left, y: centerY };
    case "right":
      return { x: rect.right - containerRect.left, y: centerY };
    case "top":
      return { x: centerX, y: rect.top - containerRect.top };
    case "bottom":
      return { x: centerX, y: rect.bottom - containerRect.top };
  }
}

function buildMobileThreeChoiceFixedConnectors(
  steps: SerializedGuideItemStep[],
  containerRect: DOMRect,
  tileRefs: Map<string, HTMLElement>,
  activeChoiceIds?: number[] | null
): ConnectorSegment[] {
  const paths: ConnectorSegment[] = [];
  const choiceStep = steps[0];
  if (choiceStep.type !== "choice" || choiceStep.items.length !== 3) return paths;

  const pushPath = (
    start: { x: number; y: number } | null,
    end: { x: number; y: number } | null,
    inactive = false,
    bend?: "vertical-first" | "horizontal-first"
  ) => {
    if (!start || !end) return;
    paths.push({
      d: bend ? connectorPathCorner(start, end, bend) : connectorPath(start, end),
      inactive,
    });
  };

  const point = (key: string, edge: "left" | "right" | "top" | "bottom") =>
    tileEdgePoint(tileRefs.get(key), containerRect, edge);

  const collectorStep = steps[1];
  if (collectorStep.type !== "fixed") return paths;

  const collectorId = collectorStep.items[0].id;
  const collectorKey = `1-${collectorId}`;

  const [leftChoice, centerChoice, rightChoice] = choiceStep.items;

  pushPath(
    point(`0-${leftChoice.id}`, "bottom"),
    point(collectorKey, "left"),
    isChoiceItemInactive(leftChoice.id, activeChoiceIds),
    "vertical-first"
  );
  pushPath(
    point(`0-${centerChoice.id}`, "bottom"),
    point(collectorKey, "top"),
    isChoiceItemInactive(centerChoice.id, activeChoiceIds)
  );
  pushPath(
    point(`0-${rightChoice.id}`, "bottom"),
    point(collectorKey, "right"),
    isChoiceItemInactive(rightChoice.id, activeChoiceIds),
    "vertical-first"
  );

  for (let stepIndex = 1; stepIndex < steps.length - 1; stepIndex++) {
    const from = steps[stepIndex];
    const to = steps[stepIndex + 1];
    if (from.type !== "fixed" || to.type !== "fixed") continue;

    pushPath(
      point(`${stepIndex}-${from.items[0].id}`, "bottom"),
      point(`${stepIndex + 1}-${to.items[0].id}`, "top")
    );
  }

  return paths;
}

function sharedPathTileKey(pathIndex: number, stepIndex: number, itemId: number) {
  return `${pathIndex}-${stepIndex}-${itemId}`;
}

function sharedPathDivergeKey(pathIndex: number, itemId: number) {
  return `${pathIndex}-d-${itemId}`;
}

function buildSharedPathConnectors(
  sharedPath: SerializedGuideItemSharedPath,
  containerRect: DOMRect,
  tileRefs: Map<string, HTMLElement>,
  activePathIndex?: number | null,
  activeChoiceIds?: number[] | null
): ConnectorSegment[] {
  const paths: ConnectorSegment[] = [];

  const tilePoint = (key: string, side: "left" | "right") => {
    const el = tileRefs.get(key);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: side === "right" ? rect.right - containerRect.left : rect.left - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  };

  const pushPath = (
    start: { x: number; y: number } | null,
    end: { x: number; y: number } | null,
    inactive = false
  ) => {
    if (start && end) paths.push({ d: connectorPath(start, end), inactive });
  };

  const originKey = `shared-${sharedPath.origin.id}`;
  const originRight = tilePoint(originKey, "right");

  for (let pathIndex = 0; pathIndex < sharedPath.paths.length; pathIndex++) {
    const path = sharedPath.paths[pathIndex];
    if (path.items.length === 0) continue;

    const pathInactive = activePathIndex != null && activePathIndex !== pathIndex;

    if (path.diverge && path.diverge.length > 0) {
      const hubKey = sharedPathTileKey(pathIndex, 0, path.items[0].id);
      const hubLeft = tilePoint(hubKey, "left");
      if (!originRight || !hubLeft) continue;

      const firstDivergeLeft = tilePoint(
        sharedPathDivergeKey(pathIndex, path.diverge[0].id),
        "left"
      );
      if (!firstDivergeLeft) continue;

      const busX =
        originRight.x + Math.max(28, (firstDivergeLeft.x - originRight.x) * 0.38);
      const busPoint = { x: busX, y: hubLeft.y };

      pushPath(originRight, busPoint, pathInactive);

      for (const item of path.diverge) {
        const divergeInactive = isChoiceItemInactive(item.id, activeChoiceIds, pathInactive);
        const divergeKey = sharedPathDivergeKey(pathIndex, item.id);
        pushPath(busPoint, tilePoint(divergeKey, "left"), divergeInactive);
        pushPath(tilePoint(divergeKey, "right"), hubLeft, divergeInactive);
      }
    } else {
      const firstKey = sharedPathTileKey(pathIndex, 0, path.items[0].id);
      pushPath(originRight, tilePoint(firstKey, "left"), pathInactive);
    }

    for (let stepIndex = 0; stepIndex < path.items.length - 1; stepIndex++) {
      const fromKey = sharedPathTileKey(pathIndex, stepIndex, path.items[stepIndex].id);
      const toKey = sharedPathTileKey(pathIndex, stepIndex + 1, path.items[stepIndex + 1].id);
      pushPath(tilePoint(fromKey, "right"), tilePoint(toKey, "left"), pathInactive);
    }
  }

  return paths;
}

function ConnectorSvg({
  svgRef,
  groupRef,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  groupRef: RefObject<SVGGElement | null>;
}) {
  return (
    <svg
      ref={svgRef}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-[1] overflow-visible"
    >
      <g ref={groupRef} />
    </svg>
  );
}

function paintConnectorPaths(group: SVGGElement, segments: ConnectorSegment[]) {
  const ns = "http://www.w3.org/2000/svg";
  group.replaceChildren(
    ...segments.map(({ d, inactive }) => {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", CONNECTOR_STROKE);
      path.setAttribute("stroke-width", "1.75");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-opacity", inactive ? INACTIVE_CONNECTOR_OPACITY : "1");
      path.style.transition = "stroke-opacity 300ms ease-out";
      return path;
    })
  );
}

function ChoiceColumn({
  items,
  stepIndex,
  activeChoiceIds,
  rowInactive = false,
  onChoiceSelect,
}: {
  items: SerializedGuideItem[];
  stepIndex: number;
  activeChoiceIds?: number[] | null;
  rowInactive?: boolean;
  onChoiceSelect?: (itemId: number) => void;
}) {
  const hasSelection = Boolean(activeChoiceIds && activeChoiceIds.length > 0);

  return (
    <div className="flex flex-col items-center self-stretch">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 ? (
            <div
              className="w-full shrink-0 [height:var(--item-lane-gap,2rem)]"
              aria-hidden
            />
          ) : null}
          <ItemTile
            item={item}
            tileKey={`${stepIndex}-${item.id}`}
            inactive={
              rowInactive || (hasSelection && !activeChoiceIds!.includes(item.id))
            }
            onSelect={onChoiceSelect ? () => onChoiceSelect(item.id) : undefined}
          />
        </Fragment>
      ))}
    </div>
  );
}

function BranchColumn({
  branches,
  stepIndex,
}: {
  branches: { afterItemId: number; items: SerializedGuideItem[] }[];
  stepIndex: number;
}) {
  return (
    <div className="flex flex-col items-center self-stretch">
      {branches.map((branch, i) => (
        <Fragment key={branch.afterItemId}>
          {i > 0 ? (
            <div
              className="w-full shrink-0 [height:var(--item-lane-gap,2rem)]"
              aria-hidden
            />
          ) : null}
          {branch.items.map((item) => (
            <ItemTile
              key={item.id}
              item={item}
              tileKey={`${stepIndex}-${item.id}`}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function FixedColumn({
  items,
  stepIndex,
  inactive = false,
}: {
  items: SerializedGuideItem[];
  stepIndex: number;
  inactive?: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center self-stretch">
      {items.map((item) => (
        <ItemTile
          key={item.id}
          item={item}
          tileKey={`${stepIndex}-${item.id}`}
          inactive={inactive}
        />
      ))}
    </div>
  );
}

function ItemStepColumn({
  step,
  stepIndex,
  activeChoiceIds,
  rowInactive = false,
  onChoiceSelect,
}: {
  step: SerializedGuideItemStep;
  stepIndex: number;
  activeChoiceIds?: number[] | null;
  rowInactive?: boolean;
  onChoiceSelect?: (itemId: number) => void;
}) {
  return (
    <div className="flex shrink-0 self-stretch items-stretch overflow-visible px-1 sm:px-2">
      {step.type === "choice" ? (
        <ChoiceColumn
          items={step.items}
          stepIndex={stepIndex}
          activeChoiceIds={activeChoiceIds}
          rowInactive={rowInactive}
          onChoiceSelect={onChoiceSelect}
        />
      ) : step.type === "branch" ? (
        <BranchColumn branches={step.branches} stepIndex={stepIndex} />
      ) : (
        <FixedColumn items={step.items} stepIndex={stepIndex} inactive={rowInactive} />
      )}
    </div>
  );
}

function SharedPathDivergeColumn({
  pathIndex,
  items,
  activeChoiceIds,
  rowInactive = false,
  onChoiceSelect,
}: {
  pathIndex: number;
  items: SerializedGuideItem[];
  activeChoiceIds?: number[] | null;
  rowInactive?: boolean;
  onChoiceSelect?: (itemId: number) => void;
}) {
  const hasSelection = Boolean(activeChoiceIds && activeChoiceIds.length > 0);

  return (
    <div className="flex flex-col items-center self-stretch justify-center px-1 sm:px-2">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 ? (
            <div
              className="w-full shrink-0 [height:var(--item-diverge-gap,0.875rem)]"
              aria-hidden
            />
          ) : null}
          <ItemTile
            item={item}
            tileKey={sharedPathDivergeKey(pathIndex, item.id)}
            inactive={
              rowInactive || (hasSelection && !activeChoiceIds!.includes(item.id))
            }
            onSelect={onChoiceSelect ? () => onChoiceSelect(item.id) : undefined}
          />
        </Fragment>
      ))}
    </div>
  );
}

function SharedPathRow({
  pathIndex,
  path,
  activeChoiceIds,
  activePathIndex,
  onChoiceSelect,
  onPathSelect,
}: {
  pathIndex: number;
  path: SerializedGuideItemSharedPath["paths"][number];
  activeChoiceIds?: number[] | null;
  activePathIndex?: number | null;
  onChoiceSelect?: (itemId: number) => void;
  onPathSelect?: (pathIndex: number) => void;
}) {
  const hasDiverge = Boolean(path.diverge && path.diverge.length > 0);
  const rowInactive =
    activePathIndex != null && activePathIndex !== pathIndex;

  return (
    <div
      className={clsx(
        "relative flex min-w-0 items-stretch overflow-visible transition-[opacity,filter] duration-300 ease-out",
        rowInactive && "opacity-[0.32] saturate-[0.35]"
      )}
    >
      <div className={ITEM_LANE_SPACER_H} data-item-lane aria-hidden />
      {hasDiverge ? (
        <>
          <SharedPathDivergeColumn
            pathIndex={pathIndex}
            items={path.diverge!}
            activeChoiceIds={activeChoiceIds}
            rowInactive={rowInactive}
            onChoiceSelect={onChoiceSelect}
          />
          {path.items.map((item, stepIndex) => (
            <Fragment key={sharedPathTileKey(pathIndex, stepIndex, item.id)}>
              <div className={ITEM_LANE_SPACER_H} data-item-lane aria-hidden />
              <div className="flex shrink-0 items-center self-stretch px-1 sm:px-2">
                <ItemTile
                  item={item}
                  tileKey={sharedPathTileKey(pathIndex, stepIndex, item.id)}
                  inactive={rowInactive}
                  onSelect={onPathSelect ? () => onPathSelect(pathIndex) : undefined}
                />
              </div>
            </Fragment>
          ))}
        </>
      ) : (
        path.items.map((item, stepIndex) => (
          <Fragment key={sharedPathTileKey(pathIndex, stepIndex, item.id)}>
            {stepIndex > 0 ? (
              <div className={ITEM_LANE_SPACER_H} data-item-lane aria-hidden />
            ) : null}
            <div className="flex shrink-0 items-center self-stretch px-1 sm:px-2">
              <ItemTile
                item={item}
                tileKey={sharedPathTileKey(pathIndex, stepIndex, item.id)}
                inactive={rowInactive}
                onSelect={onPathSelect ? () => onPathSelect(pathIndex) : undefined}
              />
            </div>
          </Fragment>
        ))
      )}
    </div>
  );
}

const PREBUILD_HEADER_CLASS =
  "text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/55";

function PreBuildCaret() {
  return (
    <span aria-hidden className="shrink-0 px-1.5 text-base text-[#F0ABCF]/45 sm:px-2 sm:text-lg">
      ›
    </span>
  );
}

function PreBuildColumn({
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

const PREBUILD_NOTE_CLASS =
  "pt-1.5 text-left text-[0.6rem] leading-relaxed text-[#F5E6D3]/42";

function PreBuildStrip({ preBuild }: { preBuild: SerializedGuideItemPreBuild }) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-x-4 gap-y-4 px-4 py-2 sm:grid-cols-4 sm:gap-0 sm:px-0 sm:py-2.5">
      <PreBuildColumn span={1} showDivider className="col-start-1 row-start-1">
        <p className={PREBUILD_HEADER_CLASS}>Starting</p>
        <div className="flex flex-row flex-nowrap items-center gap-0.5 pt-2">
          {preBuild.starting.map((item, index) => (
            <ItemTile
              key={item.id}
              item={item}
              tileKey={`pre-start-${item.id}`}
              compact
              flushEdge={index === 0 ? "start" : undefined}
            />
          ))}
        </div>
        {preBuild.startingLink ? (
          <a
            href={preBuild.startingLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="pt-1.5 text-left text-[0.6rem] font-semibold leading-relaxed text-[#5865F2] transition hover:text-[#7289DA]"
          >
            {preBuild.startingLink.label}
          </a>
        ) : null}
      </PreBuildColumn>

      <PreBuildColumn span={1} className="col-start-2 row-start-1 sm:col-start-4">
        <p className={PREBUILD_HEADER_CLASS}>Full build</p>
        <div className="flex flex-row flex-nowrap items-center gap-0.5 pt-2">
          <ItemTile item={preBuild.fullBuild.sell} tileKey="pre-sell" crossed compact flushEdge="start" />
          <ItemTile item={preBuild.fullBuild.buy} tileKey="pre-buy" compact />
        </div>
        <p className={PREBUILD_NOTE_CLASS}>
          Sell boots for Youmuu's
        </p>
      </PreBuildColumn>

      <PreBuildColumn span={2} showDivider className="col-span-2 row-start-2 sm:col-start-2 sm:row-start-1">
        <p className={PREBUILD_HEADER_CLASS}>Boots</p>
        <div className="flex max-w-full flex-row flex-nowrap items-center pt-2 max-sm:justify-center">
          <ItemTile item={preBuild.bootsBase} tileKey="pre-boots-base" compact flushEdge="start" />
          <PreBuildCaret />
          {preBuild.boots.map((item) => (
            <ItemTile
              key={item.id}
              item={item}
              tileKey={`pre-boots-${item.id}`}
              compact
              compactSpacing="tight"
            />
          ))}
        </div>
        {preBuild.bootsSubheading ? (
          <p className={clsx(PREBUILD_NOTE_CLASS, "max-sm:text-center")}>{preBuild.bootsSubheading}</p>
        ) : null}
      </PreBuildColumn>
    </div>
  );
}

function ChampionIcon({
  champion,
  side,
  highlighted = false,
  size = "md",
}: {
  champion: SerializedGuideItemTeamComp["ally"][number];
  side: "ally" | "enemy";
  highlighted?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-lg ring-1",
        size === "sm" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-11 w-11 sm:h-12 sm:w-12",
        side === "ally" ? "ring-[#B8D8EA]/35" : "ring-[#F0ABCF]/35",
        highlighted && "ring-2 ring-[#F0ABCF]/55"
      )}
      title={champion.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <GuideImage src={champion.icon} alt={champion.name} className={guideChampionIconImgClass} loading="lazy" />
    </div>
  );
}

function GoodAgainstRow({ champions }: { champions: SerializedGuideItemVariant["goodAgainst"] }) {
  return (
    <div className="mt-8 min-w-0 max-w-full sm:mt-10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 max-sm:text-center sm:text-sm">
        Good against
      </p>
      <div className="flex flex-wrap gap-2.5 max-sm:justify-center sm:gap-3">
        {champions.map((champion) => (
          <ChampionIcon key={champion.id} champion={champion} side="enemy" size="md" />
        ))}
      </div>
    </div>
  );
}

function TeamCompDisplay({
  teamComp,
  guideChampionId = "Viego",
}: {
  teamComp: SerializedGuideItemTeamComp;
  guideChampionId?: string;
}) {
  return (
    <div className="flex h-full items-center justify-center gap-5 sm:gap-7">
      <div className="flex flex-col items-center">
        <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/85 sm:text-[0.65rem]">
          Your team
        </p>
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {teamComp.ally.map((champion) => (
            <ChampionIcon
              key={champion.id}
              champion={champion}
              side="ally"
              highlighted={champion.id === guideChampionId}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#F0ABCF]/85 sm:text-[0.65rem]">
          Enemy team
        </p>
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {teamComp.enemy.map((champion) => (
            <ChampionIcon key={champion.id} champion={champion} side="enemy" />
          ))}
        </div>
      </div>
    </div>
  );
}

function BuildDetailSection({
  activeVariant,
}: {
  activeVariant: SerializedGuideItemVariant;
}) {
  const guideTextIcons = useGuideTextIcons();
  return (
    <div className="flex w-full min-w-0 max-w-full flex-col items-stretch gap-8 sm:flex-row sm:gap-10 lg:gap-12">
      <div className="min-w-0 w-full max-w-full flex-[3]">
        <h3 className="break-words text-center text-xl font-bold tracking-tight text-[#FAD4E8]/90 sm:text-left sm:text-2xl">
          {activeVariant.header}
        </h3>
        <div className="mt-5 min-w-0 max-w-full break-words text-left text-sm leading-[1.75] text-[#F5E6D3]/62 [overflow-wrap:anywhere] sm:mt-6 sm:min-h-[11em] sm:text-base">
          {activeVariant.description.split("\n").map((paragraph, index) => (
            <p key={index} className={clsx("min-w-0 max-w-full", index > 0 && "mt-[0.5em]")}>
              {renderGuideHighlightedText(paragraph, guideTextIcons)}
            </p>
          ))}
        </div>
        <GoodAgainstRow champions={activeVariant.goodAgainst} />
      </div>

      <div aria-hidden className="w-px shrink-0 self-stretch bg-[#F0ABCF]/14 max-sm:hidden" />

      <div className="flex min-w-0 flex-[2] items-center justify-center max-sm:hidden">
        <TeamCompDisplay teamComp={activeVariant.teamComp} />
      </div>
    </div>
  );
}

function BuildDetailCrossfade({
  buildKey,
  variant,
}: {
  buildKey: string;
  variant: SerializedGuideItemVariant;
}) {
  const [displayed, setDisplayed] = useState({ key: buildKey, variant });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (buildKey === displayed.key) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed({ key: buildKey, variant });
      setFading(false);
      return;
    }

    setFading(true);
    const timeout = window.setTimeout(() => {
      setDisplayed({ key: buildKey, variant });
      setFading(false);
    }, BUILD_DETAIL_FADE_MS);

    return () => window.clearTimeout(timeout);
  }, [buildKey, variant, displayed.key]);

  return (
    <div
      className={clsx(
        ITEM_DETAIL_SECTION,
        ITEM_SECONDARY_PAD_X,
        "min-w-0 max-w-full overflow-x-hidden rounded-none transition-opacity ease-out motion-reduce:transition-none sm:overflow-visible sm:rounded-b-2xl",
        fading ? "opacity-0" : "opacity-100"
      )}
      style={{ transitionDuration: `${BUILD_DETAIL_FADE_MS}ms` }}
    >
      <BuildDetailSection activeVariant={displayed.variant} />
    </div>
  );
}

function isMobileForkMergeSharedPath(sharedPath: SerializedGuideItemSharedPath): boolean {
  if (sharedPath.paths.length !== 2) return false;

  const [path0, path1] = sharedPath.paths;
  if (path0.items.length === 0 || path1.items.length === 0) return false;
  if (path0.diverge?.length || !path1.diverge?.length) return false;
  if (path0.items[0].id !== path1.items[0].id) return false;

  return true;
}

function buildMobileForkMergeSharedPathConnectors(
  sharedPath: SerializedGuideItemSharedPath,
  containerRect: DOMRect,
  tileRefs: Map<string, HTMLElement>,
  activePathIndex?: number | null,
  activeChoiceIds?: number[] | null
): ConnectorSegment[] {
  const [path0, path1] = sharedPath.paths;
  const paths: ConnectorSegment[] = [];

  const point = (key: string, edge: "left" | "right" | "top" | "bottom") =>
    tileEdgePoint(tileRefs.get(key), containerRect, edge);

  const pushPath = (
    start: { x: number; y: number } | null,
    end: { x: number; y: number } | null,
    inactive = false,
    bend?: "vertical-first" | "horizontal-first"
  ) => {
    if (!start || !end) return;
    paths.push({
      d: bend ? connectorPathCorner(start, end, bend) : connectorPath(start, end),
      inactive,
    });
  };

  const path0Inactive = activePathIndex != null && activePathIndex !== 0;
  const path1Inactive = activePathIndex != null && activePathIndex !== 1;

  const originKey = `shared-${sharedPath.origin.id}`;
  const path0LdrKey = sharedPathTileKey(0, 0, path0.items[0].id);

  pushPath(
    point(originKey, "right"),
    point(path0LdrKey, "top"),
    path0Inactive,
    "horizontal-first"
  );

  if (path1.diverge?.length === 2) {
    const [serpents, cyclo] = path1.diverge;
    const serpentsKey = sharedPathDivergeKey(1, serpents.id);
    const cycloKey = sharedPathDivergeKey(1, cyclo.id);
    const path1LdrKey = sharedPathTileKey(1, 0, path1.items[0].id);

    pushPath(point(originKey, "left"), point(serpentsKey, "top"), path1Inactive, "horizontal-first");
    pushPath(point(originKey, "bottom"), point(cycloKey, "top"), path1Inactive);
    pushPath(
      point(serpentsKey, "bottom"),
      point(path1LdrKey, "top"),
      isChoiceItemInactive(serpents.id, activeChoiceIds, path1Inactive)
    );
    pushPath(
      point(cycloKey, "bottom"),
      point(path1LdrKey, "top"),
      isChoiceItemInactive(cyclo.id, activeChoiceIds, path1Inactive)
    );
  }

  for (let stepIndex = 0; stepIndex < path0.items.length - 1; stepIndex++) {
    pushPath(
      point(
        sharedPathTileKey(0, stepIndex, path0.items[stepIndex].id),
        "bottom"
      ),
      point(
        sharedPathTileKey(0, stepIndex + 1, path0.items[stepIndex + 1].id),
        "top"
      ),
      path0Inactive
    );
  }

  for (let stepIndex = 0; stepIndex < path1.items.length - 1; stepIndex++) {
    pushPath(
      point(
        sharedPathTileKey(1, stepIndex, path1.items[stepIndex].id),
        "bottom"
      ),
      point(
        sharedPathTileKey(1, stepIndex + 1, path1.items[stepIndex + 1].id),
        "top"
      ),
      path1Inactive
    );
  }

  return paths;
}

function ItemSharedPathsLayoutMobile({
  sharedPath,
  onLaneGapMeasure,
  activeChoiceIds,
  activePathIndex,
  onChoiceSelect,
  onPathSelect,
}: {
  sharedPath: SerializedGuideItemSharedPath;
  onLaneGapMeasure?: (widthPx: number) => void;
  activeChoiceIds?: number[] | null;
  activePathIndex?: number | null;
  onChoiceSelect?: (itemId: number) => void;
  onPathSelect?: (pathIndex: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const onLaneGapMeasureRef = useRef(onLaneGapMeasure);
  onLaneGapMeasureRef.current = onLaneGapMeasure;

  const path0 = sharedPath.paths[0];
  const path1 = sharedPath.paths[1];
  const diverge = path1.diverge ?? [];
  const hasSelection = Boolean(activeChoiceIds && activeChoiceIds.length > 0);
  const path0Inactive = activePathIndex != null && activePathIndex !== 0;
  const path1Inactive = activePathIndex != null && activePathIndex !== 1;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!container || !svg || !group) return;

    const syncConnectors = () => {
      const containerRect = container.getBoundingClientRect();
      const width = Math.round(containerRect.width);
      const height = Math.round(containerRect.height);
      if (width <= 0 || height <= 0) return;

      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      paintConnectorPaths(
        group,
        buildMobileForkMergeSharedPathConnectors(
          sharedPath,
          containerRect,
          collectTileRefs(container),
          activePathIndex,
          activeChoiceIds
        )
      );

      const measureLaneGap = onLaneGapMeasureRef.current;
      if (measureLaneGap) {
        const tile = container.querySelector<HTMLElement>("[data-item-tile]");
        if (tile) {
          measureLaneGap(Math.max(32, Math.round(tile.getBoundingClientRect().height * 0.72)));
        }
      }
    };

    syncConnectors();
    requestAnimationFrame(syncConnectors);

    const observer = new ResizeObserver(syncConnectors);
    observer.observe(container);
    container.addEventListener("load", syncConnectors, true);
    window.addEventListener("resize", syncConnectors);

    return () => {
      observer.disconnect();
      container.removeEventListener("load", syncConnectors, true);
      window.removeEventListener("resize", syncConnectors);
    };
  }, [sharedPath, activePathIndex, activeChoiceIds]);

  const choiceInactive = (itemId: number, rowInactive: boolean) =>
    rowInactive || (hasSelection && !activeChoiceIds!.includes(itemId));

  return (
    <div className="flex w-full justify-center">
      <div
        ref={containerRef}
        className={clsx("relative w-fit max-w-full", ITEM_MOBILE_PATH_MAX_W)}
      >
        <div className={clsx("flex flex-col items-center", ITEM_MOBILE_PATH_ROW_GAP)}>
          <ItemTile
            item={sharedPath.origin}
            tileKey={`shared-${sharedPath.origin.id}`}
            compact
          />

          <div className={clsx("grid w-full grid-cols-2 items-start", ITEM_MOBILE_PATH_COL_GAP)}>
            <div
              className={clsx(
                "flex flex-col items-center transition-[opacity,filter] duration-300 ease-out",
                ITEM_MOBILE_PATH_ROW_GAP,
                path1Inactive && "opacity-[0.32] saturate-[0.35]"
              )}
            >
              {diverge.length === 2 ? (
                <div className={clsx("flex flex-row items-center", ITEM_MOBILE_DIVERGE_PAIR_GAP)}>
                  <ItemTile
                    item={diverge[0]}
                    tileKey={sharedPathDivergeKey(1, diverge[0].id)}
                    compact
                    compactSpacing="tight"
                    inactive={choiceInactive(diverge[0].id, path1Inactive)}
                    onSelect={
                      onChoiceSelect ? () => onChoiceSelect(diverge[0].id) : undefined
                    }
                  />
                  <ItemTile
                    item={diverge[1]}
                    tileKey={sharedPathDivergeKey(1, diverge[1].id)}
                    compact
                    compactSpacing="tight"
                    inactive={choiceInactive(diverge[1].id, path1Inactive)}
                    onSelect={
                      onChoiceSelect ? () => onChoiceSelect(diverge[1].id) : undefined
                    }
                  />
                </div>
              ) : null}

              {path1.items.map((item, stepIndex) => (
                <ItemTile
                  key={sharedPathTileKey(1, stepIndex, item.id)}
                  item={item}
                  tileKey={sharedPathTileKey(1, stepIndex, item.id)}
                  compact
                  onSelect={onPathSelect ? () => onPathSelect(1) : undefined}
                />
              ))}
            </div>

            <div
              className={clsx(
                "flex flex-col items-center transition-[opacity,filter] duration-300 ease-out",
                ITEM_MOBILE_PATH_ROW_GAP,
                path0Inactive && "opacity-[0.32] saturate-[0.35]"
              )}
            >
              {path0.items.map((item, stepIndex) => (
                <ItemTile
                  key={sharedPathTileKey(0, stepIndex, item.id)}
                  item={item}
                  tileKey={sharedPathTileKey(0, stepIndex, item.id)}
                  compact
                  onSelect={onPathSelect ? () => onPathSelect(0) : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        <ConnectorSvg svgRef={svgRef} groupRef={groupRef} />
      </div>
    </div>
  );
}

function ItemSharedPathsLayout({
  sharedPath,
  onLaneGapMeasure,
  activeChoiceIds,
  activePathIndex,
  onChoiceSelect,
  onPathSelect,
}: {
  sharedPath: SerializedGuideItemSharedPath;
  onLaneGapMeasure?: (widthPx: number) => void;
  activeChoiceIds?: number[] | null;
  activePathIndex?: number | null;
  onChoiceSelect?: (itemId: number) => void;
  onPathSelect?: (pathIndex: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const onLaneGapMeasureRef = useRef(onLaneGapMeasure);
  onLaneGapMeasureRef.current = onLaneGapMeasure;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!container || !svg || !group) return;

    const syncConnectors = () => {
      const containerRect = container.getBoundingClientRect();
      const width = Math.round(containerRect.width);
      const height = Math.round(containerRect.height);
      if (width <= 0 || height <= 0) return;

      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      paintConnectorPaths(
        group,
        buildSharedPathConnectors(
          sharedPath,
          containerRect,
          collectTileRefs(container),
          activePathIndex,
          activeChoiceIds
        )
      );

      const measureLaneGap = onLaneGapMeasureRef.current;
      if (measureLaneGap) {
        const widths = Array.from(container.querySelectorAll<HTMLElement>("[data-item-lane]"))
          .map((el) => Math.round(el.getBoundingClientRect().width))
          .filter((laneWidth) => laneWidth > 0);

        if (widths.length > 0) {
          measureLaneGap(Math.min(...widths));
        }
      }
    };

    syncConnectors();
    requestAnimationFrame(syncConnectors);

    const observer = new ResizeObserver(syncConnectors);
    observer.observe(container);
    container.addEventListener("load", syncConnectors, true);
    window.addEventListener("resize", syncConnectors);

    return () => {
      observer.disconnect();
      container.removeEventListener("load", syncConnectors, true);
      window.removeEventListener("resize", syncConnectors);
    };
  }, [sharedPath, activePathIndex, activeChoiceIds]);

  const useMobileLayout = isMobileForkMergeSharedPath(sharedPath);

  return (
    <>
      {useMobileLayout ? (
        <div className="flex w-full justify-center sm:hidden">
          <ItemSharedPathsLayoutMobile
            sharedPath={sharedPath}
            onLaneGapMeasure={onLaneGapMeasure}
            activeChoiceIds={activeChoiceIds}
            activePathIndex={activePathIndex}
            onChoiceSelect={onChoiceSelect}
            onPathSelect={onPathSelect}
          />
        </div>
      ) : null}

      <div className={clsx("w-full max-w-full overflow-visible", useMobileLayout && "hidden sm:block")}>
        <div
          ref={containerRef}
          className="relative flex w-full min-w-0 items-stretch overflow-visible"
        >
          <div className="flex shrink-0 items-center self-stretch px-1 sm:px-2">
            <ItemTile
              item={sharedPath.origin}
              tileKey={`shared-${sharedPath.origin.id}`}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-[var(--item-path-gap,2.125rem)]">
            {sharedPath.paths.map((path, pathIndex) => (
              <SharedPathRow
                key={pathIndex}
                pathIndex={pathIndex}
                path={path}
                activeChoiceIds={activeChoiceIds}
                activePathIndex={activePathIndex}
                onChoiceSelect={onChoiceSelect}
                onPathSelect={onPathSelect}
              />
            ))}
          </div>

          <ConnectorSvg svgRef={svgRef} groupRef={groupRef} />
        </div>
      </div>
    </>
  );
}

function ItemBuildPathMobile({
  steps,
  onLaneGapMeasure,
  activeChoiceIds,
  onChoiceSelect,
}: {
  steps: SerializedGuideItemStep[];
  onLaneGapMeasure?: (widthPx: number) => void;
  activeChoiceIds?: number[] | null;
  onChoiceSelect?: (itemId: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const onLaneGapMeasureRef = useRef(onLaneGapMeasure);
  onLaneGapMeasureRef.current = onLaneGapMeasure;

  const choiceStep = steps[0];
  const fixedSteps = steps.slice(1);
  const hasSelection = Boolean(activeChoiceIds && activeChoiceIds.length > 0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!container || !svg || !group) return;

    const syncConnectors = () => {
      const containerRect = container.getBoundingClientRect();
      const width = Math.round(containerRect.width);
      const height = Math.round(containerRect.height);
      if (width <= 0 || height <= 0) return;

      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      paintConnectorPaths(
        group,
        buildMobileThreeChoiceFixedConnectors(
          steps,
          containerRect,
          collectTileRefs(container),
          activeChoiceIds
        )
      );

      const measureLaneGap = onLaneGapMeasureRef.current;
      if (measureLaneGap) {
        const tile = container.querySelector<HTMLElement>("[data-item-tile]");
        if (tile) {
          measureLaneGap(Math.max(32, Math.round(tile.getBoundingClientRect().height * 0.72)));
        }
      }
    };

    syncConnectors();
    requestAnimationFrame(syncConnectors);

    const observer = new ResizeObserver(syncConnectors);
    observer.observe(container);
    container.addEventListener("load", syncConnectors, true);
    window.addEventListener("resize", syncConnectors);

    return () => {
      observer.disconnect();
      container.removeEventListener("load", syncConnectors, true);
      window.removeEventListener("resize", syncConnectors);
    };
  }, [steps, activeChoiceIds]);

  if (choiceStep.type !== "choice" || choiceStep.items.length !== 3) return null;

  const [leftChoice, centerChoice, rightChoice] = choiceStep.items;

  const choiceInactive = (itemId: number) =>
    hasSelection && !activeChoiceIds!.includes(itemId);

  return (
    <div className="flex w-full justify-center">
      <div
        ref={containerRef}
        className={clsx("relative w-fit max-w-full", ITEM_MOBILE_PATH_MAX_W)}
      >
        <div className={clsx("grid grid-cols-[1fr_auto_1fr] items-start", ITEM_MOBILE_PATH_COL_GAP)}>
          <div className="flex justify-end self-start pr-1">
            <ItemTile
              item={leftChoice}
              tileKey={`0-${leftChoice.id}`}
              compact
              flushEdge="end"
              inactive={choiceInactive(leftChoice.id)}
              onSelect={onChoiceSelect ? () => onChoiceSelect(leftChoice.id) : undefined}
            />
          </div>

          <div className={clsx("flex flex-col items-center", ITEM_MOBILE_PATH_ROW_GAP)}>
            <ItemTile
              item={centerChoice}
              tileKey={`0-${centerChoice.id}`}
              compact
              inactive={choiceInactive(centerChoice.id)}
              onSelect={onChoiceSelect ? () => onChoiceSelect(centerChoice.id) : undefined}
            />
            {fixedSteps.map((step, stepIndex) => {
              if (step.type !== "fixed") return null;
              const item = step.items[0];
              const index = stepIndex + 1;
              return (
                <ItemTile
                  key={item.id}
                  item={item}
                  tileKey={`${index}-${item.id}`}
                  compact
                />
              );
            })}
          </div>

          <div className="flex justify-start self-start pl-1">
            <ItemTile
              item={rightChoice}
              tileKey={`0-${rightChoice.id}`}
              compact
              flushEdge="start"
              inactive={choiceInactive(rightChoice.id)}
              onSelect={onChoiceSelect ? () => onChoiceSelect(rightChoice.id) : undefined}
            />
          </div>
        </div>

        <ConnectorSvg svgRef={svgRef} groupRef={groupRef} />
      </div>
    </div>
  );
}

function ItemBuildPath({
  steps,
  onLaneGapMeasure,
  activeChoiceIds,
  onChoiceSelect,
}: {
  steps: SerializedGuideItemStep[];
  onLaneGapMeasure?: (widthPx: number) => void;
  activeChoiceIds?: number[] | null;
  onChoiceSelect?: (itemId: number) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const onLaneGapMeasureRef = useRef(onLaneGapMeasure);
  onLaneGapMeasureRef.current = onLaneGapMeasure;

  useLayoutEffect(() => {
    const row = rowRef.current;
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!row || !svg || !group) return;

    const syncConnectors = () => {
      const rowRect = row.getBoundingClientRect();
      const width = Math.round(rowRect.width);
      const height = Math.round(rowRect.height);
      if (width <= 0 || height <= 0) return;

      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      paintConnectorPaths(
        group,
        buildConnectorPaths(steps, rowRect, collectTileRefs(row), activeChoiceIds)
      );

      const measureLaneGap = onLaneGapMeasureRef.current;
      if (measureLaneGap) {
        const widths = Array.from(row.querySelectorAll<HTMLElement>("[data-item-lane]"))
          .map((el) => Math.round(el.getBoundingClientRect().width))
          .filter((laneWidth) => laneWidth > 0);

        if (widths.length > 0) {
          measureLaneGap(Math.min(...widths));
        }
      }
    };

    syncConnectors();
    requestAnimationFrame(syncConnectors);

    const observer = new ResizeObserver(syncConnectors);
    observer.observe(row);
    row.addEventListener("load", syncConnectors, true);
    window.addEventListener("resize", syncConnectors);

    return () => {
      observer.disconnect();
      row.removeEventListener("load", syncConnectors, true);
      window.removeEventListener("resize", syncConnectors);
    };
  }, [steps, activeChoiceIds]);

  const useMobileLayout = isThreeChoiceFixedPath(steps);

  return (
    <>
      {useMobileLayout ? (
        <div className="flex w-full justify-center sm:hidden">
          <ItemBuildPathMobile
            steps={steps}
            onLaneGapMeasure={onLaneGapMeasure}
            activeChoiceIds={activeChoiceIds}
            onChoiceSelect={onChoiceSelect}
          />
        </div>
      ) : null}

      <div className={clsx("w-full max-w-full overflow-visible", useMobileLayout && "hidden sm:block")}>
        <div
          ref={rowRef}
          className="relative flex w-full min-w-0 items-stretch overflow-visible"
        >
          {steps.map((step, idx) => (
            <Fragment key={idx}>
              {idx > 0 ? (
                <div className={ITEM_LANE_SPACER_H} data-item-lane aria-hidden />
              ) : null}
              <ItemStepColumn
                step={step}
                stepIndex={idx}
                activeChoiceIds={activeChoiceIds}
                onChoiceSelect={onChoiceSelect}
              />
            </Fragment>
          ))}
          <ConnectorSvg svgRef={svgRef} groupRef={groupRef} />
        </div>
      </div>
    </>
  );
}

function TabBuildContent({
  tab,
  variant,
  onLaneGapMeasure,
  onChoiceSelect,
  onPathSelect,
}: {
  tab: SerializedGuideItemTab;
  variant: SerializedGuideItemVariant | undefined;
  onLaneGapMeasure?: (widthPx: number) => void;
  onChoiceSelect?: (itemId: number) => void;
  onPathSelect?: (pathIndex: number) => void;
}) {
  if (tab.sharedPath) {
    return (
      <ItemSharedPathsLayout
        sharedPath={tab.sharedPath}
        onLaneGapMeasure={onLaneGapMeasure}
        activeChoiceIds={variant?.activeChoiceIds}
        activePathIndex={variant?.activePathIndex}
        onChoiceSelect={onChoiceSelect}
        onPathSelect={onPathSelect}
      />
    );
  }

  return (
    <ItemBuildPath
      steps={tab.steps}
      onLaneGapMeasure={onLaneGapMeasure}
      activeChoiceIds={variant?.activeChoiceIds}
      onChoiceSelect={onChoiceSelect}
    />
  );
}

export default function ItemBuildSection({
  data,
  guideTextIcons = {},
}: {
  data: GuideItemPageData;
  guideTextIcons?: Record<string, string>;
}) {
  const [activeTabId, setActiveTabId] = useState(data.tabs[0]?.id ?? "main");
  const [variantByTab, setVariantByTab] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const tab of data.tabs) {
      if (tab.defaultVariantId) initial[tab.id] = tab.defaultVariantId;
      else if (tab.variants[0]) initial[tab.id] = tab.variants[0].id;
    }
    return initial;
  });
  const [laneGapPx, setLaneGapPx] = useState<number | null>(null);
  const itemImageUrls = useMemo(() => collectItemSectionImageUrls(data), [data]);
  const { sectionRef, shouldLoad, imagesReady } = useGuideSectionImages(itemImageUrls);
  const activeTab = data.tabs.find((t) => t.id === activeTabId) ?? data.tabs[0];

  const handleLaneGapMeasure = useCallback((widthPx: number) => {
    setLaneGapPx((prev) => (prev === null ? widthPx : Math.min(prev, widthPx)));
  }, []);

  const activeVariantId =
    variantByTab[activeTab?.id ?? ""] ??
    activeTab?.defaultVariantId ??
    activeTab?.variants[0]?.id ??
    "";

  const activeVariant =
    activeTab?.variants.find((variant) => variant.id === activeVariantId) ??
    activeTab?.variants[0];

  const handleVariantChange = useCallback(
    (variantId: string) => {
      if (!activeTab) return;
      setVariantByTab((prev) => ({ ...prev, [activeTab.id]: variantId }));
    },
    [activeTab]
  );

  const handlePathSelect = useCallback(
    (pathIndex: number) => {
      if (!activeTab) return;

      const match = activeTab.variants.find((variant) => variant.activePathIndex === pathIndex);
      if (match) {
        setVariantByTab((prev) => ({ ...prev, [activeTab.id]: match.id }));
      }
    },
    [activeTab]
  );

  const handleChoiceSelect = useCallback(
    (itemId: number) => {
      if (!activeTab) return;

      const byChoice = activeTab.variants.find((variant) =>
        variant.activeChoiceIds.includes(itemId)
      );
      if (byChoice) {
        setVariantByTab((prev) => ({ ...prev, [activeTab.id]: byChoice.id }));
        return;
      }

      const byDivergePath = activeTab.variants.find(
        (variant) =>
          variant.activePathIndex != null &&
          activeTab.sharedPath?.paths[variant.activePathIndex]?.diverge?.some(
            (item) => item.id === itemId
          )
      );
      if (byDivergePath) {
        setVariantByTab((prev) => ({ ...prev, [activeTab.id]: byDivergePath.id }));
      }
    },
    [activeTab]
  );

  if (!activeTab) return null;

  const panelStyle = {
    ...(laneGapPx !== null ? { "--item-lane-gap": `${laneGapPx}px` } : null),
    "--item-path-gap":
      laneGapPx !== null ? `${Math.max(28, Math.round(laneGapPx * 0.8))}px` : "2.125rem",
    "--item-diverge-gap":
      laneGapPx !== null ? `${Math.max(12, Math.round(laneGapPx * 0.38))}px` : "0.875rem",
  } as CSSProperties;

  return (
    <GuideTextIconsContext.Provider value={guideTextIcons}>
    <section ref={sectionRef} id="items" className="scroll-mt-24 min-w-0 max-w-full overflow-x-hidden sm:overflow-visible">
      {!shouldLoad ? (
        <ItemBuildSectionSkeleton data={data} />
      ) : (
      <div className="grid">
        <div
          className={clsx(
            "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
            shouldLoad && imagesReady ? "pointer-events-none opacity-0" : "opacity-100"
          )}
        >
          <ItemBuildSectionSkeleton data={data} />
        </div>

        <div
          className={clsx(
            "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
            shouldLoad && imagesReady ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!(shouldLoad && imagesReady)}
          aria-busy={shouldLoad && !imagesReady}
        >
      <div className={clsx("mb-6 flex items-center gap-4 sm:gap-5", guideSectionHeaderPadClass)}>
        <h2 className={guideSectionTitleClass}>
          {data.heading}
        </h2>
        {data.headerIcon ? (
          <div className="relative shrink-0">
            <div
              className={clsx(
                ITEM_TILE_CLASS,
                "relative overflow-hidden ring-1 ring-[#F0ABCF]/30"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <GuideImage
                src={data.headerIcon.icon}
                alt={data.headerIcon.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <GuideCrossOverlay />
            </div>
          </div>
        ) : null}
      </div>

      <div className={ITEM_PANEL_OUTER} style={panelStyle}>
        {data.preBuild ? (
          <div className={clsx(ITEM_SECONDARY_SECTION, "py-0 sm:rounded-t-2xl")}>
            <PreBuildStrip preBuild={data.preBuild} />
          </div>
        ) : null}

        <div className={ITEM_PRIMARY_MAIN}>
          <div className="relative z-10">
          <div className="flex w-full">
            {data.tabs.map((tab, index) => {
              const active = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={clsx(
                    "px-5 py-3.5 text-sm font-semibold tracking-wide transition sm:px-6",
                    "ring-1 ring-inset",
                    index === 0 && "sm:rounded-tl-2xl",
                    index === data.tabs.length - 1 && "sm:rounded-br-2xl",
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

          <div className={ITEM_PRIMARY_BODY}>
            <div className="grid min-w-0 w-full max-w-full">
              {data.tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                const tabVariantId =
                  variantByTab[tab.id] ?? tab.defaultVariantId ?? tab.variants[0]?.id ?? "";
                const tabVariant =
                  tab.variants.find((variant) => variant.id === tabVariantId) ??
                  tab.variants[0];

                return (
                  <div
                    key={tab.id}
                    className={clsx(
                      "col-start-1 row-start-1 flex w-full min-w-0 max-w-full items-center",
                      isActive ? "relative z-10" : "hidden"
                    )}
                    aria-hidden={!isActive}
                  >
                    <TabBuildContent
                      tab={tab}
                      variant={tabVariant}
                      onLaneGapMeasure={handleLaneGapMeasure}
                      onChoiceSelect={isActive ? handleChoiceSelect : undefined}
                      onPathSelect={isActive ? handlePathSelect : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>

        {activeVariant ? (
          <BuildDetailCrossfade
            buildKey={`${activeTabId}:${activeVariantId}`}
            variant={activeVariant}
          />
        ) : null}
      </div>
        </div>
      </div>
      )}
    </section>
    </GuideTextIconsContext.Provider>
  );
}

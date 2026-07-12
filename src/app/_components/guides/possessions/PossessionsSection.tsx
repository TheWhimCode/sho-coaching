"use client";

import clsx from "clsx";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import GuideImage from "@/app/_components/guides/GuideImage";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { PossessionPassiveExamples } from "@/app/_components/guides/possessions/PossessionPassiveExamples";
import { renderPossessionExplanationText } from "@/app/_components/guides/possessions/renderPossessionExplanationText";
import {
  guideChampionIconImgClass,
  guideMobileFlushPanelClass,
  guideRuneOuterPanelClass,
  guideSectionHeaderPadClass,
  guideSectionSubClass,
  guideSectionTitleClass,
} from "@/lib/guides/guideTheme";
import type { GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";
import type {
  GuidePossessionPageData,
  SerializedPossessionChampion,
  SerializedPossessionTier,
} from "@/lib/guides/possessionGuideTypes";

const POSSESSION_SECTION_HEADING_CLASS =
  "text-xl font-bold tracking-tight text-[#B8D8EA] sm:text-2xl";

const CHAMPION_TILE_CLASS =
  "aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#352839] ring-1 ring-[#F0ABCF]/30 transition-[box-shadow,ring-color] duration-200 ease-out sm:h-11 sm:w-11";

const POSSESSION_LIST_INDENT_CLASS = "pl-4 sm:pl-6";
const POSSESSION_LIST_ROW_CLASS = "flex items-start gap-2.5 sm:gap-3";
const POSSESSION_LIST_FACTOR_ROW_CLASS = "flex items-center gap-2.5 sm:gap-3";
const POSSESSION_LIST_MARKER_COL_CLASS = "w-9 shrink-0 sm:w-9";
const POSSESSION_LIST_MARKER_CELL_CLASS =
  "flex h-[1.75rem] items-center justify-end sm:h-[1.8rem]";
const POSSESSION_LIST_NUMBER_MARKER_CLASS =
  "text-sm font-bold tabular-nums text-[#F0ABCF] sm:text-base";
const POSSESSION_LIST_TEXT_CLASS =
  "min-w-0 flex-1 text-sm leading-[1.75] text-[#F5E6D3]/90 sm:text-base sm:leading-[1.8]";
const POSSESSION_FACTOR_MARKER_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F0ABCF]/18 bg-[#16121A]/70 text-sm font-bold text-[#FAD4E8]/80 sm:h-9 sm:w-9";
const POSSESSION_LIST_BULLET_CLASS = "h-1.5 w-1.5 rounded-full bg-[#F0ABCF] sm:h-2 sm:w-2";

function PossessionChampionExplanationPanel({
  champion,
  open,
  position,
  placement,
  tipId,
  guideTextIcons,
  viegoAbilityIcons,
  onTransitionEnd,
}: {
  champion: SerializedPossessionChampion;
  open: boolean;
  position: { top: number; left: number };
  placement: "right" | "below";
  tipId: string;
  guideTextIcons: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
  onTransitionEnd?: (event: TransitionEvent<HTMLDivElement>) => void;
}) {
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
            "relative w-80 overflow-visible rounded-xl border border-[#F0ABCF]/25 sm:w-96",
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
            <p className="text-sm font-semibold tracking-wide text-[#FAD4E8]">
              {champion.name}
            </p>
            {champion.explanation ? (
              <div className="mt-2 space-y-2">
                {champion.explanation.split("\n\n").map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-[1.65] text-[#F5E6D3]/72"
                  >
                    {renderPossessionExplanationText(
                      paragraph,
                      champion.name,
                      champion.abilityIcons,
                      viegoAbilityIcons,
                      guideTextIcons
                    )}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PossessionChampionTile({
  champion,
  tileKey,
  guideTextIcons,
  viegoAbilityIcons,
}: {
  champion: SerializedPossessionChampion;
  tileKey: string;
  guideTextIcons: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
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
  const showHover = hovered;
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
        const panelHalfWidth = 168;
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

    if (showHover) updatePosition();
    window.addEventListener("scroll", dismissTip, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", dismissTip, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showTip, showHover]);

  const handleTipTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "opacity" || showHover) return;
    setTipVisible(false);
  };

  return (
    <div ref={tileRef} className="relative z-[2] shrink-0 outline-none">
      <div
        tabIndex={0}
        className={clsx(
          CHAMPION_TILE_CLASS,
          "cursor-default focus-visible:outline-none",
          showHover && "ring-[#F0ABCF]/55 shadow-[0_0_16px_rgba(240,171,207,0.2)]",
          "focus-visible:shadow-[0_0_16px_rgba(240,171,207,0.2)]"
        )}
        aria-describedby={`possession-tip-${tileKey}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <GuideImage
          src={champion.icon}
          alt={champion.name}
          loading="lazy"
          className={guideChampionIconImgClass}
        />
      </div>
      {portalMounted && showTip && tipLayout
        ? createPortal(
            <PossessionChampionExplanationPanel
              champion={champion}
              open={showHover}
              position={tipLayout}
              placement={tipLayout.placement}
              tipId={`possession-tip-${tileKey}`}
              guideTextIcons={guideTextIcons}
              viegoAbilityIcons={viegoAbilityIcons}
              onTransitionEnd={handleTipTransitionEnd}
            />,
            document.body
          )
        : null}
    </div>
  );
}

function PossessionFlow({
  data,
  guideTextIcons,
}: {
  data: GuidePossessionPageData;
  guideTextIcons: Record<string, string>;
}) {
  return (
    <div className="border-b border-[#F0ABCF]/10 px-6 py-8 sm:px-10 sm:py-10">
      <div className="max-w-3xl">
        <h3 className={POSSESSION_SECTION_HEADING_CLASS}>
          {data.howItWorksHeading}
        </h3>
        {data.howItWorksNote ? (
          <p className="mt-3 text-base leading-[1.7] text-[#F5E6D3]/78 sm:mt-4 sm:text-lg sm:leading-[1.75]">
            {data.howItWorksNote}
          </p>
        ) : null}

        <ol
          className={clsx(
            "mt-6 list-none space-y-4 sm:mt-7 sm:space-y-4",
            POSSESSION_LIST_INDENT_CLASS
          )}
        >
          {data.flow.map((step, index) => (
            <li key={step.id} className={POSSESSION_LIST_ROW_CLASS}>
              <span className={POSSESSION_LIST_MARKER_COL_CLASS} aria-hidden>
                <span
                  className={clsx(
                    POSSESSION_LIST_MARKER_CELL_CLASS,
                    POSSESSION_LIST_NUMBER_MARKER_CLASS
                  )}
                >
                  {index + 1}.
                </span>
              </span>
              <p className={POSSESSION_LIST_TEXT_CLASS}>
                {renderGuideHighlightedText(step.label, guideTextIcons)}
              </p>
            </li>
          ))}
        </ol>

        {data.howItWorksDetails?.length ? (
          <div className="mt-6 space-y-3 sm:mt-7 sm:space-y-4">
            {data.howItWorksDetails.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-[1.75] text-[#F5E6D3]/78 sm:text-base sm:leading-[1.8]"
              >
                {renderGuideHighlightedText(paragraph, guideTextIcons)}
                {index === 0 && data.howItWorksPassiveExamples?.length ? (
                  <PossessionPassiveExamples examples={data.howItWorksPassiveExamples} />
                ) : null}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PossessionTierRow({
  tier,
  guideTextIcons,
  viegoAbilityIcons,
}: {
  tier: SerializedPossessionTier;
  guideTextIcons: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
}) {
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
      <p className="w-16 shrink-0 text-left text-xs font-semibold text-[#F5E6D3]/62 sm:w-[4.5rem] sm:text-sm">
        {tier.label}
      </p>
      <div className="flex min-w-0 flex-wrap justify-start gap-1.5 sm:gap-2">
        {tier.champions.map((champion) => (
          <PossessionChampionTile
            key={champion.id}
            champion={champion}
            tileKey={`${tier.id}-${champion.id}`}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
        ))}
      </div>
    </div>
  );
}

function BestToPossessSection({
  data,
  guideTextIcons,
  viegoAbilityIcons,
}: {
  data: GuidePossessionPageData;
  guideTextIcons: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
}) {
  return (
    <div className="px-6 py-8 sm:px-10 sm:py-10">
      <div className="max-w-3xl">
        <h3 className={POSSESSION_SECTION_HEADING_CLASS}>
          {data.bestToPossessHeading}
        </h3>
        <p className="mt-3 text-base leading-[1.7] text-[#F5E6D3]/78 sm:mt-4 sm:text-lg sm:leading-[1.75]">
          {data.bestToPossessIntro}
        </p>

        <ol
          className={clsx(
            "mt-5 list-none space-y-3 sm:mt-6 sm:space-y-3.5",
            POSSESSION_LIST_INDENT_CLASS
          )}
        >
          {data.factors.map((factor, index) => (
            <li key={factor.id} className={POSSESSION_LIST_FACTOR_ROW_CLASS}>
              <span className={POSSESSION_LIST_MARKER_COL_CLASS} aria-hidden>
                <span className="flex justify-end">
                  <span className={POSSESSION_FACTOR_MARKER_CLASS}>{index + 1}</span>
                </span>
              </span>
              <p className={clsx(POSSESSION_LIST_TEXT_CLASS, "text-[#F5E6D3]/75")}>
                <span className="font-semibold text-[#FAD4E8]">{factor.label}</span>
                <span className="text-[#F5E6D3]/48"> — </span>
                {factor.text}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto mt-7 flex w-full max-w-xl flex-col items-start gap-4 sm:mt-8 sm:gap-4">
        {data.possessionTiers.map((tier) => (
          <PossessionTierRow
            key={tier.id}
            tier={tier}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
        ))}
      </div>

      {data.bestToPossessNote ? (
        <div className="max-w-3xl">
          <p className="mt-5 text-sm leading-relaxed text-[#F5E6D3]/58 sm:mt-6 sm:text-base">
            {data.bestToPossessNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function WhenNotToPossessSection({
  data,
  guideTextIcons,
}: {
  data: GuidePossessionPageData;
  guideTextIcons: Record<string, string>;
}) {
  return (
    <div className="border-t border-[#F0ABCF]/10 px-6 py-8 sm:px-10 sm:py-10">
      <div className="max-w-3xl">
        <h3 className={POSSESSION_SECTION_HEADING_CLASS}>{data.whenNotToPossessHeading}</h3>
        {data.whenNotToPossessIntro ? (
          <p className="mt-3 text-base leading-[1.7] text-[#F5E6D3]/78 sm:mt-4 sm:text-lg sm:leading-[1.75]">
            {data.whenNotToPossessIntro}
          </p>
        ) : null}

        {data.whenNotToPossessItems.length ? (
          <div className={clsx("mt-6 sm:mt-7", POSSESSION_LIST_INDENT_CLASS)}>
            {data.whenNotToPossessDontLabel ? (
              <p className="text-sm font-semibold text-[#FAD4E8] sm:text-base">
                {data.whenNotToPossessDontLabel}:
              </p>
            ) : null}
            <ul className="mt-3 list-none space-y-3 sm:space-y-3.5">
              {data.whenNotToPossessItems.map((item) => (
                <li key={item.id} className={POSSESSION_LIST_ROW_CLASS}>
                  <span className={POSSESSION_LIST_MARKER_COL_CLASS} aria-hidden>
                    <span className={POSSESSION_LIST_MARKER_CELL_CLASS}>
                      <span className={POSSESSION_LIST_BULLET_CLASS} />
                    </span>
                  </span>
                  <p className={POSSESSION_LIST_TEXT_CLASS}>
                    {renderGuideHighlightedText(item.text, guideTextIcons)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PossessionsSection({
  data,
  guideTextIcons = {},
  viegoAbilityIcons,
}: {
  data: GuidePossessionPageData;
  guideTextIcons?: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
}) {
  return (
    <section
      id="possessions"
      className="scroll-mt-24 w-full min-w-0 max-w-full overflow-x-hidden sm:overflow-visible"
    >
      <div className={clsx("mb-6", guideSectionHeaderPadClass)}>
        <h2 className={guideSectionTitleClass}>{data.heading}</h2>
        {data.subtitle ? <p className={guideSectionSubClass}>{data.subtitle}</p> : null}
      </div>

      <div
        className={clsx(
          guideRuneOuterPanelClass,
          guideMobileFlushPanelClass,
          "overflow-hidden p-0 sm:p-0"
        )}
      >
        <PossessionFlow data={data} guideTextIcons={guideTextIcons} />
        <BestToPossessSection
          data={data}
          guideTextIcons={guideTextIcons}
          viegoAbilityIcons={viegoAbilityIcons}
        />
        <WhenNotToPossessSection data={data} guideTextIcons={guideTextIcons} />
      </div>
    </section>
  );
}

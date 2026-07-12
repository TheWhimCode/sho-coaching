"use client";

import clsx from "clsx";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import GuideImage from "@/app/_components/guides/GuideImage";
import type { SerializedPossessionPassiveExample } from "@/lib/guides/possessionGuideTypes";

const PASSIVE_ICON_CLASS =
  "size-4 shrink-0 rounded-sm object-cover ring-1 ring-[#B8D8EA]/20 sm:size-[1.125rem]";

const DD_DESCRIPTION_CLASS =
  "text-sm leading-[1.65] text-[#F5E6D3]/72 [&_br]:my-1.5 [&_keyword]:font-semibold [&_keyword]:text-[#FAD4E8] [&_mainText]:text-[#F5E6D3]/72";

function PassiveExplanationPanel({
  example,
  open,
  position,
  placement,
  tipId,
  onTransitionEnd,
}: {
  example: SerializedPossessionPassiveExample;
  open: boolean;
  position: { top: number; left: number };
  placement: "right" | "below";
  tipId: string;
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
            <p className="text-sm font-semibold tracking-wide text-[#FAD4E8]">
              {example.passiveName}
            </p>
            <div
              className={clsx("mt-2", DD_DESCRIPTION_CLASS)}
              dangerouslySetInnerHTML={{ __html: example.passiveDescriptionHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PossessionPassiveIcon({
  example,
  iconKey,
}: {
  example: SerializedPossessionPassiveExample;
  iconKey: string;
}) {
  const iconRef = useRef<HTMLSpanElement>(null);
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
      if (iconRef.current?.contains(document.activeElement)) {
        (document.activeElement as HTMLElement).blur();
      }
    };

    const updatePosition = () => {
      const el = iconRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const below = window.matchMedia("(max-width: 639px)").matches;

      if (below) {
        const panelHalfWidth = 148;
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
    <>
      <span
        ref={iconRef}
        tabIndex={0}
        className="inline-flex shrink-0 cursor-default items-center align-middle outline-none"
        aria-describedby={`possession-passive-tip-${iconKey}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <GuideImage
          src={example.passiveIcon}
          alt={`${example.name} passive`}
          loading="lazy"
          className={PASSIVE_ICON_CLASS}
        />
      </span>
      {portalMounted && showTip && tipLayout
        ? createPortal(
            <PassiveExplanationPanel
              example={example}
              open={showHover}
              position={tipLayout}
              placement={tipLayout.placement}
              tipId={`possession-passive-tip-${iconKey}`}
              onTransitionEnd={handleTipTransitionEnd}
            />,
            document.body
          )
        : null}
    </>
  );
}

export function PossessionPassiveExamples({
  examples,
}: {
  examples: SerializedPossessionPassiveExample[];
}) {
  if (!examples.length) return null;

  return (
    <>
      {" "}
      {examples.map((example, index) => (
        <Fragment key={example.id}>
          {index > 0 ? (index === examples.length - 1 ? ", and " : ", ") : null}
          <span className="inline-flex items-center gap-0.5 align-middle">
            {example.name}
            <PossessionPassiveIcon example={example} iconKey={example.id} />
          </span>
        </Fragment>
      ))}
    </>
  );
}

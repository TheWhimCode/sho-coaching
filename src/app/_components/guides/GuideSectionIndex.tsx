"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { GuideLabelWithNew } from "@/app/_components/guides/GuideNewBadge";
import {
  getOverlayScrollViewport,
  useOverlayScrollViewport,
} from "@/lib/overlayScrollViewport";

export type GuideIndexEntry = {
  id: string;
  label: string;
  isNew?: boolean;
};

const SCROLL_OFFSET_PX = 112;

function scrollToGuideSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const viewport = getOverlayScrollViewport();
  if (!viewport) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const containerRect = viewport.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const delta = elRect.top - containerRect.top - SCROLL_OFFSET_PX;
  const target = Math.max(0, viewport.scrollTop + delta);

  viewport.scrollTo({
    top: target,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}

function useGuideSectionScrollSpy(
  entries: GuideIndexEntry[],
  viewport: HTMLElement | null
) {
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");
  const suppressSpyRef = useRef(false);
  const suppressTimerRef = useRef<number | null>(null);

  const scrollToSection = useCallback((id: string) => {
    suppressSpyRef.current = true;
    if (suppressTimerRef.current !== null) {
      window.clearTimeout(suppressTimerRef.current);
    }
    setActiveId(id);
    scrollToGuideSection(id);
    suppressTimerRef.current = window.setTimeout(() => {
      suppressSpyRef.current = false;
      suppressTimerRef.current = null;
    }, 900);
  }, []);

  useEffect(() => {
    return () => {
      if (suppressTimerRef.current !== null) {
        window.clearTimeout(suppressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!viewport || entries.length === 0) return;

    const resolveActive = () => {
      if (suppressSpyRef.current) return;

      const containerTop = viewport.getBoundingClientRect().top;
      let current = entries[0].id;

      for (const entry of entries) {
        const el = document.getElementById(entry.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - containerTop;
        if (top <= SCROLL_OFFSET_PX) {
          current = entry.id;
        }
      }

      setActiveId(current);
    };

    resolveActive();
    viewport.addEventListener("scroll", resolveActive, { passive: true });
    window.addEventListener("resize", resolveActive);

    return () => {
      viewport.removeEventListener("scroll", resolveActive);
      window.removeEventListener("resize", resolveActive);
    };
  }, [viewport, entries]);

  return { activeId, scrollToSection };
}

export default function GuideSectionIndex({
  entries,
  className,
  style,
}: {
  entries: GuideIndexEntry[];
  className?: string;
  style?: CSSProperties;
}) {
  const viewport = useOverlayScrollViewport();
  const { activeId, scrollToSection } = useGuideSectionScrollSpy(entries, viewport);

  if (entries.length === 0) return null;

  return (
    <nav
      aria-label="Guide sections"
      className={clsx("w-44", className)}
      style={style}
    >
      <ul className="space-y-1">
        {entries.map((entry) => {
          const active = entry.id === activeId;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => scrollToSection(entry.id)}
                aria-current={active ? "true" : undefined}
                title={entry.label}
                className={clsx(
                  "w-full border-l-2 py-1.5 pl-3 text-left text-[13px] leading-snug transition",
                  active
                    ? "border-[#F0ABCF] font-semibold text-[#FAD4E8]"
                    : "border-transparent text-[#F5E6D3]/45 hover:border-[#F0ABCF]/25 hover:text-[#F5E6D3]/72"
                )}
              >
                <GuideLabelWithNew isNew={entry.isNew}>
                  {entry.label}
                </GuideLabelWithNew>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import TypingText from "@/app/_components/animations/TypingText";

type Slot = { id: string; local: Date | string | number };

type Props = {
  slots?: Slot[];
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  showTimezoneNote?: boolean;
  emptyMessage?: string;
  typingSpeedMs?: number;
  revealDelayMs?: number;

  /** Visual tuning */
  itemHeight?: number; // height of a single row
  className?: string;
  ariaLabel?: string;
};

function toDate(v: Date | string | number) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default function WheelPicker({
  slots,
  selectedSlotId,
  onSelectSlot,
  showTimezoneNote = false,
  emptyMessage = "Select a day first.",
  typingSpeedMs = 22,
  revealDelayMs = 500,

  itemHeight = 52, // larger row height for touch
  className,
  ariaLabel = "Time picker",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const safeSlots = useMemo(
    () =>
      (slots ?? []).map((s) => {
        const d = toDate(s.local);
        return {
          id: s.id,
          label: d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          local: d,
        };
      }),
    [slots]
  );

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    safeSlots.forEach((it, i) => map.set(it.id, i));
    return map;
  }, [safeSlots]);

  const VISIBLE_ROWS = 3;
  const padY = itemHeight;
  const containerHeight = itemHeight * VISIBLE_ROWS;

  const defaultIndex =
    selectedSlotId != null
      ? indexById.get(selectedSlotId) ?? 0
      : Math.max(0, Math.floor((safeSlots.length - 1) / 2));

  const [scrollIndex, setScrollIndex] = useState<number>(defaultIndex);

  const scrollToIndex = (idx: number, behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(safeSlots.length - 1, idx));
    el.scrollTo({ top: clamped * itemHeight, behavior });
  };

  useEffect(() => {
    if (!safeSlots.length) return;
    const idx =
      selectedSlotId != null
        ? indexById.get(selectedSlotId) ?? 0
        : Math.max(0, Math.floor((safeSlots.length - 1) / 2));

    scrollToIndex(idx, "auto");
    setScrollIndex(idx);

    if (selectedSlotId == null) {
      const id = safeSlots[idx]?.id;
      if (id) onSelectSlot(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeSlots.length, itemHeight]);

  useEffect(() => {
    if (!safeSlots.length || selectedSlotId == null) return;
    const idx = indexById.get(selectedSlotId);
    if (idx == null) return;
    scrollToIndex(idx, "auto");
    setScrollIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlotId]);

  const settleTimer = useRef<number | null>(null);

  const handleScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    const nearest = Math.round(el.scrollTop / itemHeight);
    setScrollIndex(nearest);

    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const clamped = Math.max(
        0,
        Math.min(safeSlots.length - 1, Math.round(el.scrollTop / itemHeight))
      );
      el.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });
      const id = safeSlots[clamped]?.id;
      if (id && id !== selectedSlotId) onSelectSlot(id);
    }, 120);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!safeSlots.length) return;
    const current =
      selectedSlotId != null ? indexById.get(selectedSlotId) ?? scrollIndex : scrollIndex;
    let next = current;

    switch (e.key) {
      case "ArrowUp":
        next = Math.max(0, current - 1);
        e.preventDefault();
        break;
      case "ArrowDown":
        next = Math.min(safeSlots.length - 1, current + 1);
        e.preventDefault();
        break;
      case "Home":
        next = 0;
        e.preventDefault();
        break;
      case "End":
        next = safeSlots.length - 1;
        e.preventDefault();
        break;
      default:
        return;
    }

    const id = safeSlots[next]?.id;
    if (id) {
      onSelectSlot(id);
      scrollToIndex(next);
    }
  };

  const hasSlots = safeSlots.length > 0;

  const timezoneText = useMemo(() => {
    const tz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "";
    return `Times in ${tz}`;
  }, []);

  const getVisualForRow = (rowIndex: number) => {
    const dist = Math.abs(rowIndex - scrollIndex);
    const d = Math.min(2, dist);
    const scale = 1 - d * 0.04;
    const opacity = 1 - d * 0.28;
    const weight = d === 0 ? 700 : 500;
    const shadow = d === 0 ? "0 0 6px rgba(0,0,0,0.45)" : "none";
    return { scale, opacity, weight, shadow };
  };

  const fadePx = 18;

  return (
    <div className={clsx("text-white inline-flex flex-col items-start shrink-0", className)}>
      {/* Header top-left */}
      <div className="mb-3 text-white text-lg font-semibold tracking-wide">
        Pick your time
      </div>

      <div className="relative w-full max-w-[340px]">
        {!hasSlots ? (
          <div className="h-full grid place-items-center text-white/60 text-sm px-3 text-center">
            {emptyMessage}
          </div>
        ) : (
          <>
            {/* Highlight pill behind center row */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 z-10"
              style={{
                top: itemHeight,
                height: itemHeight,
              }}
            >
              <div className="absolute inset-0 rounded-md bg-white/6" />
            </div>

            {/* Scroll body */}
            <div
              ref={containerRef}
              role="listbox"
              aria-label={ariaLabel}
              aria-activedescendant={
                safeSlots[indexById.get(selectedSlotId ?? "") ?? defaultIndex]?.id
              }
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              className={clsx(
                "relative mx-auto overflow-y-auto overflow-x-hidden snap-y snap-mandatory will-change-scroll",
                "scrollbar-none",
                "wheelpicker-scroll"
              )}
              style={{
                height: containerHeight,
                scrollSnapType: "y mandatory",
                paddingTop: padY,
                paddingBottom: padY,
                background: "transparent",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitMaskImage: `linear-gradient(to bottom, transparent ${fadePx}px, black ${
                  fadePx + 1
                }px, black calc(100% - ${fadePx + 1}px), transparent calc(100% - ${fadePx}px))`,
                maskImage: `linear-gradient(to bottom, transparent ${fadePx}px, black ${
                  fadePx + 1
                }px, black calc(100% - ${fadePx + 1}px), transparent calc(100% - ${fadePx}px))`,
              }}
            >
              <ul className="relative">
                {safeSlots.map((it, i) => {
                  const { scale, opacity, weight, shadow } = getVisualForRow(i);
                  const isSelected = selectedSlotId === it.id;
                  return (
                    <li
                      id={it.id}
                      key={it.id}
                      role="option"
                      aria-selected={isSelected}
                      className={clsx(
                        "snap-center flex items-center justify-center select-none",
                        "text-white transition-[transform,opacity] duration-150 ease-out"
                      )}
                      style={{
                        height: itemHeight,
                        transform: `scale(${scale})`,
                        opacity,
                      }}
                      onClick={() => onSelectSlot(it.id)}
                    >
                      <div className="px-2 py-0.5 leading-none">
                        <span
                          className="text-lg whitespace-nowrap"
                          style={{
                            fontWeight: weight as React.CSSProperties["fontWeight"],
                            textShadow: shadow,
                          }}
                        >
                          {it.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>

      {showTimezoneNote && hasSlots && (
        <div className="mt-3 text-[12px] text-[var(--color-lightblue)] leading-none">
          <TypingText
            text={timezoneText}
            speed={typingSpeedMs}
            delay={revealDelayMs}
            color="var(--color-lightblue)"
          />
        </div>
      )}

      <style jsx>{`
        .wheelpicker-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
          background: transparent;
        }
      `}</style>
    </div>
  );
}

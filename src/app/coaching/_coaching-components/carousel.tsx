"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CAROUSEL_ITEMS, type CarouselItem as BaseCarouselItem } from "@/lib/coaching/carousel.data";
import VideoPlayer from "@/app/coaching/_coaching-components/components/carousel/videoplayer";

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// Allow optional analysisSrc on items
export type CarouselItem = BaseCarouselItem & { analysisSrc?: string; posterSrc?: string };

interface ShowcaseCarouselProps {
  items?: CarouselItem[];
  intervalMs?: number;
  pauseOnHover?: boolean;
  className?: string;
}

export default function ShowcaseCarousel({
  items = CAROUSEL_ITEMS as CarouselItem[],
  intervalMs = 5000,
  pauseOnHover = false,
  className,
}: ShowcaseCarouselProps) {
  const [active, setActive] = React.useState(0);
  const [analysisOpen, setAnalysisOpen] = React.useState(false);
  const size = items.length;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  const timerRef = React.useRef<number | null>(null);
  const hoveredRef = React.useRef(false);
  const [isInView, setIsInView] = React.useState(true);

  // stop and resume scroll on the whole carousel while analysis is open
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: Event) => e.preventDefault();
    if (analysisOpen) {
      el.addEventListener("wheel", prevent as any, { passive: false });
      el.addEventListener("touchmove", prevent as any, { passive: false });
      // Also freeze internal list overflow
      if (listRef.current) listRef.current.style.overflowY = "hidden";
    } else {
      el.removeEventListener("wheel", prevent as any);
      el.removeEventListener("touchmove", prevent as any);
      if (listRef.current) listRef.current.style.overflowY = "";
    }
    return () => {
      el.removeEventListener("wheel", prevent as any);
      el.removeEventListener("touchmove", prevent as any);
    };
  }, [analysisOpen]);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const shouldRun = () =>
    size > 1 && isInView && !analysisOpen && (!pauseOnHover || !hoveredRef.current);

  const scheduleNextAdvance = () => {
    if (timerRef.current != null) return;
    if (!shouldRun()) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setActive((i) => (i + 1) % size);
      scheduleNextAdvance();
    }, intervalMs) as unknown as number;
  };

  // In-view tracking
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsInView((entry.intersectionRatio ?? 0) > 0.25),
      { threshold: [0, 0.25, 0.5, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // cadence
  React.useEffect(() => {
    clearTimer();
    scheduleNextAdvance();
    return clearTimer;
  }, [size, intervalMs, isInView, pauseOnHover, analysisOpen]);

  // hover pause/resume
  React.useEffect(() => {
    if (!pauseOnHover) return;
    const el = containerRef.current;
    if (!el) return;
    const onEnter = () => { hoveredRef.current = true; clearTimer(); };
    const onLeave = () => { hoveredRef.current = false; scheduleNextAdvance(); };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [pauseOnHover]);

  // autoscroll active list item into view
  React.useEffect(() => {
    if (analysisOpen) return; // freeze while open
    const ul = listRef.current;
    if (!ul) return;
    const li = ul.querySelector<HTMLLIElement>(`[data-idx="${active}"]`);
    if (!li) return;
    const buffer = 20,
      parentTop = ul.scrollTop,
      parentBottom = parentTop + ul.clientHeight,
      liTop = li.offsetTop,
      liBottom = liTop + li.offsetHeight;
    if (liTop < parentTop + buffer) {
      ul.scrollTo({ top: liTop - buffer, behavior: "smooth" });
    } else if (liBottom > parentBottom - buffer) {
      ul.scrollTo({ top: liBottom - ul.clientHeight + buffer, behavior: "smooth" });
    }
  }, [active, analysisOpen]);

  const TITLE_SIZE = "clamp(1.15rem, 0.9vw + 0.9rem, 1.5rem)";
  const indicatorTransition = { type: "spring", stiffness: 500, damping: 40, mass: 0.6 } as const;
  const fadeTransition = { duration: 0.18, ease: "easeOut" } as const;

  return (
    <section
      ref={containerRef}
      className={cn("relative isolate mx-auto max-w-7xl overflow-visible", className)}
      aria-label="Highlights"
    >
      <div className="relative w-full aspect-video" data-overlay-root>
        <div className="absolute inset-0 z-20">
          <div className="grid h-full grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {/* Left column (list) */}
            <div className="h-full min-h-0 px-6 md:px-8 flex flex-col py-4 md:py-6">
              <ul
                ref={listRef}
                className={cn(
                  // grid so items can stretch vertically
                  "flex-1 min-h-0 pr-1 scrollbar-thin grid gap-2.5",
                  analysisOpen ? "" : "overflow-y-auto"
                )}
                style={{ gridAutoRows: "minmax(3.0rem, 1fr)" }}
                aria-live="polite"
              >
                {items.map((it, i) => {
                  const isActive = i === active;
                  return (
                    <li key={i} data-idx={i} className="relative select-none">
                      <button
                        type="button"
                        onClick={() => {
                          clearTimer();
                          setActive(i);
                          scheduleNextAdvance();
                        }}
                        className={cn(
                          "group relative w-full text-left rounded-lg h-full",
                          "px-3 py-3 md:px-3.5 md:py-3.5",
                          "flex items-center gap-3 transition-colors",
                          isActive ? "ring-1 ring-white/10" : "hover:bg-white/[0.04]"
                        )}
                        aria-current={isActive ? "true" : undefined}
                        disabled={analysisOpen} // lock interactions while overlay is open
                      >
                        {/* Subtle active background (tint, not a glow) */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              key="bg"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={fadeTransition}
                              className="absolute inset-0 rounded-lg bg-white/[0.05]"
                              aria-hidden
                            />
                          )}
                        </AnimatePresence>

                        {/* 🚀 Left-side moving indicator (shared layout) */}
                        {isActive && (
                          <motion.div
                            layoutId="tab-indicator"
                            transition={indicatorTransition}
                            className={cn(
                              "pointer-events-none absolute -left-1 top-1/2 -translate-y-1/2",
                              "h-[66%] w-[4px] rounded-r-full",
                              "bg-gradient-to-b from-sky-400 via-fuchsia-400 to-orange-300"
                            )}
                            aria-hidden
                          />
                        )}
                        {/* A quick traveling spark to emphasize motion on change */}
                        {isActive && (
                          <motion.span
                            key={`spark-${i}-${active}`}
                            className="pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/90"
                            initial={{ y: -18, opacity: 0, scale: 0.6 }}
                            animate={{ y: 18, opacity: [0, 0.9, 0], scale: [0.6, 1, 0.6] }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            aria-hidden
                          />
                        )}

                        {/* Content */}
                        <span
                          className={cn(
                            "grid place-items-center shrink-0 w-5 h-5 rounded-full text-[0.7rem] font-medium",
                            "ring-1 ring-white/10 bg-white/[0.02]",
                            isActive ? "opacity-100" : "opacity-70 group-hover:opacity-85"
                          )}
                          style={{ color: "var(--color-fg)" }}
                        >
                          {(i + 1).toString().padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "font-semibold tracking-tight truncate relative",
                            isActive ? "text-white" : "text-white/85 group-hover:text-white/95"
                          )}
                          style={{ fontSize: TITLE_SIZE, lineHeight: 1.15, letterSpacing: "-0.01em" }}
                        >
                          {it.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Right column (poster-only inline; Analyse opens overlay) */}
            <div className="relative self-center px-0">
              <div className="relative w-full h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={fadeTransition}
                    className="w-full h-full"
                  >
                    <VideoPlayer
                      analysisSrc={items[active]?.analysisSrc ?? items[active]?.videoSrc!}
                      posterSrc={items[active]?.posterSrc}
                      title={items[active]?.title}
                      onAnalysisOpenChange={setAnalysisOpen}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

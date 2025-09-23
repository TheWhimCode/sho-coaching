"use client";

import React from "react";

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type ShowcaseItem = { title: string; sub?: string; imageSrc?: string; imageAlt?: string };

interface ShowcaseCarouselProps {
  items?: ShowcaseItem[];
  intervalMs?: number;
  /** If true, auto-advance pauses while hovered */
  pauseOnHover?: boolean;
  className?: string;
}

const DEFAULT_ITEMS: ShowcaseItem[] = [
  { title: "Wave management" },
  { title: "Roaming" },
  { title: "Positioning" },
  { title: "Combos" },
  { title: "Trading" },
  { title: "Midgame macro" },
  { title: "Objective control" },
].map((it) => ({
  ...it,
  imageSrc: "/images/coaching/carousel/Placeholder1.png",
  imageAlt: it.title,
}));

export default function ShowcaseCarousel({
  items = DEFAULT_ITEMS,
  intervalMs = 3500,
  // Default: do NOT pause on hover (you can enable by passing true)
  pauseOnHover = false,
  className,
}: ShowcaseCarouselProps) {
  const [active, setActive] = React.useState(0);
  const size = items.length;
  const timerRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const hoveredRef = React.useRef(false);
  const [isInView, setIsInView] = React.useState(true);

  const clear = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const start = () => {
    clear();
    if (size > 1 && isInView && (!pauseOnHover || !hoveredRef.current)) {
      timerRef.current = window.setInterval(
        () => setActive((i) => (i + 1) % size),
        intervalMs
      ) as unknown as number;
    }
  };

  // IntersectionObserver: only advance when component is in viewport
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = (entry.intersectionRatio ?? 0) > 0.25;
        setIsInView(visible);
      },
      { threshold: [0, 0.25, 0.5, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Start/stop based on conditions
  React.useEffect(() => {
    start();
    return clear;
  }, [size, intervalMs, isInView, pauseOnHover]);

  // Optional pause on hover (now opt-in via prop)
  React.useEffect(() => {
    if (!pauseOnHover) return;
    const el = containerRef.current;
    if (!el) return;
    const onEnter = () => {
      hoveredRef.current = true;
      clear();
    };
    const onLeave = () => {
      hoveredRef.current = false;
      start();
    };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [pauseOnHover, intervalMs, size, isInView]);

  // Keep the active item comfortably in view (only adjust its own scroll container, not page)
  React.useEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    const li = ul.querySelector<HTMLLIElement>(`[data-idx="${active}"]`);
    if (!li) return;
    const buffer = 20;
    const parentTop = ul.scrollTop;
    const parentBottom = parentTop + ul.clientHeight;
    const liTop = li.offsetTop;
    const liBottom = liTop + li.offsetHeight;

    if (liTop < parentTop + buffer) {
      ul.scrollTo({ top: liTop - buffer, behavior: "smooth" });
    } else if (liBottom > parentBottom - buffer) {
      ul.scrollTo({ top: liBottom - ul.clientHeight + buffer, behavior: "smooth" });
    }
  }, [active]);

  // Fixed type size (no grow/shrink) — only opacity changes between states
  const TITLE_SIZE = "clamp(1.35rem, 1vw + 0.9rem, 1.75rem)"; // ~22–28px

  return (
    <section
      ref={containerRef}
      className={cn("relative isolate mx-auto max-w-7xl overflow-visible", className)}
      aria-label="Highlights"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 md:gap-8">
        {/* LEFT: intentional list with index badges + active pill + accent rail */}
        <div
          className={cn(
            "relative place-self-start w-full md:max-w-xl rounded-2xl",
            "p-5 md:p-7",
            "backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)]",
            "ring-1 ring-[color:var(--color-divider)]",
            "bg-[color:color-mix(in_oklab,var(--color-panel)_90%,transparent)]"
          )}
        >
          {/* subtle left rail for structure */}
          <div className="pointer-events-none absolute inset-y-4 left-0 w-px bg-[color:var(--color-divider)]/60" />

          <ul
            ref={listRef}
            className="space-y-2.5 md:space-y-3.5 max-h-[58vh] md:max-h-[64vh] overflow-y-auto pr-1 scrollbar-thin"
            aria-live="polite"
          >
            {items.map((it, i) => {
              const isActive = i === active;
              return (
                <li key={i} data-idx={i} className="select-none">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "group relative w-full text-left rounded-xl",
                      "px-3.5 py-3 md:px-4 md:py-3.5",
                      "flex items-center gap-3",
                      "transition-all duration-300 ease-out",
                      isActive
                        ? "bg-white/5 ring-1 ring-[color:var(--color-divider)]/70 shadow-inner"
                        : "hover:bg-white/3"
                    )}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {/* accent bar visible on active */}
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full",
                        "transition-opacity duration-300",
                        isActive ? "opacity-100 bg-[color:var(--color-accent,rgba(139,92,246,.9))]" : "opacity-0"
                      )}
                    />

                    {/* index badge for hierarchy */}
                    <span
                      className={cn(
                        "grid place-items-center shrink-0 w-6 h-6 rounded-full text-[0.7rem] font-medium",
                        "ring-1 ring-[color:var(--color-divider)]",
                        isActive ? "opacity-100" : "opacity-70 group-hover:opacity-85"
                      )}
                      style={{ color: "var(--color-fg)", background: "color-mix(in oklab, var(--color-panel) 75%, transparent)" }}
                    >
                      {(i + 1).toString().padStart(2, "0")}
                    </span>

                    {/* title — fixed size, opacity only */}
                    <span
                      className={cn(
                        "font-semibold tracking-tight truncate",
                        "transition-opacity duration-300 ease-out",
                        isActive ? "opacity-100" : "opacity-70 group-hover:opacity-85"
                      )}
                      style={{
                        color: "var(--color-fg)",
                        fontSize: TITLE_SIZE,
                        lineHeight: 1.15,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {it.title}
                    </span>

                    {/* optional right sublabel */}
                    {it.sub && (
                      <span
                        className={cn(
                          "ml-auto text-xs md:text-sm font-medium transition-opacity duration-300",
                          isActive ? "opacity-85" : "opacity-55 group-hover:opacity-70"
                        )}
                        style={{ color: "var(--color-fg-muted, rgba(255,255,255,.7))" }}
                      >
                        {it.sub}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* RIGHT: circular image with wide soft fade */}
        <div className="relative grid place-items-center p-6 md:p-10">
          <img
            src={items[active].imageSrc!}
            alt={items[active].imageAlt ?? items[active].title}
            className="block"
            style={{
              width: "min(520px, 82vw)",
              height: "min(520px, 82vw)",
              objectFit: "cover",
              WebkitMaskImage:
                "radial-gradient(closest-side, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              maskImage:
                "radial-gradient(closest-side, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
              maskRepeat: "no-repeat",
              maskSize: "100% 100%",
              clipPath: "circle(50% at 50% 50%)",
              filter:
                "drop-shadow(0 0 50px rgba(139,92,246,.22)) drop-shadow(0 0 120px rgba(96,165,250,.18))",
            }}
          />
        </div>
      </div>
    </section>
  );
}

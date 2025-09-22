"use client";

import React from "react";

function cn(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" "); }

type ShowcaseItem = { title: string; sub?: string; imageSrc?: string; imageAlt?: string };

interface ShowcaseCarouselProps {
  items?: ShowcaseItem[];
  intervalMs?: number;
  pauseOnHover?: boolean;
  className?: string;
}

const DEFAULT_ITEMS: ShowcaseItem[] = [
  { title: "Skill Assessment → Plan" },
  { title: "Live VOD: Decisions" },
  { title: "Micro Drills That Stick" },
  { title: "Macro: Win Conditions" },
  { title: "Mindset & Tilt Tools" },
  { title: "Prep: Matchups & Notes" },
  { title: "Accountability Follow-ups" },
].map(it => ({
  ...it,
  imageSrc: "/images/coaching/carousel/Placeholder1.png",
  imageAlt: it.title,
}));

export default function ShowcaseCarousel({
  items = DEFAULT_ITEMS,
  intervalMs = 3500,
  pauseOnHover = true,
  className,
}: ShowcaseCarouselProps) {
  const [active, setActive] = React.useState(0);
  const size = items.length;
  const timerRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const clear = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; } };
  const start = () => {
    clear();
    timerRef.current = window.setInterval(() => setActive(i => (i + 1) % size), intervalMs) as unknown as number;
  };

  React.useEffect(() => { if (size > 1) { start(); return clear; } }, [size, intervalMs]);

  React.useEffect(() => {
    if (!pauseOnHover) return;
    const el = containerRef.current;
    if (!el) return;
    const onEnter = () => clear();
    const onLeave = () => start();
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [pauseOnHover, intervalMs, size]);

  return (
    <section
      ref={containerRef}
      className={cn("relative isolate mx-auto max-w-7xl overflow-visible", className)}
      aria-label="Highlights"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 items-center">
        {/* LEFT: compact wrapper with headers (no taglines, no header, smaller padding) */}
        <div
          className={cn(
            "relative rounded-2xl place-self-start w-full md:max-w-md",
            "p-4 md:p-6",
            "frost-card glow-stroke"
          )}
          style={{ background: "var(--color-panel)" }}
        >
          <ul className="space-y-2">
            {items.map((it, i) => {
              const isActive = i === active;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="w-full text-left rounded-[10px] px-3 py-2"
                    aria-current={isActive ? "true" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0 transition-all duration-300"
                        style={{
                          background: isActive ? "var(--color-orange)" : "rgba(255,255,255,.4)",
                          boxShadow: isActive ? "0 0 0 6px rgba(252,136,3,.16)" : "none",
                        }}
                      />
                      <span
                        className={cn(
                          "text-[15px] md:text-base font-semibold tracking-tight",
                          "transition-opacity duration-300"
                        )}
                        style={{
                          color: "var(--color-fg)",
                          opacity: isActive ? 1 : 0.45,
                        }}
                      >
                        {it.title}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Small divider (kept subtle) */}
          <div className="mt-4 h-px w-full" style={{ backgroundColor: "var(--color-divider)" }} />
          {/* Stripes removed per request: no .scanlines overlay */}
        </div>

        {/* RIGHT: circular image with wide soft fade (no wrapper around img) */}
        <div className="relative grid place-items-center p-6 md:p-10">
          <img
            src={items[active].imageSrc!}
            alt={items[active].imageAlt ?? items[active].title}
            className="block"
            style={{
              width: "min(520px, 82vw)",
              height: "min(520px, 82vw)",
              objectFit: "cover",

              /* wide, soft radial fade at edges (transparent at rim) */
              WebkitMaskImage:
                "radial-gradient(closest-side, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              maskImage:
                "radial-gradient(closest-side, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 95%)",
              maskRepeat: "no-repeat",
              maskSize: "100% 100%",

              /* fallback if masks unsupported: still circular, but without fade */
              clipPath: "circle(50% at 50% 50%)",

              /* glow that respects transparency */
              filter:
                "drop-shadow(0 0 50px rgba(139,92,246,.22)) drop-shadow(0 0 120px rgba(96,165,250,.18))",
            }}
          />
        </div>
      </div>
    </section>
  );
}

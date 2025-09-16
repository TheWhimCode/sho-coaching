// coaching/_coaching-components/ReviewsMarquee.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import type { Review } from "@/lib/reviews/reviews.data";
import { REVIEWS as DEFAULT_REVIEWS } from "@/lib/reviews/reviews.data";

type Props = {
  reviews?: Array<Review | string>;
  /** pixels per second; negative scrolls left */
  pxPerSecond?: number;
  className?: string;
  pauseOnHover?: boolean;
};

function normalize(reviews?: Array<Review | string>): Review[] {
  if (!reviews || reviews.length === 0) return DEFAULT_REVIEWS;
  return reviews.map((r) =>
    typeof r === "string" ? ({ name: "Player", text: r } as Review) : r
  );
}

/* ---------- Rank emblem chip (no grey backgrounds) ---------- */

const TIER_COLORS: Record<string, string> = {
  iron: "#6b6b6b",
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#e3b341",
  platinum: "#2bb6a8",
  emerald: "#50c878",
  diamond: "#4db6ff",
  master: "#b45cff",
  grandmaster: "#ff5c7a",
  challenger: "#5ce1ff",
};

function parseRank(
  s?: string
): { tier?: string; div?: "I" | "II" | "III" | "IV" } {
  if (!s) return {};
  const m = s.trim().match(/^([A-Za-z]+)(?:\s+(I{1,3}|IV))?$/);
  if (!m) return {};
  const tier = m[1];
  const div = (m[2] as any) || undefined;
  return { tier, div };
}

const Emblem = ({ tier, div }: { tier?: string; div?: string }) => {
  if (!tier) return null;
  const key = tier.toLowerCase();
  const base = TIER_COLORS[key] ?? "rgba(255,255,255,.8)";
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full overflow-visible">
      <span aria-hidden className="absolute inset-0 rounded-full" style={{ backgroundColor: base }} />
      {div ? (
        <span className="absolute -bottom-1.5 -right-1 text-[9px] leading-none font-semibold px-0.5 rounded bg-black/80 text-white">
          {div}
        </span>
      ) : null}
      <span className="sr-only">
        {tier}
        {div ? ` ${div}` : ""}
      </span>
    </span>
  );
};

const RankChip = ({ from, to }: { from?: string; to?: string }) => {
  if (!from && !to) return null;
  const pf = parseRank(from);
  const pt = parseRank(to);
  return (
    <div className="absolute right-3 top-3">
      <div className="flex items-center gap-1.5 text-[11px] leading-4">
        <Emblem tier={pf.tier} div={pf.div} />
        <ArrowRight className="h-3.5 w-3.5 opacity-90" strokeWidth={3} aria-hidden />
        <Emblem tier={pt.tier} div={pt.div} />
        <span className="sr-only">
          Rank improved from {from ?? "unknown"} to {to ?? "unknown"}
        </span>
      </div>
    </div>
  );
};

/* ---------- Marquee ---------- */

export default function ReviewsMarquee({
  reviews,
  pxPerSecond = -24,
  className,
  pauseOnHover = true,
}: Props) {
  const items = normalize(reviews);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const sliceRef = useRef<HTMLDivElement | null>(null); // measure this slice
  const trackRef = useRef<HTMLDivElement | null>(null);

  const sliceW = useRef(0); // modulo period (slice width incl. padding-right)
  const gapPxRef = useRef(20); // single source of truth: card gap inside slice

  const x = useRef(0); // translateX
  const raf = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const running = useRef(true);
  const velocity = useRef(0); // inertial fling px/s

  const fadePx = 80;

  const Card = ({ r }: { r: Review }) => (
    <article className="relative w-[240px] sm:w-[280px] rounded-xl bg-white/[.03] border border-white/5 p-4 shrink-0">
      <RankChip from={r.rankFrom} to={r.rankTo} />
      <div className="flex items-center gap-2 pb-1.5 mb-2.5 border-b border-white/5">
        <span className="font-semibold text-white/85 truncate text-sm">
          {r.name}
        </span>
        <span className="sr-only">Rating: {r.rating ?? 5} out of 5</span>
        <div
          className="flex items-center gap-0.5 text-[#fc8803] opacity-90"
          aria-hidden
        >
          {Array.from({ length: r.rating ?? 5 }).map((_, j) => (
            <Star key={j} className="h-3.5 w-3.5" fill="currentColor" />
          ))}
        </div>
      </div>
      <p className="text-white/70 text-[13px] leading-5">{r.text}</p>
    </article>
  );

  // One slice (full set) — two back-to-back for seamless loop.
  const Slice = React.forwardRef<HTMLDivElement, {}>(function Slice(_, ref) {
    return (
      <div ref={ref as any} className="flex items-center gap-5 shrink-0">
        {items.map((r, i) => (
          <Card key={`card-${i}`} r={r} />
        ))}
        {/* no spacer; padding-right is set dynamically to equal the gap */}
      </div>
    );
  });

  // Measure gap and slice width; seam uses the SAME gap:
  // - gap lives ONLY on the slice
  // - track gap = 0
  // - each slice gets padding-right = gap AND gap = gap (restores intra-card spacing)
  // - period = slice width (includes that padding)
  useLayoutEffect(() => {
    const measure = () => {
      const sliceEl = sliceRef.current;
      const trackEl = trackRef.current;
      if (!sliceEl || !trackEl) return;

      // Get gap from CSS if available, else geometry
      const cs = getComputedStyle(sliceEl);
      let gap = parseFloat(cs.columnGap || cs.gap || "0");
      if (!gap || Number.isNaN(gap)) {
        const first = sliceEl.children[0] as HTMLElement | undefined;
        const second = sliceEl.children[1] as HTMLElement | undefined;
        if (first && second) {
          const r1 = first.getBoundingClientRect();
          const r2 = second.getBoundingClientRect();
          gap = Math.max(0, r2.left - r1.right);
        } else {
          gap = 20;
        }
      }
      gapPxRef.current = gap;

      // No gap BETWEEN slices
      trackEl.style.gap = "0px";
      (trackEl.style as any).columnGap = "0px";

      // Ensure EACH slice has the same intra-card gap and seam padding
      Array.from(trackEl.children).forEach((child) => {
        const el = child as HTMLElement;
        el.style.gap = `${gap}px`;               // restore intra-card spacing
        (el.style as any).columnGap = `${gap}px`;
        el.style.paddingRight = `${gap}px`;      // seam equals one normal gap
      });

      // Measure modulo period AFTER styles applied
      sliceW.current = sliceEl.getBoundingClientRect().width;
    };

    measure();

    const ro = new ResizeObserver(measure);
    if (sliceRef.current) ro.observe(sliceRef.current);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  // Animation loop (auto + inertial)
  useEffect(() => {
    const step = (ts: number) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = ts - (lastTs.current ?? ts);
      lastTs.current = ts;

      const W = sliceW.current || 1;
      const base = running.current ? pxPerSecond : 0;
      const vx = base + velocity.current;

      if (vx !== 0) {
        x.current += (vx * dt) / 1000;

        // Wrap within [-W, 0)
        while (x.current <= -W) x.current += W;
        while (x.current > 0) x.current -= W;

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${x.current}px,0,0)`;
        }
      }

      // friction for inertial fling
      if (Math.abs(velocity.current) > 0.01) velocity.current *= 0.94;
      else velocity.current = 0;

      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      lastTs.current = null;
    };
  }, [pxPerSecond]);

  // Hover pause
  useEffect(() => {
    if (!pauseOnHover || !rootRef.current) return;
    const el = rootRef.current;
    const onEnter = () => (running.current = false);
    const onLeave = () => (running.current = true);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [pauseOnHover]);

  // Drag layer
  const onDrag = (_: any, info: { delta: { x: number } }) => {
    const W = sliceW.current || 1;
    x.current += info.delta.x;
    while (x.current <= -W) x.current += W;
    while (x.current > 0) x.current -= W;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${x.current}px,0,0)`;
    }
  };
  const onDragEnd = (_: any, info: { velocity: { x: number } }) => {
    velocity.current = info.velocity.x; // px/s
  };

  return (
    <div
      ref={rootRef}
      className={["relative w-full h-full grid place-items-center", className].filter(Boolean).join(" ")}
      aria-label="What clients say"
    >
      {/* Visible area with fadeout edges; no left padding so first card starts flush */}
      <div
        className="w-full overflow-hidden"
        style={{
          WebkitMaskImage: `linear-gradient(to right, transparent 0, black ${fadePx}px, black calc(100% - ${fadePx}px), transparent 100%)`,
          maskImage: `linear-gradient(to right, transparent 0, black ${fadePx}px, black calc(100% - ${fadePx}px), transparent 100%)`,
        }}
      >
        {/* Track: two slices back-to-back; no gap between them */}
        <div ref={trackRef} className="flex flex-nowrap will-change-transform">
          <Slice ref={sliceRef} />
          <Slice />
        </div>
      </div>

      {/* Transparent drag surface */}
      <motion.div
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        aria-hidden
      />
    </div>
  );
}

// coaching/_coaching-components/reviews.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
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

/* ---------- Rank emblem chip ---------- */

const RANK_IMAGE: Record<string, string> = {
  iron: "Iron.png",
  bronze: "Bronze.png",
  silver: "Silver.png",
  gold: "Gold.png",
  platinum: "Platinum.png",
  emerald: "Emerald.png",
  diamond: "Diamond.png",
  master: "Master.png",
  grandmaster: "GM.png",
  gm: "GM.png",
  challenger: "Challenger.png",
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
  const file = RANK_IMAGE[key];
  if (!file) return null;

  return (
    <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-visible -mt-0.5">
      <Image
        src={`/images/league/rank/${file}`}
        alt={div ? `${tier} ${div}` : tier}
        width={32}
        height={32}
        className="h-8 w-8 object-contain pointer-events-none select-none"
        priority={false}
      />
      {div ? (
        <span className="absolute top-2 right-0.5 text-[10px] leading-none font-bold text-white drop-shadow">
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
      <div className="flex items-center gap-2 text-[11px] leading-4">
        <Emblem tier={pf.tier} div={pf.div} />
        <ArrowRight className="h-4 w-4 opacity-90" strokeWidth={3} aria-hidden />
        <Emblem tier={pt.tier} div={pt.div} />
        <span className="sr-only">
          Rank improved from {from ?? "unknown"} to {to ?? "unknown"}
        </span>
      </div>
    </div>
  );
};


export default function Reviews({
  reviews,
  pxPerSecond = -24,
  className,
  pauseOnHover = true,
}: Props) {
  const items = normalize(reviews);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const sliceRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const sliceW = useRef(0);
  const gapPxRef = useRef(20);

  const x = useRef(0);
  const raf = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const running = useRef(true);
  const velocity = useRef(0);

  const fadePx = 80;

  const Card = ({ r }: { r: Review }) => (
    <article
      className="
        relative w-[240px] sm:w-[280px] shrink-0
        rounded-xl overflow-hidden
        bg-[#0B1734]/95
        border border-white/10 ring-1 ring-inset ring-cyan-300/15
        shadow-[8px_8px_20px_-6px_rgba(0,0,0,.8)]
        hover:ring-cyan-300/30 hover:border-white/15
        transition-all
      "
    >
      {/* Neon internal glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      {/* Outer halo */}
      <div className="pointer-events-none absolute inset-0 rounded-[11px] shadow-[0_0_30px_-6px_rgba(56,189,248,.45)]" />

      <div className="relative p-4">
        <RankChip from={r.rankFrom} to={r.rankTo} />

        <div className="flex items-center gap-2 pb-1.5 mb-2.5 border-b border-white/5">
          <span className="font-semibold text-white/90 truncate text-sm">
            {r.name}
          </span>
          <span className="sr-only">Rating: {r.rating ?? 5} out of 5</span>

          {/* Orange stars with neon glow */}
          <div
            className="flex items-center gap-0.5 text-[#fc8803] drop-shadow-[0_0_10px_rgba(252,136,3,.8)]"
            aria-hidden
          >
            {Array.from({ length: r.rating ?? 5 }).map((_, j) => (
              <Star key={j} className="h-3.5 w-3.5" fill="currentColor" />
            ))}
          </div>
        </div>

        <p className="text-white/75 text-[13px] leading-5">{r.text}</p>
      </div>
    </article>
  );

  const Slice = React.forwardRef<HTMLDivElement, {}>(function Slice(_, ref) {
    return (
      <div ref={ref as any} className="flex items-center gap-5 shrink-0">
        {items.map((r, i) => (
          <Card key={`card-${i}`} r={r} />
        ))}
      </div>
    );
  });

  useLayoutEffect(() => {
    const measure = () => {
      const sliceEl = sliceRef.current;
      const trackEl = trackRef.current;
      if (!sliceEl || !trackEl) return;

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

      trackEl.style.gap = "0px";
      (trackEl.style as any).columnGap = "0px";

      Array.from(trackEl.children).forEach((child) => {
        const el = child as HTMLElement;
        el.style.gap = `${gap}px`;
        (el.style as any).columnGap = `${gap}px`;
        el.style.paddingRight = `${gap}px`;
      });

      sliceW.current = sliceEl.getBoundingClientRect().width;
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (sliceRef.current) ro.observe(sliceRef.current);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

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

        while (x.current <= -W) x.current += W;
        while (x.current > 0) x.current -= W;

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${x.current}px,0,0)`;
        }
      }

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
    velocity.current = info.velocity.x;
  };

return (
  <div
    ref={rootRef}
    className={[
      "relative grid place-items-center py-10",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    style={{
      marginLeft: "calc(50% - 50vw)",
      marginRight: "calc(50% - 50vw)",
      width: "100vw",
    }}
    aria-label="What clients say"
  >
    {/* texture over the section's base color using overlay (keeps brightness/hue stable) */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage: "url('/images/coaching/texture3.jpg')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
        mixBlendMode: "overlay",
        opacity: 0.3,
        filter: "contrast(1.2) brightness(1.05)",
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    />

    {/* review cards */}
    <div className="w-full overflow-hidden relative z-10">
      <div ref={trackRef} className="flex flex-nowrap will-change-transform">
        <Slice ref={sliceRef} />
        <Slice />
      </div>
    </div>

    {/* inner shadow overlay (on top) */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        boxShadow: `
          inset 0 30px 12px -6px rgba(0,0,0,0.5),
          inset 0 -30px 12px -6px rgba(0,0,0,0.5),
          inset 30px 0 12px -6px rgba(0,0,0,0.5),
          inset -30px 0 12px -6px rgba(0,0,0,0.5)
        `,
      }}
    />

    {/* drag interaction layer */}
    <motion.div
      className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      aria-hidden
    />
  </div>
);




}

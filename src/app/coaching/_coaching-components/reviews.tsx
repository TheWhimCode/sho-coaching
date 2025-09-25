// coaching/_coaching-components/reviews.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CaretRight } from "@phosphor-icons/react";
import type { Review } from "@/lib/reviews/reviews.data";
import { REVIEWS as DEFAULT_REVIEWS } from "@/lib/reviews/reviews.data";

import Particles from "react-tsparticles";
import type { ISourceOptions, Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";
import GlassPanel from "@/app/_components/panels/GlassPanel";

// ✅ champion avatar resolver (uses DDragon + live patch)
import {
  championAvatarByName,
  ensureLiveDDragonPatch,
} from "@/lib/league/championAvatar";

type Props = {
  reviews?: Array<Review | string>;
  /** pixels per second; negative scrolls left */
  pxPerSecond?: number;
  className?: string;
  pauseOnHover?: boolean;
};

function normalize(reviews?: Array<Review | string>): Review[] {
  const items =
    !reviews || reviews.length === 0
      ? DEFAULT_REVIEWS
      : reviews.map((r) =>
          typeof r === "string" ? ({ name: "Player", text: r } as Review) : r
        );

  // Fill avatar automatically:
  // - prefer explicit r.avatar
  // - else use r.champion if provided
  // - else fall back to r.name
  return items.map((r) => {
    const sourceName = (r as any).champion ?? r.name;
    const avatar = r.avatar ?? championAvatarByName(sourceName);
    return { ...r, avatar };
  });
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

  // Icons slightly bigger (from 32px -> 36px)
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-visible -mt-0.5">
      <Image
        src={`/images/league/rank/${file}`}
        alt={div ? `${tier} ${div}` : tier}
        width={36}
        height={36}
        className="h-9 w-9 object-contain pointer-events-none select-none"
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
    <div className="absolute right-2.5 top-2.5 hidden sm:block">
      <div className="flex items-center gap-0.5 text-[11px] leading-4">
        <Emblem tier={pf.tier} div={pf.div} />
        <CaretRight size={18} weight="bold" className="opacity-85" aria-hidden />
        <Emblem tier={pt.tier} div={pt.div} />
        <span className="sr-only">
          Rank improved from {from ?? "unknown"} to {to ?? "unknown"}
        </span>
      </div>
    </div>
  );
};

/* ---------- Review item (inside a connected rail) ---------- */

const ReviewItem = ({ r }: { r: Review }) => {
  const avatarSrc =
    (r as any)?.avatar ?? "/images/coaching/reviews/placeholder-avatar.png";

  return (
    <div
      className="
        relative w-[240px] sm:w-[280px] shrink-0
        h-[190px]
        rounded-md
        px-4 py-4
      "
    >
      <RankChip from={r.rankFrom} to={r.rankTo} />

      <div className="flex items-center gap-2 pb-1.5 mb-2.5 border-b border-white/10 shrink-0">
        <span className="font-semibold text-white/90 truncate text-[16px] sm:text-[17px]">
          {r.name}
        </span>

        <Image
          src={avatarSrc}
          alt={`${r.name} avatar`}
          width={28}
          height={28}
          className="ml-1 inline-block h-7 w-7 rounded-full object-cover ring-1 ring-white/15"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/images/coaching/reviews/placeholder-avatar.png";
          }}
        />

        {typeof r.rating === "number" ? (
          <span className="sr-only">Rating: {r.rating} out of 5</span>
        ) : null}
      </div>

      <p className="text-white/80 text-[14px] leading-[22px] overflow-hidden">
        {r.text}
      </p>
    </div>
  );
};

export default function Reviews({
  reviews,
  pxPerSecond = -24,
  className,
  pauseOnHover = true,
}: Props) {
  // Ensure we use the live DDragon patch once on mount
  useEffect(() => {
    ensureLiveDDragonPatch(); // fetches realms and updates internal patch
  }, []);

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

  /* ---------- Purple, randomized, slow-glow particles ---------- */
  const initParticles = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particleOptions: ISourceOptions = {
    fullScreen: { enable: false },
    background: { color: "transparent" },
    detectRetina: true,
    fpsLimit: 60,
    particles: {
      number: { value: 120, density: { enable: true, area: 800 } },
      color: { value: ["#a78bfa", "#c4b5fd", "#8b5cf6"] },
      shape: { type: "circle" },
      size: { value: { min: 0.8, max: 2.6 }, animation: { enable: false } },
      opacity: {
        value: { min: 0.12, max: 0.35 },
        animation: { enable: true, speed: 0.25, minimumValue: 0.12, sync: false },
      },
      move: {
        enable: true,
        speed: 0.48,
        direction: "left",
        random: true,
        straight: false,
        outModes: { default: "out" },
        trail: { enable: false },
      },
      shadow: { enable: true, blur: 6, color: "#a78bfa" },
      links: { enable: false },
    },
    interactivity: { events: { resize: true } },
  };

  const Slice = React.forwardRef<HTMLDivElement, {}>(function Slice(_, ref) {
    return (
      <div ref={ref as any} className="flex items-stretch gap-6 shrink-0">
        {items.map((r, i) => (
          <React.Fragment key={`card-${i}`}>
            <div className={i === 0 ? "pl-6" : ""}>
              <ReviewItem r={r} />
            </div>
            <span aria-hidden className="h-full w-px bg-white/15 shrink-0" />
          </React.Fragment>
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
      className={["relative grid place-items-center py-10", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        width: "100vw",
      }}
      aria-label="What clients say"
    >
      {/* subtle texture above base color */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/coaching/texture3.jpg')",
          backgroundRepeat: "repeat",
          backgroundSize: "auto",
          mixBlendMode: "overlay",
          opacity: 0.25,
          filter: "contrast(1.15) brightness(1.04)",
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      />

      {/* Purple particles, visible through glass cards */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        <Particles
          id="reviews-particles"
          init={initParticles}
          options={particleOptions}
          className="w-full h-full"
        />
      </div>

      {/* connected wrapper rail, now full width */}
      <GlassPanel
        className="
          relative w-full
          overflow-hidden
          border-y border-white/10 ring-1 ring-inset ring-cyan-300/15
          shadow-[8px_8px_20px_-6px_rgba(0,0,0,.8)]
          backdrop-blur
          px-3 py-4
          z-10
        "
      >
        {/* subtle inner halo */}
        <div
          className="pointer-events-none absolute inset-0 shadow-[0_0_30px_-6px_rgba(168,85,247,.28)]"
          aria-hidden
        />

        <div className="w-full overflow-hidden relative">
          <div ref={trackRef} className="flex flex-nowrap will-change-transform">
            <Slice ref={sliceRef} />
            <Slice />
          </div>
        </div>
      </GlassPanel>

      {/* inner shadow overlay (on top) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          boxShadow: `
            inset 0 24px 12px -12px rgba(0,0,0,0.55),
            inset 0 -24px 12px -12px rgba(0,0,0,0.55),
            inset 40px 0 28px -18px rgba(0,0,0,0.85),
            inset -40px 0 28px -18px rgba(0,0,0,0.85)
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

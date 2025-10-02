// src/app/coaching/_coaching-components/reviews.tsx
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

import {
  championAvatarByName,
  ensureLiveDDragonPatch,
  rankMiniCrestSvg,
} from "@/lib/league/datadragon";

type Props = {
  reviews?: Array<Review | string>;
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

  return items.map((r) => {
    const sourceName = (r as any).champion ?? r.name;
    const avatar = r.avatar ?? championAvatarByName(sourceName);
    return { ...r, avatar };
  });
}

/* ---------- Rank mini-crest chip ---------- */

type DivRoman = "I" | "II" | "III" | "IV";
type RankTierInput =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "CHALLENGER"
  | "UNRANKED";

function parseRank(s?: string): { tier?: RankTierInput; div?: DivRoman } {
  if (!s) return {};
  const raw = s.trim();
  const alias = raw.toLowerCase();
  if (alias === "gm") return { tier: "GRANDMASTER" };
  if (alias === "unranked") return { tier: "UNRANKED" };

  const m = raw.match(/^([A-Za-z]+)(?:\s+(I{1,3}|IV))?$/);
  if (!m) return {};

  const t = m[1].toLowerCase();
  const map: Record<string, RankTierInput> = {
    iron: "IRON",
    bronze: "BRONZE",
    silver: "SILVER",
    gold: "GOLD",
    platinum: "PLATINUM",
    emerald: "EMERALD",
    diamond: "DIAMOND",
    master: "MASTER",
    grandmaster: "GRANDMASTER",
    gm: "GRANDMASTER",
    challenger: "CHALLENGER",
    unranked: "UNRANKED",
  };

  const tier = map[t];
  const div = (m[2] as DivRoman) || undefined;
  return { tier, div };
}

const Emblem = ({ tier, div }: { tier?: RankTierInput; div?: string }) => {
  if (!tier) return null;
  const src = rankMiniCrestSvg(tier);
  return (
    <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-visible align-middle">
      <Image
        src={src}
        alt={div ? `${tier} ${div}` : tier}
        width={32}
        height={32}
        className="h-7 w-7 object-contain pointer-events-none select-none"
        priority={false}
        unoptimized
      />
      {div ? (
        <span
          className="
            absolute bottom-0.5 right-0
            text-[9px] font-extrabold text-white leading-none
            drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]
            [text-shadow:_0_0_3px_rgba(0,0,0,0.9)]
          "
          aria-hidden
        >
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
      <div className="flex items-center gap-1 text-[11px] leading-4">
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

/* ---------- Review item ---------- */

const ReviewItem = ({ r }: { r: Review }) => {
  const avatarSrc =
    (r as any)?.avatar ?? "/images/coaching/reviews/placeholder-avatar.png";

  return (
    <div className="relative w=[240px] sm:w-[280px] shrink-0 h-[190px] rounded-md px-4 py-4">
      <RankChip from={r.rankFrom} to={r.rankTo} />

      {/* header row: name + avatar (vertically centered); emblem chip is separate (absolute) */}
      <div className="flex items-center gap-2 pb-1.5 mb-2.5 border-b border-white/10 shrink-0">
        <span className="font-semibold text-white/90 truncate text-[16px] sm:text-[17px]">
          {r.name}
        </span>

        {/* Avatar container with overflow-hidden + slight zoom on the image */}
        <span className="ml-1 inline-block h-7 w-7 rounded-full overflow-hidden ring-1 ring-white/15 align-middle">
          <Image
            src={avatarSrc}
            alt={`${r.name} avatar`}
            width={28}
            height={28}
            className="h-full w-full object-cover scale-[1.12]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/images/coaching/reviews/placeholder-avatar.png";
            }}
          />
        </span>

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
  useEffect(() => {
    ensureLiveDDragonPatch();
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

      <div className="absolute inset-0 z-5 pointer-events-none">
        <Particles
          id="reviews-particles"
          init={initParticles}
          options={particleOptions}
          className="w-full h-full"
        />
      </div>

      <GlassPanel className="relative w-full overflow-hidden border-y border-white/10 ring-1 ring-inset ring-cyan-300/15 shadow-[8px_8px_20px_-6px_rgba(0,0,0,.8)] backdrop-blur px-3 py-4 z-10">
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

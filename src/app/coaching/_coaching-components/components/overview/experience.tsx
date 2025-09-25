// src/app/coaching/_coaching-components/components/overview/experience.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * Champion squares from Riot Data Dragon
 * - We auto-detect the correct patch version at runtime using realms JSON
 * - If that fetch fails, we fall back to a pinned version below
 */
const FALLBACK_PATCH = "15.19.1"; // used until realms loads

function champSquareUrl(key: string, version: string = FALLBACK_PATCH) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${key}.png`;
}

// Exactly 30 champs (10 per row). Use champion *id* casing from champion.json
const ROW1 = [
  "Ahri",
  "Akali",
  "Annie",
  "Ashe",
  "Braum",
  "Caitlyn",
  "Darius",
  "Diana",
  "DrMundo",
  "Ekko",
];

const ROW2 = [
  "Ezreal",
  "Fiora",
  "Garen",
  "Irelia",
  "Janna",
  "Jax",
  "Jinx",
  "Kaisa", // keep as-is
  "Katarina",
  "LeeSin",
];

const ROW3 = [
  "Leona",
  "Lux",
  "Malphite",
  "MasterYi",
  "MissFortune",
  "Nami",
  "Nasus",
  "Orianna",
  "Riven",
  "Yasuo",
];

export default function Experience() {
  const [patch, setPatch] = React.useState<string>(FALLBACK_PATCH);

  // Detect current champion data version once on mount
  React.useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/realms/euw.json")
      .then((r) => r.json())
      .then((data) => {
        const v = data?.n?.champion;
        if (typeof v === "string" && v.length > 0) setPatch(v);
      })
      .catch(() => {
        // keep fallback
      });
  }, []);

  return (
    <section
      aria-labelledby="experience-title"
      className="relative w-full overflow-hidden rounded-3xl border border-[var(--color-divider)]/40 bg-gradient-to-b from-[rgba(12,12,15,0.8)] to-[rgba(12,12,15,0.4)] p-6 md:p-10"
    >
      {/* subtle grid + glow accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(1200px 400px at 80% -10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(900px 300px at 10% 110%, rgba(59,130,246,0.18), transparent 60%)",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, black 30%, black 70%, rgba(0,0,0,0.9) 100%)",
        }}
      />
      <GridPattern />

      {/* content */}
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        {/* left: copy / CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-center"
        >
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--color-divider)]/60 bg-black/30 px-3 py-1 text-[10px] font-semibold tracking-wide text-fg-muted/80 backdrop-blur md:text-xs">
            <Dot /> Trusted Coach • All Roles
          </div>

          <h2
            id="experience-title"
            className="mt-3 text-3xl font-extrabold leading-tight text-white md:text-5xl"
          >
            5 Years of Coaching.
            <span className="block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #f59e0b, #a78bfa, #60a5fa)",
              }}
            >
              Built for ranked climbing.
            </span>
          </h2>

          <p className="mt-4 max-w-prose text-sm leading-relaxed text-fg-muted/85 md:text-base">
            Role-agnostic fundamentals, champion-specific plans, and
            decision-making you can repeat under pressure. We turn messy games
            into clear, winnable paths—without burning you out.
          </p>

          {/* highlights */}
          <ul className="mt-6 grid grid-cols-2 gap-3 text-xs text-fg-muted/90 md:text-sm">
            <li className="flex items-center gap-2 rounded-xl border border-[var(--color-divider)]/50 bg-black/30 px-3 py-2 backdrop-blur">
              <Badge /> 5+ yrs coaching, all roles
            </li>
            <li className="flex items-center gap-2 rounded-xl border border-[var(--color-divider)]/50 bg-black/30 px-3 py-2 backdrop-blur">
              <Badge /> Champ pools from micro → macro
            </li>
            <li className="flex items-center gap-2 rounded-xl border border-[var(--color-divider)]/50 bg-black/30 px-3 py-2 backdrop-blur">
              <Badge /> Actionable, timestamped reviews
            </li>
            <li className="flex items-center gap-2 rounded-xl border border-[var(--color-divider)]/50 bg-black/30 px-3 py-2 backdrop-blur">
              <Badge /> Works from Silver to GM
            </li>
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="/coaching#book"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-400/20 to-indigo-400/20 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,200,0,0.12)] hover:border-amber-300/50 md:text-base"
            >
              Book a session
            </a>
            <a
              href="/coaching#curriculum"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-divider)]/60 bg-black/30 px-5 py-3 text-sm font-semibold text-fg-muted/90 hover:text-white md:text-base"
            >
              See how it works
            </a>
          </div>

          {/* debug hint: current patch used for images (screenreader only) */}
          <span className="sr-only">DDragon patch {patch}</span>
        </motion.div>

        {/* right: animated champion bands in a card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="relative"
        >
          <div className="relative h-full w-full">
            <div className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border border-[var(--color-divider)]/50 bg-black/35 p-4 backdrop-blur md:gap-6 md:p-6">
              {/* header strip */}
              <div className="flex w-full items-center justify-between rounded-xl border border-[var(--color-divider)]/40 bg-white/[0.02] px-3 py-2 text-[10px] text-fg-muted/70 md:text-xs">
                <span className="font-semibold tracking-wide">Champion Pools I’ve Coached</span>
                <span className="opacity-70">Live Patch Assets</span>
              </div>

              <div className="w-full space-y-3 md:space-y-4">
                <Row id="top"    widthPct={92} dir="left"  duration={32} edgeFadePx={56} champs={ROW1} patch={patch} />
                <Row id="mid"    widthPct={100} dir="right" duration={28} edgeFadePx={72} champs={ROW2} patch={patch} />
                <Row id="bottom" widthPct={92} dir="left"  duration={30} edgeFadePx={56} champs={ROW3} patch={patch} />
              </div>

              {/* footer note */}
              <div className="mt-2 w-full text-center text-[10px] text-fg-muted/70 md:text-xs">
                Pulls champion squares via Riot Data Dragon. Auto-updates each patch.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------- helpers -------------------------------- */

function Dot() {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{
        background:
          "conic-gradient(from 0deg, #f59e0b 0deg, #a78bfa 120deg, #60a5fa 240deg, #f59e0b 360deg)",
      }}
    />
  );
}

function Badge() {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, #f59e0b, rgba(245,158,11,0.0) 70%), radial-gradient(circle at 70% 70%, #60a5fa, rgba(96,165,250,0.0) 70%)",
      }}
    />
  );
}

/** Decorative, extremely light grid pattern */
function GridPattern() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
    >
      <defs>
        <pattern
          id="smallGrid"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#smallGrid)" />
    </svg>
  );
}

/* ------------------------------- row marquee ------------------------------ */

function Row({
  id,
  widthPct,
  dir,
  duration,
  edgeFadePx = 28, // default; overridden above to larger values
  champs,
  patch,
}: {
  id: string;
  widthPct: number;
  dir: "left" | "right";
  duration: number;
  edgeFadePx?: number;
  champs: string[];
  patch: string;
}) {
  const SIZE = 36; // larger to fit the bigger section
  const GAP = 12;
  const ITEMS = champs.length;
  const SHIFT = ITEMS * (SIZE + GAP);

  // duplicate for seamless scroll
  const sequence = [...champs, ...champs];

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: `${widthPct}%`,
        borderRadius: 999,
        WebkitMaskImage: `linear-gradient(90deg, transparent 0, black ${edgeFadePx}px, black calc(100% - ${edgeFadePx}px), transparent 100%)`,
        maskImage: `linear-gradient(90deg, transparent 0, black ${edgeFadePx}px, black calc(100% - ${edgeFadePx}px), transparent 100%)`,
      }}
    >
      <motion.div
        className="flex"
        style={{ gap: GAP }}
        animate={{ x: dir === "left" ? [0, -SHIFT] : [-SHIFT, 0] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {sequence.map((champ, i) => (
          <div
            key={`${id}-${champ}-${i}`}
            className="flex-shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--color-divider)]/80 bg-black"
            style={{ width: SIZE, height: SIZE }}
          >
            <img
              src={champSquareUrl(champ, patch)}
              alt={champ}
              loading="lazy"
              decoding="async"
              className="block h-full w-full scale-[1.06] object-cover will-change-transform"
              draggable={false}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

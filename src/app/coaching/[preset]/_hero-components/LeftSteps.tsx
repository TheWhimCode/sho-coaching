// components/HeroSection/LeftSteps.tsx
"use client";

import React from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { Preset, } from "@/engine/session";
import { colorsByPreset } from "@/engine/session";
import GlassPanel from "@/app/_components/panels/GlassPanel";

export type StepItem = { title: string };

type Props = {
  steps: StepItem[];
  title?: string;
  /** Change on preset switch to retrigger enter/exit (e.g., the preset string). */
  animKey?: string | number;
  /** Active session preset to color the header glow. */
  preset: Preset;
  /** Optional: match/stagger page enter timing */
  enterDelay?: number;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
  exit: {
    opacity: 1,
    transition: { staggerChildren: 0.06, staggerDirection: 1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.18, ease: EASE } },
};

const ROWS = 5;

export default function LeftSteps({
  steps,
  title = "How it works",
  animKey,
  preset,
  enterDelay = 0.05,
}: Props) {
  // lock layout to 5 rows so 4-step presets align exactly like 5-step ones
  const rows: (StepItem | null)[] = Array.from({ length: ROWS }, (_, i) => steps[i] ?? null);

  // EXACT same color/glow sourcing as CenterSessionPanel
  const { ring, glow } = colorsByPreset[preset];

  return (
    <motion.div
      // same page-enter as RightBooking
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: enterDelay }}
      className="relative w-full"
    >
      <GlassPanel
        className={[
          "px-6 md:px-7 lg:px-8 py-4.5 md:py-5 lg:py-6", // half the original vertical padding
          "min-h-[470px] md:min-h-[510px] lg:min-h-[530px]",
          "flex flex-col",
        ].join(" ")}
      >
        {/* Header (identical pattern to CenterSessionPanel) */}
        <div className="mb-1 md:mb-2">
          <div
            className="text-[12px] font-semibold tracking-wide uppercase mb-1"
            style={{ color: ring, filter: `drop-shadow(0 0 6px ${glow})` }}
          >
            Quick overview
          </div>
          <div className="inline-block w-full">
            <h3 className="mt-0 font-bold text-2xl text-white">{title}</h3>
          </div>
        </div>

        {/* Animated list */}
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            <motion.ul
              key={animKey ?? steps.map((s) => s.title).join("|")}
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 grid grid-rows-5"
            >
              {rows.map((row, idx) => (
                <motion.li key={idx} variants={item} className="relative flex items-center">
                  {row ? (
                    <div className="flex items-center w-full">
                      <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[.05] ring-1 ring-white/10 text-[15px] font-semibold text-white/90">
                        {idx + 1}
                      </span>
                      <div className="grow pl-4 pr-2 py-3">
                        <div className="text-[18px] md:text-[19px] lg:text-[18px] leading-snug text-white/90">
                          {row.title}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // empty row keeps spacing identical for shorter lists
                    <div className="py-3" />
                  )}

                  {/* Divider between rows (purely visual, keeps grid feel) */}
                  {idx < ROWS - 1 && (
                    <div className="pointer-events-none absolute left-[calc(2.5rem+0.75rem)] right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                  )}
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="mt-2 text-xs text-white/60">
          For more information — check out the                    <a
                      href="/coaching"
                      target=""
                      rel="noreferrer"
                      className="underline hover:text-white font-bold"
                    >
                      previous page
                    </a>{" "}
        </p>


        {/* corner glow */}
        <span className="pointer-events-none absolute -inset-3 -z-10 rounded-[24px] opacity-10 blur-2xl bg-[radial-gradient(70%_50%_at_0%_0%,_rgba(148,182,255,.25),_transparent_60%)]" />
      </GlassPanel>
    </motion.div>
  );
}

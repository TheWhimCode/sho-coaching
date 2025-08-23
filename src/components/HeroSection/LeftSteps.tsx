// components/HeroSection/LeftSteps.tsx
"use client";

import React from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";

export type StepItem = { title: string };

type Props = {
  steps: StepItem[];
  title?: string;
  /** Change on preset switch to retrigger enter/exit (e.g., the preset string). */
  animKey?: string | number;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// container controls child staggering for both enter and exit
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
  show:   { opacity: 1, x: 0,  transition: { duration: 0.22, ease: EASE } },
  exit:   { opacity: 0, x: 12, transition: { duration: 0.18, ease: EASE } },
};

const ROWS = 5;

export default function LeftSteps({ steps, title = "How it works", animKey }: Props) {
  // lock layout to 5 rows so 4-step presets align exactly like 5-step ones
  const rows: (StepItem | null)[] = Array.from({ length: ROWS }, (_, i) => steps[i] ?? null);

  return (
    <div
      className={[
        "relative rounded-2xl backdrop-blur-md ring-1 ring-[rgba(146,180,255,.18)] bg-[#0B1220]/80",
        "p-6 md:p-7 lg:p-8",
        // reduced min-heights slightly
        "min-h-[470px] md:min-h-[510px] lg:min-h-[530px]",
        "flex flex-col",
      ].join(" ")}
    >
      {/* Header */}
      <div className="mb-2 md:mb-3">
        <div className="text-xs uppercase tracking-wider text-[#8FB8E6]/90">Quick overview</div>
        <div className="inline-block w-full">
          <h3 className="mt-1 font-bold text-2xl text-white">{title}</h3>
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
                    <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[.07] ring-1 ring-white/15 text-[15px] font-semibold text-white/90">
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
                  <div className="pointer-events-none absolute left-[calc(2.5rem+0.75rem)] right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                )}
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <p className="mt-3 text-[13px] text-white/60">
        For more information — scroll down on the previous page.
      </p>

      {/* corner glow */}
      <span className="pointer-events-none absolute -inset-3 -z-10 rounded-[24px] opacity-20 blur-2xl bg-[radial-gradient(70%_50%_at_0%_0%,_rgba(148,182,255,.25),_transparent_60%)]" />
    </div>
  );
}

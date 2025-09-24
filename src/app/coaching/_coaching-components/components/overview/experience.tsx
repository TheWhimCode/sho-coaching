// src/app/coaching/_coaching-components/components/overview/experience.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

const IMAGE_SRC = "/images/league/tokens/viktor.svg";

export default function Experience() {
  return (
    <div className="w-full">
      <div className="space-y-3 md:space-y-4">
        <Row id="top"    widthPct={44} dir="left"  duration={32} edgeFadePx={56} />
        <Row id="mid"    widthPct={50} dir="right" duration={28} edgeFadePx={72} />
        <Row id="bottom" widthPct={44} dir="left"  duration={30} edgeFadePx={56} />
      </div>

      {/* text below */}
      <div className="mt-5 md:mt-6 text-center">
        <p className="text-3xl md:text-4xl font-extrabold leading-none text-white">
          5 years
        </p>
        <p className="mt-2 text-xs md:text-sm text-fg-muted/85">
          of coaching experience on all roles
        </p>
      </div>
    </div>
  );
}

/** Minimal, styled Rating (gradient text + right fade, no snap) */
export function Rating() {
  return (
    <div className="flex items-center justify-center p-10 md:py-16">
      <div className="text-center">
        {/* right-edge fade only on the number line */}
        <div
          className="inline-block"
          style={{
            WebkitMaskImage:
              "linear-gradient(90deg, black 0%, black 88%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(90deg, black 0%, black 88%, rgba(0,0,0,0) 100%)",
          }}
        >
          <motion.span
            aria-label="Rating 4.9 out of 5"
            className="block text-5xl md:text-6xl font-extrabold leading-none bg-clip-text text-transparent select-none"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #fef3c7, #f59e0b, #a78bfa, #93c5fd, #fef3c7)",
              backgroundSize: "300% 100%",
              textShadow: "0 0 10px rgba(255,255,255,0.05)",
            }}
            animate={{ backgroundPositionX: ["0%", "100%"] }}
            transition={{
              duration: 10,
              ease: "linear",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            4.9 / 5
          </motion.span>
        </div>

        <p className="mt-3 text-sm md:text-base text-fg-muted/80">
          500+ reviews
        </p>
      </div>
    </div>
  );
}

function Row({
  id,
  widthPct,
  dir,
  duration,
  edgeFadePx = 28, // default; overridden above to double the previous values
}: {
  id: string;
  widthPct: number;
  dir: "left" | "right";
  duration: number;
  edgeFadePx?: number;
}) {
  const SIZE = 28;
  const GAP = 10;
  const ITEMS = 10;
  const SHIFT = ITEMS * (SIZE + GAP);

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: `${widthPct}%`,
        borderRadius: 999,
        WebkitMaskImage: `linear-gradient(90deg, transparent 0, black ${edgeFadePx}px, black calc(100% - ${edgeFadePx}px), transparent 100%)`,
        maskImage:       `linear-gradient(90deg, transparent 0, black ${edgeFadePx}px, black calc(100% - ${edgeFadePx}px), transparent 100%)`,
      }}
    >
      <motion.div
        className="flex"
        style={{ gap: GAP }}
        animate={{ x: dir === "left" ? [0, -SHIFT] : [-SHIFT, 0] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {Array.from({ length: ITEMS * 2 }).map((_, i) => (
          <div
            key={`${id}-${i}`}
            className="flex-shrink-0 rounded-full ring-1 ring-[var(--color-divider)]/80 overflow-hidden"
            style={{ width: SIZE, height: SIZE }}
          >
            <img
              src={IMAGE_SRC}
              alt="role token"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

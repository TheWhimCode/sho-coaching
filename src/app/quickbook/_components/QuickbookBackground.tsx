// src/app/quickbook/_components/QuickbookBackground.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const BG_FADE_DURATION = 3;

export default function QuickbookBackground() {
  return (
    <motion.div
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: BG_FADE_DURATION, ease: EASE }}
    >
      <video
        src="/videos/customize/Particle1_slow.webm"
        autoPlay
        muted
        loop
        playsInline
        className="hidden md:block h-full w-full object-cover object-left md:object-center"
      />

      <video
        src="/videos/customize/Particle_mobile480p.webm"
        autoPlay
        muted
        loop
        playsInline
        className="block md:hidden h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/20" />
    </motion.div>
  );
}
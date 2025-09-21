// components/overview/Overview2.tsx
"use client";

import React, { useCallback, useState } from "react";
import {
  Bolt,
  ShieldCheck,
  Clock3,
  Target,
  BrainCircuit,
  ThumbsUp,
} from "lucide-react";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import type { ISourceOptions, Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";

type Item = {
  id: string;
  title: string;
  body: string;
  icon?: React.ReactNode;
};

const DEFAULT_ITEMS: Item[] = [
  { id: "benefit-1", title: "Understand macro", body: "Learn how the game works at a deeper level.", icon: <BrainCircuit className="h-6 w-6" /> },
  { id: "benefit-2", title: "Turn knowledge into wins", body: "Knowledge isn't everything. It's also about how you apply it.", icon: <Target className="h-6 w-6" /> },
  { id: "benefit-3", title: "Profile review", body: "Gain insight on how your profile compares to the average player.", icon: <Clock3 className="h-6 w-6" /> },
  { id: "benefit-4", title: "No sugar-coating", body: "All feedback is honest. Walk away with enough input for your next 100+ games.", icon: <Bolt className="h-6 w-6" /> },
  { id: "benefit-5", title: "Mechanics upgrade", body: "Get instant feedback on your mechanics and how to sharpen them.", icon: <ShieldCheck className="h-6 w-6" /> },
  { id: "benefit-6", title: "VOD & Notes", body: "After the session you will receive the recording and summary notes of the session.", icon: <ThumbsUp className="h-6 w-6" /> },
];

export default function Overview2({
  eyebrow = "Benefits",
  heading = "Real coaching value",
  items = DEFAULT_ITEMS,
  className = "",
}: {
  eyebrow?: string;
  heading?: string;
  items?: Item[];
  className?: string;
}) {
  return (
    <section className={`w-full ${className}`}>
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] tracking-[0.22em] text-white/55 uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl md:text-[44px] leading-tight font-bold">
            {heading}
          </h2>
        </div>

        {/* Connected panel with dividers */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(22,36,70,.65), rgba(16,30,62,.65))",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,.05), 0 10px 28px rgba(0,0,0,.35)",
          }}
        >
          {/* texture overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              backgroundImage: "url('/images/coaching/texture3.jpg')",
              backgroundRepeat: "repeat",
              backgroundSize: "auto",
              mixBlendMode: "overlay",
              opacity: 0.16,
              filter: "contrast(1.08) brightness(1.03)",
            }}
          />

          {/* grid with BOTH dividers */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 divide-y md:divide-y md:divide-x divide-white/10">
            {items.map((item) => (
              <Cell key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Hover effect: dark purple gradient overlay + subtler particles (no white inner shadow) */
function Cell({ item }: { item: Item }) {
  const [hovered, setHovered] = useState(false);
  const FADE_MS = 1000;

  const initParticles = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particleOptions: ISourceOptions = {
    fullScreen: { enable: false },
    background: { color: "transparent" },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      number: { value: 800, density: { enable: true, area: 700 } }, // slightly fewer
      move: { enable: false },
      size: { value: { min: 0.3, max: 1.0 } },
      color: { value: "#A8C7FF" },
      opacity: {
        value: { min: 0.03, max: 0.3 }, // less visible
        animation: {
          enable: true,
          speed: 0.3, // a bit calmer
          minimumValue: 0.03,
          startValue: "random",
          destroy: "none",
          sync: false,
        },
      },
      shadow: { enable: false }, // reduce visual pop
    },
    interactivity: { events: { resize: true } },
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative p-6 md:p-7 group transition-colors duration-300"
      style={{ minHeight: 260 }}
    >
      {/* Dark purple gradient overlay on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: FADE_MS / 2000, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(108,45,180,0.28), rgba(32,14,64,0.70))",
        }}
      />

      {/* Particles fade via opacity on hover (subtler) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: FADE_MS / 2000, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none z-0"
      >
        <Particles
          id={`particles-${item.id}`}
          init={initParticles}
          options={particleOptions}
          className="w-full h-full"
        />
      </motion.div>

      {/* content */}
      <div className="relative z-10">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          {item.icon ?? <Bolt className="h-6 w-6 opacity-90" />}
        </div>
        <h3 className="text-lg md:text-xl font-semibold">{item.title}</h3>
        <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-white/70">
          {item.body}
        </p>
      </div>
    </div>
  );
}

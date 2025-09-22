// components/overview/Overview2.tsx
"use client";

import React, { useCallback, useState } from "react";
import {
  Trophy,
  BarChart3,
  Crosshair,
  Clapperboard,
  Bolt,
  LayoutDashboard,
  AlertCircle,
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
  { id: "benefit-1", title: "Understand macro", body: "Learn to think like a pro and use the map to your advantage.", icon: <LayoutDashboard className="h-6 w-6" /> },
  { id: "benefit-2", title: "Turn knowledge into wins", body: "Apply your knowledge in practice to close out more games.", icon: <Trophy className="h-6 w-6" /> },
  { id: "benefit-3", title: "Profile review", body: "See how your profile stacks up against the pros.", icon: <BarChart3 className="h-6 w-6" /> },
  { id: "benefit-4", title: "No sugar-coating", body: "Direct, honest feedback. Enough input for your next 100+ games.", icon: <AlertCircle className="h-6 w-6" /> },
  { id: "benefit-5", title: "Mechanics upgrade", body: "Get instant feedback on mechanics and how to sharpen them.", icon: <Crosshair className="h-6 w-6" /> },
  { id: "benefit-6", title: "VOD & Notes", body: "Receive my session recording and summary notes afterwards.", icon: <Clapperboard className="h-6 w-6" /> },
];

export default function Overview2({
  eyebrow = "Benefits",
  heading = "Why coaching works",
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
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] tracking-[0.22em] text-fg-muted uppercase">{eyebrow}</p>
          <h2 className="mt-2 text-3xl md:text-[44px] leading-tight font-bold">{heading}</h2>
        </div>

        {/* Panel with ring/shadow only */}
        <div
          className="relative rounded-2xl overflow-hidden ring-1 ring-[color:var(--color-divider)]"
          style={{
            background: "var(--color-panel)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow:
              "0 10px 28px rgba(0,0,0,.35), 0 0 0 1px color-mix(in srgb, var(--color-fg) 8%, transparent)",
          }}
        >
          {/* subtle texture overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              backgroundImage: "url('/images/coaching/texture3.jpg')",
              backgroundRepeat: "repeat",
              backgroundSize: "auto",
              mixBlendMode: "overlay",
              opacity: 0.14,
              filter: "contrast(1.04) brightness(1.01)",
            }}
          />

          {/* 2x3 grid with inner borders */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 md:grid-rows-2">
            {items.map((item, i) => {
              const isFirstItem = i === 0;
              const isFirstRow = i < 3;
              const isFirstCol = i % 3 === 0;
              return (
                <Cell
                  key={item.id}
                  item={item}
                  isFirstItem={isFirstItem}
                  isFirstRow={isFirstRow}
                  isFirstCol={isFirstCol}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Icon chip: dark glassy look like RightBooking */
function MotionIcon({ hovered, children }: { hovered: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 1, y: 0, opacity: 0.95 }}
      animate={{ scale: hovered ? 1.06 : 1, y: hovered ? -2 : 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-[rgba(146,180,255,.18)]"
      style={{
        background: "rgba(11,18,32,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        animate={{ rotate: hovered ? 0.0001 : 0 }}
        transition={{ duration: 0.2 }}
        className="opacity-90"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* Hover: lighter purple gradient + subtle particles; text zoom (slightly less than icon) */
function Cell({
  item,
  isFirstItem,
  isFirstRow,
  isFirstCol,
}: {
  item: Item;
  isFirstItem: boolean;
  isFirstRow: boolean;
  isFirstCol: boolean;
}) {
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
      number: { value: 700, density: { enable: true, area: 700 } },
      move: { enable: false },
      size: { value: { min: 0.3, max: 2.0 } },
      color: { value: "#FFFFFF" },
      opacity: {
        value: { min: 0.03, max: 0.22 },
        animation: { enable: true, speed: 0.5, minimumValue: 0.03, startValue: "random", destroy: "none", sync: false },
      },
      shadow: { enable: false },
    },
    interactivity: { events: { resize: true } },
  };

  const borders = [
    "border-divider",
    !isFirstItem ? "border-t" : "",
    !isFirstRow ? "md:border-t" : "md:border-t-0",
    !isFirstCol ? "md:border-l" : "md:border-l-0",
    "md:border-r-0 md:border-b-0",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative p-6 md:p-7 group transition-colors duration-300 ${borders}`}
      style={{ minHeight: 260 }}
    >
      {/* Hover gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: FADE_MS / 2000, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(139,92,246,0.18), rgba(32,14,64,0.38))",
        }}
      />

      {/* Particles */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: FADE_MS / 2000, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none z-0"
      >
        <Particles id={`particles-${item.id}`} init={initParticles} options={particleOptions} className="w-full h-full" />
      </motion.div>

      {/* content (text zoom slightly less than icon) */}
      <motion.div
        className="relative z-10"
        animate={{ scale: hovered ? 1.03 : 1, y: hovered ? -1 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        style={{ transformOrigin: "bottom center" }}
      >
        <MotionIcon hovered={hovered}>
          {item.icon ?? <Bolt className="h-6 w-6 opacity-90" />}
        </MotionIcon>
        <h3 className="text-lg md:text-xl font-semibold">{item.title}</h3>
        <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-fg-muted">
          {item.body}
        </p>
      </motion.div>
    </div>
  );
}

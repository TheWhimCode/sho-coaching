// src/app/coaching/_coaching-components/components/overview/index.tsx
"use client";

import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import BluePanel from "@/app/_components/panels/BluePanel"; // still used for the 2x3 grid only
import Experience from "@/app/coaching/_coaching-components/components/overview/experience";
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
  { id: "benefit-1", title: "Understand macro", body: "Learn to think like a pro, use the map to your advantage.", icon: <LayoutDashboard className="h-6 w-6" /> },
  { id: "benefit-2", title: "Turn knowledge into wins", body: "Learn to apply your gameknowledge to close out more games.", icon: <Trophy className="h-6 w-6" /> },
  { id: "benefit-3", title: "Profile review", body: "See how your profile stacks up against the pros.", icon: <BarChart3 className="h-6 w-6" /> },
  { id: "benefit-4", title: "No sugar-coating", body: "Direct, honest feedback. Enough input for your next 100+ games.", icon: <AlertCircle className="h-6 w-6" /> },
  { id: "benefit-5", title: "Mechanics upgrade", body: "Get instant feedback on mechanics and how to sharpen them.", icon: <Crosshair className="h-6 w-6" /> },
  { id: "benefit-6", title: "VOD & Notes", body: "Receive my session recording and summary notes afterwards.", icon: <Clapperboard className="h-6 w-6" /> },
];

const NOTES_IMG_SRC = "/images/coaching/overview/notes.png";

export default function Overview({
  eyebrow = "Benefits",
  heading = "Why my coaching works",
  items = DEFAULT_ITEMS,
  className = "",
}: {
  eyebrow?: string;
  heading?: string;
  items?: Item[];
  className?: string;
}) {
  return (
    <section
      className={`w-full ${className}`}
      style={{
        ["--color-divider" as any]: "rgb(255 255 255 / .10)",
        ["--color-orange-soft" as any]:
          "color-mix(in srgb, var(--color-orange) 78%, white 22%)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] tracking-[0.22em] text-fg-muted uppercase">{eyebrow}</p>
          <h2 className="mt-2 text-3xl md:text-[44px] leading-tight font-bold">{heading}</h2>
        </div>

        {/* 2×3 grid (keeps the BluePanel) */}
        <BluePanel>
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
        </BluePanel>

        {/* Bottom: experience (no rating) */}
        <div className="mt-6">
          <div className="p-6 md:py-10">
            <Experience />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Icon chip (hover grows slightly more) */
function MotionIcon({ hovered, children }: { hovered: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 1, y: 0, opacity: 0.95 }}
      animate={{ scale: hovered ? 1.08 : 1, y: hovered ? -2 : 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-[rgba(146,180,255,.18)]"
      style={{ background: "rgba(11,18,32,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      <motion.div animate={{ rotate: hovered ? 0.0001 : 0 }} transition={{ duration: 0.2 }} className="opacity-90">
        {children}
      </motion.div>
    </motion.div>
  );
}

/* Tiles */
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
  const [preview, setPreview] = useState<{ show: boolean; x: number; y: number; w: number }>({
    show: false,
    x: 0,
    y: 0,
    w: 560,
  });
  const highlightRef = useRef<HTMLSpanElement | null>(null);
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

  /** Title with “Notes” highlighted + underline and image preview */
  const renderTitle = () => {
    const hasNotes = /notes/i.test(item.title);
    if (!hasNotes) return item.title;

    const parts = item.title.split(/(notes)/i);
    return parts.map((part, idx) => {
      const isNotes = part.toLowerCase() === "notes";
      if (!isNotes) return <React.Fragment key={idx}>{part}</React.Fragment>;

      const onEnter = () => {
        const el = highlightRef.current;
        if (!el || typeof window === "undefined") return;
        const rect = el.getBoundingClientRect();

        const w = Math.min(640, Math.max(480, Math.floor(window.innerWidth * 0.4)));
        let x = rect.right + 20;
        if (x + w > window.innerWidth - 20) x = rect.left - 20 - w;

        const estimatedH = Math.floor(w * 0.66);
        let y = Math.round((window.innerHeight - estimatedH) / 2);
        y = Math.max(20, Math.min(y, window.innerHeight - estimatedH - 20));

        setPreview({ show: true, x, y, w });
      };

      const onLeave = () => setPreview((p) => ({ ...p, show: false }));

      return (
        <span
          key={idx}
          ref={highlightRef}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className="relative underline decoration-current underline-offset-2"
          style={{ color: "var(--color-orange-soft)" }}
        >
          Notes
        </span>
      );
    });
  };

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative p-6 md:p-7 group transition-colors duration-300 ${borders} flex flex-col justify-between`}
        style={{ minHeight: 260, background: "var(--color-panel)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      >
        {/* Hover gradient */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: FADE_MS / 2000, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none z-0"
          style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.18), rgba(32,14,64,0.38))" }}
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

        {/* icon */}
        <MotionIcon hovered={hovered}>{item.icon ?? <Bolt className="h-6 w-6 opacity-90" />}</MotionIcon>

        {/* text */}
        <div className="relative z-10">
          <h3 className="text-lg md:text-xl font-semibold">{renderTitle()}</h3>
          <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-fg-muted">{item.body}</p>
        </div>
      </div>

      {/* Image preview portal (for “Notes”) */}
      {typeof window !== "undefined" &&
        preview.show &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            style={{
              position: "fixed",
              left: preview.x,
              top: preview.y,
              width: preview.w,
              zIndex: 60,
              background: "rgba(8,10,16,0.9)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              pointerEvents: "none",
              borderRadius: "1rem",
              boxShadow: "0 12px 48px rgba(0,0,0,.5)",
              overflow: "hidden",
            }}
          >
            <img
              src={NOTES_IMG_SRC}
              alt="Example session notes"
              style={{ display: "block", width: "100%", height: "auto", borderRadius: "1rem" }}
            />
          </motion.div>,
          document.body
        )}
    </>
  );
}

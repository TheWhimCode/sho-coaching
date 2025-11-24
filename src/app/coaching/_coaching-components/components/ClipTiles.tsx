"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { ClipData } from "@/lib/coaching/clips.data";

type ClipTilesProps = {
  data: ClipData[];
  cols?: number;
  rows?: number;
  gap?: string;
  bleed?: string;
  className?: string;
};

export default function ClipTiles({
  data,
  cols = 3,
  rows = 2,
  gap = "12px",
  bleed = "15vw",
  className = "",
}: ClipTilesProps) {
  if (!data || data.length === 0) return null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, {
    amount: 0.8,
    margin: "0px 0px -10% 0px",
  });

  // timings
  const START_DELAY_MS = 2000;
  const FADE_IN_MS = 600;
  const HOLD_MS = 2500;
  const FADE_OUT_MS = 1200;
  const GAP_MS = 1000;

  const sequence = useMemo(() => {
    const centerBottom = (rows - 1) * cols + Math.floor(cols / 2);
    const mapPos = {
      topLeft: 0,
      topCenter: Math.floor(cols / 2),
      topRight: cols - 1,
      bottomLeft: (rows - 1) * cols + 0,
      bottomCenter: centerBottom,
      bottomRight: (rows - 1) * cols + (cols - 1),
    };
    return [
      mapPos.bottomCenter,
      mapPos.topLeft,
      mapPos.bottomRight,
      mapPos.topCenter,
      mapPos.bottomLeft,
      mapPos.topRight,
    ];
  }, [rows, cols]);

  type Phase = "in" | "hold" | "out" | null;
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>(null);

  useEffect(() => {
    if (!inView || sequence.length === 0) return;

    let idx = 0;
    let alive = true;
    const to: number[] = [];

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      to.push(id);
    };

    const runStep = () => {
      if (!alive) return;
      const tile = sequence[idx % sequence.length];

      setHighlightIndex(tile);
      setPhase("in");
      schedule(() => setPhase("hold"), FADE_IN_MS);
      schedule(() => setPhase("out"), FADE_IN_MS + HOLD_MS);
      schedule(() => {
        setHighlightIndex(null);
        setPhase(null);
        idx++;
        schedule(runStep, GAP_MS);
      }, FADE_IN_MS + HOLD_MS + FADE_OUT_MS);
    };

    schedule(runStep, START_DELAY_MS);

    return () => {
      alive = false;
      to.forEach(clearTimeout);
      setHighlightIndex(null);
      setPhase(null);
    };
  }, [inView, sequence]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video overflow-visible ${className}`}
      style={
        { ["--gap" as any]: gap, ["--bleed" as any]: bleed } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 z-10">
        {Array.from({ length: rows * cols }).map((_, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);

          const tileW = `calc((100% - ${(cols - 1)} * var(--gap)) / ${cols})`;
          const tileH = `calc((100% - ${(rows - 1)} * var(--gap)) / ${rows})`;
          const left = `calc((${tileW} + var(--gap)) * ${c})`;
          const top = `calc((${tileH} + var(--gap)) * ${r})`;

          return (
            <ClipTile
              key={`core-${i}`}
              clip={data[i % data.length]}
              pos={{ left, top, tileW, tileH }}
              interactive
              baseZ={20}
              forcedOpacity={1}
              highlighted={highlightIndex === i}
              phase={phase}
              fadeInMs={FADE_IN_MS}
              fadeOutMs={FADE_OUT_MS}
            />
          );
        })}
      </div>
    </div>
  );
}

function ClipTile({
  clip,
  pos,
  interactive,
  baseZ = 1,
  forcedOpacity,
  highlighted = false,
  phase = null,
  fadeInMs = 600,
  fadeOutMs = 1200,
}: {
  clip: ClipData | null;
  pos: { left: string; top: string; tileW: string; tileH: string };
  interactive: boolean;
  baseZ?: number;
  forcedOpacity?: number;
  highlighted?: boolean;
  phase?: "in" | "hold" | "out" | null;
  fadeInMs?: number;
  fadeOutMs?: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hovered, setHovered] = useState(false);

  const { left, top, tileW, tileH } = pos;

  const onHoverStart = () => {
    if (!interactive) return;
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  };
  const onHoverEnd = () => {
    if (!interactive) return;
    setHovered(false);
    videoRef.current?.pause();
  };

  const width = interactive && hovered ? "100%" : tileW;
  const height = interactive && hovered ? "100%" : tileH;
  const l = interactive && hovered ? "0%" : left;
  const t = interactive && hovered ? "0%" : top;

  // Light blue gradient (was purple)
  const blueBorder = `
    linear-gradient(
      135deg,
      rgba(96,165,250,1) 0%,
      rgba(96,165,250,0.4) 30%,
      rgba(96,165,250,0.1) 65%,
      transparent 95%
    )
  `;

  // Full-tile glow overlay in matching light blue
  const glowStyle: React.CSSProperties = {
    background:
      "linear-gradient(135deg, rgba(96,165,250,0.75), rgba(96,165,250,0.55))",
  };

  const overlayTarget =
    highlighted && !hovered
      ? phase === "in" || phase === "hold"
        ? 0.9
        : phase === "out"
        ? 0
        : 0
      : 0;

  return (
    <motion.button
      type="button"
      className="group absolute overflow-hidden rounded-2xl focus:outline-none"
      animate={{ width, height, left: l, top: t }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      style={{
        width: tileW,
        height: tileH,
        left,
        top,
        zIndex: interactive && hovered ? baseZ + 10 : baseZ,
        opacity: forcedOpacity ?? 1,
        pointerEvents: interactive ? "auto" : "none",
        background: "transparent",
      }}
      aria-hidden={!interactive}
    >
      {/* Full-tile glow overlay (matches border color) */}
      <motion.div
        className="absolute inset-0 rounded-2xl z-[25] mix-blend-screen pointer-events-none"
        style={glowStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: overlayTarget }}
        transition={{
          duration: overlayTarget > 0 ? fadeInMs / 1000 : fadeOutMs / 1000,
          ease: "easeInOut",
        }}
      />

      {/* New 4px light blue border */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "1rem",
          padding: "2px",
          background: blueBorder,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
          opacity: 0.8,
        }}
      />

      {/* Video */}
      {interactive && clip && (
<motion.video
  ref={videoRef}
  src={clip.videoSrc}
  poster={clip.posterSrc}
  muted
  loop
  playsInline
  controls={false}
  className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none rounded-2xl"
  style={{
    transform: "scale(1.2)",
    transformOrigin: "center center",
  }}
  animate={{ opacity: hovered ? 1 : 0 }}
  transition={{ duration: hovered ? 0.2 : 0.3, ease: "easeInOut" }}
/>

      )}

      {/* Labels */}
      {interactive && clip && (
        <motion.div
          className="absolute inset-0 z-30 grid place-items-center text-center pointer-events-none"
          animate={{ opacity: hovered ? 0 : 1 }}
          transition={{ duration: hovered ? 0.2 : 0.3, ease: "easeInOut" }}
        >
          <div className="px-3">
            <div className="text-[11px] tracking-[0.18em] text-white/70 uppercase mb-1">
              {clip.tag ?? "Example"}
            </div>
            <div className="text-base md:text-[17px] font-semibold text-white/90">
              {clip.title}
            </div>
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

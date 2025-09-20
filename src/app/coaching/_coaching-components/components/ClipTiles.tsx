"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ClipData } from "@/lib/coaching/clips.data";

type ClipTilesProps = {
  data: ClipData[];
  cols?: number;
  rows?: number;
  rings?: number;
  gap?: string;
  bleed?: string;
  className?: string;
};

export default function ClipTiles({
  data,
  cols = 3,
  rows = 2,
  rings = 2,
  gap = "12px",
  bleed = "15vw",
  className = "",
}: ClipTilesProps) {
  const gridCols = cols + rings * 2;
  const gridRows = rows + rings * 2;

  return (
    <div
      className={`relative w-full aspect-video overflow-visible ${className}`}
      style={{ ["--gap" as any]: gap, ["--bleed" as any]: bleed } as React.CSSProperties}
    >
      {/* DECORATIVE RINGS */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          inset: "calc(var(--bleed) * -1)",
          WebkitMaskImage:
            "radial-gradient(closest-side at 50% 50%, white 72%, transparent 100%)",
          maskImage:
            "radial-gradient(closest-side at 50% 50%, white 72%, transparent 100%)",
        }}
        aria-hidden
      >
        {renderDecorativeTiles({ gridCols, gridRows, rings, cols, rows })}
      </div>

      {/* CORE 3×2 CLIPS */}
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
              forcedOpacity={1} // fully opaque
            />
          );
        })}
      </div>
    </div>
  );
}

function renderDecorativeTiles({
  gridCols,
  gridRows,
  rings,
  cols,
  rows,
}: {
  gridCols: number;
  gridRows: number;
  rings: number;
  cols: number;
  rows: number;
}) {
  const tileW = `calc((100% - ${(gridCols - 1)} * var(--gap)) / ${gridCols})`;
  const tileH = `calc((100% - ${(gridRows - 1)} * var(--gap)) / ${gridRows})`;

  const coreLeft = rings;
  const coreTop = rings;
  const coreRight = rings + cols - 1;
  const coreBottom = rings + rows - 1;

  const tiles: React.ReactNode[] = [];

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const inCore = r >= coreTop && r <= coreBottom && c >= coreLeft && c <= coreRight;
      if (inCore) continue;

      const dRow = r < coreTop ? coreTop - r : r > coreBottom ? r - coreBottom : 0;
      const dCol = c < coreLeft ? coreLeft - c : c > coreRight ? c - coreRight : 0;
      const ring = dRow + dCol;
      if (ring < 1 || ring > rings) continue;

      const ringOpacity = ring === 1 ? 0.45 : 0.12;

      const left = `calc((${tileW} + var(--gap)) * ${c})`;
      const top = `calc((${tileH} + var(--gap)) * ${r})`;

      tiles.push(
        <ClipTile
          key={`dec-${r}-${c}`}
          clip={null}
          pos={{ left, top, tileW, tileH }}
          interactive={false}
          baseZ={1}
          forcedOpacity={ringOpacity}
        />
      );
    }
  }

  return tiles;
}

function ClipTile({
  clip,
  pos,
  interactive,
  baseZ = 1,
  forcedOpacity,
}: {
  clip: ClipData | null;
  pos: { left: string; top: string; tileW: string; tileH: string };
  interactive: boolean;
  baseZ?: number;
  forcedOpacity?: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const { left, top, tileW, tileH } = pos;

  const onHoverStart = () => {
    if (!interactive) return;
    setHovered(true);
    setAnimatingOut(false);
    videoRef.current?.play().catch(() => {});
  };
  const onHoverEnd = () => {
    if (!interactive) return;
    setHovered(false);
    setAnimatingOut(true);
    videoRef.current?.pause();
  };

  const width = interactive && hovered ? "100%" : tileW;
  const height = interactive && hovered ? "100%" : tileH;
  const l = interactive && hovered ? "0%" : left;
  const t = interactive && hovered ? "0%" : top;

  // ✅ unified gradient for all tiles
  const defaultGradient =
    "linear-gradient(135deg, rgba(90,150,250,0.6) 0%, rgba(40,80,160,0.6) 100%)";

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
      }}
      aria-hidden={!interactive}
    >
      {/* Gradient layer */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: defaultGradient,
          boxShadow: `
            inset 0 0 14px rgba(0,0,0,.28),
            0 6px 18px rgba(0,0,0,.35),
            inset 0 1px 0 rgba(255,255,255,.04)
          `,
        }}
      />

      {/* Texture layer */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          backgroundImage: "url('/images/coaching/texture3.jpg')",
          backgroundRepeat: "repeat",
          backgroundSize: "auto",
          mixBlendMode: "overlay",
          opacity: 0.28,
          filter: "contrast(1.08) brightness(1.03)",
        }}
      />

      {/* Gradient border */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          padding: "1px",
          background:
            interactive && (hovered || animatingOut)
              ? "linear-gradient(180deg, rgba(160,200,255,.35), rgba(86,140,220,.25))"
              : "linear-gradient(180deg, rgba(160,200,255,.2), rgba(86,140,220,.12))",
          borderRadius: "1rem",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
        }}
        aria-hidden
      />

      {/* VIDEO (only for interactive core) */}
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
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: hovered ? 0.2 : 0.3, ease: "easeInOut" }}
        />
      )}

      {/* LABELS only on interactive */}
      {interactive && clip && (
        <div className="absolute inset-0 z-10 grid place-items-center text-center pointer-events-none">
          <div className="px-3">
            <div className="text-[11px] tracking-[0.18em] text-white/60 uppercase mb-1">
              {clip.tag ?? "Example"}
            </div>
            <div className="text-base md:text-[17px] font-semibold text-white/90">
              {clip.title}
            </div>
            {clip.subtitle && (
              <div className="mt-1 text-[12px] text-white/70">{clip.subtitle}</div>
            )}
          </div>
        </div>
      )}
    </motion.button>
  );
}

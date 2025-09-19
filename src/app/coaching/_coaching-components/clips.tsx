"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type Clip = {
  id: string;
  title: string;
  subtitle?: string;
  videoSrc: string;
  posterSrc?: string;
  tag?: string;
};

type Props = {
  className?: string;
  containerClassName?: string;
  heading?: string;
  subheading?: string;
  clips?: Clip[];
};

export default function Clips({
  className = "",
  containerClassName = "max-w-7xl",
  heading = "See what good looks like",
  subheading = "Understand what the game looks like when played right, not just what you're doing wrong.",
  clips,
}: Props) {
  const data = useMemo<Clip[]>(
    () =>
      clips && clips.length
        ? clips
        : Array.from({ length: 6 }, (_, i) => ({
            id: `clip-${i}`,
            title: `Placeholder ${i + 1}`,
            subtitle: "Demo",
            videoSrc: "/videos/coaching/clips/Placeholder_Pyke.mp4",
            posterSrc: "/clips/posters/akali.jpg",
            tag: "Mechanics",
          })),
    [clips]
  );

  return (
    <section className={`w-full ${className}`} aria-labelledby="clips-heading">
      <div className={`mx-auto w-full ${containerClassName}`}>
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 id="clips-heading" className="mt-0 text-[40px] md:text-[52px] leading-tight font-bold">
            {heading}
          </h2>
          <p className="mt-3 text-base md:text-xl text-white/70 max-w-3xl mx-auto">
            {subheading}
          </p>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
          {/* LEFT: 16:9 stage with 3x2 expanding tiles */}
          <div
            className="md:col-span-6 relative w-full aspect-video rounded-2xl overflow-hidden"
            style={{ ["--gap" as any]: "12px" } as React.CSSProperties}
          >
            {data.map((clip, i) => (
              <ClipTile key={clip.id} clip={clip} index={i} cols={3} rows={2} />
            ))}
          </div>

          {/* RIGHT: explainer */}
          <div className="md:col-span-6">
            <p className="text-[10px] tracking-[0.22em] text-white/50 uppercase">
              Teaching tool
            </p>
            <h3 className="mt-2 text-2xl md:text-3xl font-semibold">
              Library of clips
            </h3>
            <p className="mt-3 text-white/70 text-base md:text-lg max-w-[50ch]">
              Instead of only telling you what to do, I show you what it should look like in game.
              Short clips demonstrate the timing, spacing, and decisions behind clean execution—
              so you can visualize it first, then replicate it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Expanding tile with column-based hue variations */
function ClipTile({
  clip,
  index,
  cols,
  rows,
}: {
  clip: Clip;
  index: number;
  cols: number;
  rows: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const col = index % cols;
  const row = Math.floor(index / cols);

  const tileW = `calc((100% - ${(cols - 1)} * var(--gap)) / ${cols})`;
  const tileH = `calc((100% - ${(rows - 1)} * var(--gap)) / ${rows})`;
  const left = `calc((${tileW} + var(--gap)) * ${col})`;
  const top = `calc((${tileH} + var(--gap)) * ${row})`;

  const onHoverStart = () => {
    setHovered(true);
    setAnimatingOut(false);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };
  const onHoverEnd = () => {
    setHovered(false);
    setAnimatingOut(true);
    videoRef.current?.pause();
  };

  const wrapperZ = hovered || animatingOut ? 30 : 1;

  // Balanced blue hues per column
  const gradients = [
    // Column 0: cyan-blue
    "linear-gradient(180deg, rgba(90,160,200,.70) 0%, rgba(70,140,180,.70) 100%)",
    // Column 1: neutral blue
    "linear-gradient(180deg, rgba(80,130,200,.70) 0%, rgba(60,110,180,.70) 100%)",
    // Column 2: indigo-blue
    "linear-gradient(180deg, rgba(100,110,200,.70) 0%, rgba(80,90,170,.70) 100%)",
  ];
  const gradient = gradients[col % gradients.length];

  return (
    <motion.button
      type="button"
      className="group absolute overflow-hidden rounded-2xl focus:outline-none"
      animate={{
        width: hovered ? "100%" : tileW,
        height: hovered ? "100%" : tileH,
        left: hovered ? "0%" : left,
        top: hovered ? "0%" : top,
      }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onAnimationComplete={() => {
        if (!hovered) setAnimatingOut(false);
      }}
      style={{
        width: tileW,
        height: tileH,
        left,
        top,
        zIndex: wrapperZ,
        willChange: "width,height,left,top",
      }}
    >
      {/* ---- PANEL SURFACE ---- */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          backgroundImage: `
            ${gradient},
            url('/images/coaching/texture3.jpg')
          `,
          backgroundBlendMode: "overlay",
          backgroundRepeat: "no-repeat, repeat",
          backgroundSize: "cover, auto",
          backgroundPosition: "center, center",
          boxShadow:
            "0 6px 18px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)",
        }}
      />

      {/* Gradient border */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          padding: "1px",
          background:
            hovered || animatingOut
              ? "linear-gradient(180deg, rgba(160,200,255,.65), rgba(86,140,220,.5))"
              : "linear-gradient(180deg, rgba(160,200,255,.45), rgba(86,140,220,.32))",
          borderRadius: "1rem",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          opacity: 1,
        }}
        aria-hidden
      >
        <div className="w-full h-full rounded-[calc(1rem-1px)]" style={{ background: "transparent" }} />
      </div>

      {/* VIDEO */}
      <motion.video
        ref={videoRef}
        src={clip.videoSrc}
        poster={clip.posterSrc}
        muted
        loop
        playsInline
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none rounded-2xl"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: hovered ? 0.2 : 0.3, ease: "easeInOut" }}
      />

      {/* LABELS */}
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
    </motion.button>
  );
}

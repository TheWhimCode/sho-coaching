// coaching/_coaching-components/SessionSummaryCard.tsx
"use client";

import React from "react";
import type { Preset } from "@/lib/survey/presets";
import { colorsByPreset } from "@/lib/sessions/colors";

type Props = {
  preset: Preset;
  onRetake?: () => void;
  onSchedule?: () => void;
};

type Detail = {
  title: string;
  desc: string;
  img: string;
  price: string;
  duration: string;
};

const DETAILS: Record<Preset, Detail> = {
  signature: {
    title: "Signature",
    desc:
      "Structured and designed by Sho to help you climb the maximum amount. Learn how to fix your most impactful bad habits. Progress. And then request your follow-up recording to stay focused and motivated.",
    img: "/images/sessions/Signature3.png",
    price: "€45",
    duration: "45 min + Follow-up",
  },
  vod: {
    title: "VOD Review",
    desc:
      "Go on a deep dive, analyze your bad habits and identify in which order to approach them. Learn about your champion, the map and the game and how to use them to your advantage.",
    img: "/images/sessions/VOD7.png",
    price: "€40",
    duration: "60 min",
  },
  instant: {
    title: "Instant Insight",
    desc:
      "Short, targeted session to unlock a specific bottleneck. Perfect at the start of a tilt spiral or to sanity-check a matchup or specific game period. Also amazing if you're a beginner and want some direction.",
    img: "/images/sessions/Instant4.png",
    price: "€20",
    duration: "30 min",
  },
  custom: {
    title: "Custom Session",
    desc:
      "Customize your session. Whether it's in-game coaching, a two hour session or multiple follow-ups, you can adjust the session to match exactly what you're looking for. Perfect for unique requests.",
    img: "/images/sessions/Custom2.png",
    price: "Varies",
    duration: "Flexible",
  },
};

export default function SessionSummaryCard({ preset, onRetake, onSchedule }: Props) {
  const { title, desc, img, price, duration } = DETAILS[preset];

  // Pull brand colors, but override to pure white for Custom, including the glow/accent.
  const brand = colorsByPreset[preset];
  const ring = preset === "custom" ? "#ffffff" : brand.ring;
  const glow = preset === "custom" ? "rgba(255,255,255,0.38)" : brand.glow;

  // Button color: match session; for custom, button is solid white.
  const scheduleBg = ring;
  const scheduleText = preset === "custom" ? "#0A0A0A" : "#0A0A0A"; // dark text works across these fills

  return (
    <div
      className="relative rounded-2xl p-[1px] shadow-[0_6px_24px_rgba(0,0,0,0.3)]"
      style={{
        background: `linear-gradient(135deg, ${ring} 0%, transparent 60%)`,
        boxShadow: glow
          ? `0 6px 24px rgba(0,0,0,0.3), 0 0 28px ${glow}`
          : undefined,
      }}
    >
      {/* Two-piece layout so no border overlays the image */}
      <div className="flex items-stretch min-h-[12rem] overflow-hidden rounded-2xl">
        {/* LEFT: glass panel with border (no border on the right) */}
        <div className="relative flex-1 min-w-0 bg-white/[.04] backdrop-blur-sm border border-white/10 border-r-0 rounded-l-2xl text-left px-6 md:px-8 py-4 md:py-6">
          {/* readability scrim behind text */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-black/35 via-black/25 to-transparent" />

          {/* content stack */}
          <div className="relative z-10 h-full flex flex-col">
            {/* header */}
            <div className="flex items-baseline justify-between gap-3">
              <div className="inline-flex items-baseline gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full translate-y-[1px]"
                  style={{ backgroundColor: ring }}
                />
                <h3 className="text-white text-lg md:text-xl font-semibold tracking-tight leading-tight">
                  {title}
                </h3>
              </div>
              <div className="flex items-baseline gap-2 text-[13px] md:text-sm">
                <span className="inline-flex items-center rounded-lg border border-white/15 bg-black/25 px-2.5 py-1 text-white/90 leading-none">
                  {price}
                </span>
                <span className="inline-flex items-center rounded-lg border border-white/15 bg-black/25 px-2.5 py-1 text-white/90 leading-none whitespace-nowrap">
                  {duration}
                </span>
              </div>
            </div>

            {/* body */}
            <p className="mt-2 max-w-prose text-[15px] md:text-base leading-relaxed text-white/90">
              {desc}
            </p>

            {/* actions pinned at bottom */}
            <div className="mt-auto pt-4 md:pt-5 flex items-center gap-2">
              <button
                onClick={onSchedule}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor: scheduleBg,
                  color: scheduleText,
                  boxShadow: glow ? `0 8px 24px ${glow}` : undefined,
                }}
              >
                Schedule
              </button>
              {onRetake && (
                <button
                  onClick={onRetake}
                  className="rounded-xl px-4 py-2 text-sm border border-white/20 hover:border-white/30 text-white bg-white/[.05] hover:bg-white/[.08] transition"
                >
                  Retake survey
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: image (no divider / no overlay border) */}
        <div className="relative flex-none shrink-0 rounded-r-2xl overflow-hidden min-w-[200px] sm:min-w-[240px] md:min-w-[260px] aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

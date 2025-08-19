"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  title?: string;
  minutes: number;             // 30..120 (15-min steps)
  priceEUR: number;
  followups?: number;          // 0..2 (15m each)
  isActive?: boolean;
  background?: "transparent" | string;
  className?: string;
  layoutId?: string;
  liveBlocks?: number;         // 0..2 (each 45m => 3 green ticks)
};

// --- single source of truth for tick size (kept as-is) ---
const TICK_W = 44;
const TICK_H = 8;
const TOTAL_TICKS = 6; // 0..6 -> 30..120
const INGAME = { ring: "#59F38D", glow: "rgba(89,243,141,.55)" }; // neon green

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function getPreset(minutes: number, followups = 0) {
  if (minutes === 60 && followups === 0) return "vod";
  if (minutes === 30 && followups === 0) return "quick";
  if (minutes === 45 && followups === 1) return "signature";
  return "custom";
}
type Preset = ReturnType<typeof getPreset>;

function colors(preset: Preset) {
  switch (preset) {
    case "quick":     return { ring: "#F8D34B", glow: "rgba(248,211,75,.65)" };   // yellow
    case "signature": return { ring: "#F87171", glow: "rgba(248,113,113,.65)" };  // red
    case "vod":
    default:          return { ring: "#69A8FF", glow: "rgba(105,168,255,.65)" };  // blue
  }
}

/** Small top-right emblem per preset (inline SVG, no deps). */
function SessionIcon({
  preset,
  color,
  glow,
}: {
  preset: Preset;
  color: string;
  glow: string;
}) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    style: { filter: `drop-shadow(0 0 6px ${glow})` },
  } as const;

  if (preset === "vod") {
    // crosshair / focus
    return (
      <svg {...common} aria-hidden>
        <circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth="1.75" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }
  if (preset === "quick") {
    // lightning bolt
    return (
      <svg {...common} aria-hidden>
        <path d="M13 2L6 13h5l-1 9 7-11h-5l1-9Z" fill={color} opacity=".9" />
      </svg>
    );
  }
  if (preset === "signature") {
    // flame
    return (
      <svg {...common} aria-hidden>
        <path
          d="M12 3c1.5 2.2 2 3.9 2 5.2 0 1.6-.7 2.7-1.9 3.5.2-1.6-.5-3.2-2.1-4.7-.2 1.3-.7 2.3-1.5 3.1C7.5 11.1 7 12.1 7 13.5 7 16.5 9.2 19 12 19s5-2.5 5-5.5c0-3.5-2.3-6-5-10.5Z"
          fill={color}
          opacity=".9"
        />
      </svg>
    );
  }
  // custom: sparkle
  return (
    <svg {...common} aria-hidden>
      <path d="M12 4l1.2 2.6L16 8l-2.8 1.4L12 12l-1.2-2.6L8 8l2.8-1.4L12 4Z" fill={color} />
      <path d="M18 12l.7 1.6L20 14l-1.3.4L18 16l-.7-1.6L16 14l1.3-.4L18 12Z" fill={color} opacity=".9" />
    </svg>
  );
}

export default function SessionBlock({
  title,
  minutes,
  priceEUR,
  followups = 0,
  isActive = false,
  background = "transparent",
  className = "",
  layoutId,
  liveBlocks = 0,
}: Props) {
  const preset = getPreset(minutes, followups);
  const { ring, glow } = colors(preset);

  // ticks: 0..6 where 0=30m, 6=120m
  const litTicks = useMemo(() => {
    const raw = Math.round((minutes - 30) / 15);
    return clamp(raw, 0, TOTAL_TICKS);
  }, [minutes]);

  // 3 green ticks per 45m block; limited by lit ticks (and 6 total)
  const greenTicks = useMemo(() => {
    return clamp(liveBlocks * 3, 0, litTicks);
  }, [liveBlocks, litTicks]);

  // Fixed labels for presets; everything else is Custom
  const displayTitle =
    preset === "vod"
      ? "VOD Review"
      : preset === "quick"
      ? "Quick Counseling"
      : preset === "signature"
      ? "Signature Session"
      : "Custom Session";

  // Pulse only when we *enter* a named preset
  const prevPreset = useRef(preset);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    const before = prevPreset.current;
    prevPreset.current = preset;
    const named = preset === "vod" || preset === "quick" || preset === "signature";
    if (named && before !== preset) setPulseKey((k) => k + 1);
  }, [preset]);

  return (
    <div
      className={[
        "relative rounded-2xl ring-1 p-5",
        "bg-[rgba(9,14,25,0.85)] ring-[rgba(146,180,255,.18)]",
        background === "transparent" ? "" : background,
        className,
      ].join(" ")}
      {...(layoutId ? { "data-framer-layout-id": layoutId } : {})}
      style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,.35), 0 10px 30px rgba(0,0,0,.35)" }}
    >
      {/* Top-right emblem */}
      <div className="pointer-events-none absolute right-4 top-3">
        <SessionIcon preset={preset} color={ring} glow={glow} />
      </div>

      {/* Expanding ring pulse (kept center, stays inside) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {preset !== "custom" && (
          <>
            <motion.div
              key={`main-${pulseKey}`}
              initial={{ opacity: 0.95, scale: 0.28 }}
              animate={{ opacity: 0, scale: 4.6 }}
              transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 140,
                height: 140,
                borderRadius: 9999,
                border: `6px solid ${ring}`,
                boxShadow: `0 0 40px ${glow}, 0 0 80px ${glow}`,
                filter: "blur(0.25px)",
              }}
            />
            <motion.div
              key={`echo-${pulseKey}`}
              initial={{ opacity: 0.45, scale: 0.4 }}
              animate={{ opacity: 0, scale: 5.2 }}
              transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 140,
                height: 140,
                borderRadius: 9999,
                border: `2px solid ${ring}`,
                boxShadow: `0 0 28px ${glow}`,
                filter: "blur(0.4px)",
              }}
            />
          </>
        )}
      </div>

      {/* Header */}
      <div className="text-xs uppercase tracking-wide text-white/65 mb-2">Session</div>
      <h3 className="text-2xl font-extrabold tracking-tight">{displayTitle}</h3>

      {/* Meta */}
      <div className="mt-8 flex items-center justify-between text-[15px] font-semibold">
        <span className="text-white/90">{minutes} min</span>
        <span className="text-white/90">€{priceEUR}</span>
      </div>

      {/* Ticks (unchanged geometry) */}
      <div className="mt-3">
        <div className="flex gap-2 items-center">
          {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
            const isLit = i < litTicks;
            const isGreen = i < greenTicks; // first N positions are green

            return (
              <div
                key={i}
                className="rounded-full ring-1 transition-all duration-200"
                style={{
                  width: TICK_W,
                  height: TICK_H,
                  backgroundColor: isLit
                    ? (isGreen ? INGAME.ring : ring)
                    : "rgba(255,255,255,0.12)",
                  borderColor: isLit ? "transparent" : "rgba(255,255,255,0.18)",
                  boxShadow: isLit
                    ? (isGreen ? `0 2px 10px ${INGAME.glow}` : `0 2px 10px ${glow}`)
                    : "none",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

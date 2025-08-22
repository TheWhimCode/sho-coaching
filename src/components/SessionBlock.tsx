// components/SessionBlock.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getPreset, type Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";

type Props = {
  title?: string;
  /** Base live minutes (not including in-game blocks) */
  minutes: number;             // 30..120 (15-min steps)
  priceEUR: number;
  followups?: number;          // 0..2 (15m each)
  isActive?: boolean;
  background?: "transparent" | string;
  className?: string;
  layoutId?: string;
  /** Number of 45m in-game blocks (0..2) */
  liveBlocks?: number;
};

// --- tick sizing (single source of truth) ---
const TICK_W = 44;
const TICK_H = 8;
const TOTAL_TICKS = 6; // 0..6 -> 30..120

// in-game visual color (kept white/greenish but animated)
const INGAME = { ring: "#59F38D", glow: "rgba(89,243,141,.55)" };

const clampN = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

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
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    style: { filter: `drop-shadow(0 0 8px ${glow})` },
  } as const;

  if (preset === "vod") {
    return (
      <svg {...common} aria-hidden>
        <circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth="1.75" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }
  if (preset === "instant") {
    return (
      <svg {...common} aria-hidden>
        <path d="M13 2L6 13h5l-1 9 7-11h-5l1-9Z" fill={color} opacity=".95" />
      </svg>
    );
  }
  if (preset === "signature") {
    return (
      <svg {...common} aria-hidden>
        <path
          d="M12 3c1.5 2.2 2 3.9 2 5.2 0 1.6-.7 2.7-1.9 3.5.2-1.6-.5-3.2-2.1-4.7-.2 1.3-.7 2.3-1.5 3.1C7.5 11.1 7 12.1 7 13.5 7 16.5 9.2 19 12 19s5-2.5 5-5.5c0-3.5-2.3-6-5-10.5Z"
          fill={color}
          opacity=".95"
        />
      </svg>
    );
  }
  // custom: sparkle
  return (
    <svg {...common} aria-hidden>
      <path d="M12 4l1.2 2.6L16 8l-2.8 1.4L12 12l-1.2-2.6L8 8l2.8-1.4L12 4Z" fill={color} />
      <path d="M18 12l.7 1.6L20 14l-1.3.4L18 16l-.7-1.6L16 14l1.3-.4L18 12Z" fill={color} opacity=".95" />
    </svg>
  );
}

export default function SessionBlock({
  title,
  minutes,        // base minutes
  priceEUR,
  followups = 0,
  isActive = false,
  background = "transparent",
  className = "",
  layoutId,
  liveBlocks = 0,
}: Props) {
  // TOTAL minutes (drives ticks + display)
  const totalMinutes = minutes + liveBlocks * 45;

  // pick preset + colors based on TOTAL and followups
  const preset = getPreset(totalMinutes, followups);
  const { ring, glow } = colorsByPreset[preset];

  // ticks: 0..6 where 0=30m, 6=120m — from TOTAL minutes
  const litTicks = useMemo(() => {
    const raw = Math.round((totalMinutes - 30) / 15);
    return clampN(raw, 0, TOTAL_TICKS);
  }, [totalMinutes]);

  // in-game contributes green ticks (3 per block), capped by litTicks
  const greenTicks = useMemo(
    () => clampN(liveBlocks * 3, 0, litTicks),
    [liveBlocks, litTicks]
  );

  const displayTitle =
    preset === "vod"       ? "VOD Review" :
    preset === "instant"   ? "Instant Insight" :
    preset === "signature" ? "Signature Session" :
    "Custom Session";

  // Expanding ring pulse on preset change
  const prevPreset = useRef(preset);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    const before = prevPreset.current;
    prevPreset.current = preset;
    if (before !== preset) setPulseKey((k) => k + 1);
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

      {/* Expanding ring pulse (softer, starts at 0) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {preset !== "custom" && (
          <>
            {/* main pulse */}
            <motion.div
              key={`main-${pulseKey}`}
              initial={{ opacity: 0.9, scale: 0.001 }}
              animate={{ opacity: 0, scale: 4.8 }}
              transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 160,
                height: 160,
                borderRadius: 9999,
                background: `radial-gradient(closest-side, transparent 60%, ${ring} 62%, transparent 66%)`,
                filter: `blur(2px) drop-shadow(0 0 24px ${glow})`,
              }}
            />
            {/* echo pulse */}
            <motion.div
              key={`echo-${pulseKey}`}
              initial={{ opacity: 0.5, scale: 0.001 }}
              animate={{ opacity: 0, scale: 5.6 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 160,
                height: 160,
                borderRadius: 9999,
                background: `radial-gradient(closest-side, transparent 58%, ${ring} 60%, transparent 70%)`,
                filter: `blur(1px) drop-shadow(0 0 30px ${glow})`,
                opacity: 0.7,
              }}
            />
          </>
        )}
      </div>

      {/* Header */}
      <div className="text-xs uppercase tracking-wide text-white/65 mb-2">Session</div>
      <h3 className="text-2xl font-extrabold tracking-tight">{displayTitle}</h3>

      {/* Meta — show TOTAL minutes + tiny diamond + follow-ups (if any) */}
      <div className="mt-8 flex items-center justify-between text-[15px] font-semibold">
        <span className="text-white/90 flex items-center gap-2">
          {totalMinutes} min
          {followups > 0 && (
            <>
              <span className="inline-block align-middle w-[5px] h-[5px] rounded-sm bg-white/55" />
              <span className="text-white/85">
                Follow-up{followups > 1 ? ` ×${followups}` : ""}
              </span>
            </>
          )}
        </span>
        <span className="text-white/90">€{priceEUR}</span>
      </div>

      {/* Ticks — first `greenTicks` are animated in-game; remaining lit use the preset color */}
      <div className="mt-3">
        <div className="flex gap-2 items-center">
          {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
            const isLit = i < litTicks;
            const isGreen = i < greenTicks;

            return (
              <div
                key={i}
                className="relative rounded-full ring-1 transition-all duration-200"
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
              >
                {/* Subtle left→right motion ONLY on in-game ticks */}
                {isGreen && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 6px, transparent 6px 12px)",
                      mixBlendMode: "overlay",
                      opacity: 0.35,
                    }}
                    animate={{ backgroundPositionX: ["0%", "100%"] }}
                    transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

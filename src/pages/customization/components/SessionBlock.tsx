// components/SessionBlock.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getPreset, type Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";

type Props = {
  title?: string;
  minutes: number;
  priceEUR: number;
  followups?: number;
  /** True while the customize drawer is open */
  isActive?: boolean;
  background?: "transparent" | string;
  className?: string;
  layoutId?: string;
  liveBlocks?: number; // 0..2 (45m each)
};

const TICK_H = 8;
const TOTAL_TICKS = 6;
const clampN = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function SessionIcon({ preset, color, glow }: { preset: Preset; color: string; glow: string }) {
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
  return (
    <svg {...common} aria-hidden>
      <path d="M12 4l1.2 2.6L16 8l-2.8 1.4L12 12l-1.2-2.6L8 8l2.8-1.4L12 4Z" fill={color} />
      <path d="M18 12l.7 1.6L20 14l-1.3.4L18 16l-.7-1.6L16 14l1.3-.4L18 12Z" fill={color} opacity=".95" />
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
  const totalMinutes = minutes + liveBlocks * 45;
  const preset = getPreset(minutes, followups, liveBlocks);
  const { ring, glow } = colorsByPreset[preset];

  // Flip once on first customize; stays true while this component is mounted
  const [everActivated, setEverActivated] = useState(false);
  useEffect(() => {
    if (isActive && !everActivated) setEverActivated(true);
  }, [isActive, everActivated]);

  const showAffordance = isActive || everActivated; // controls texture + faint border

  const litTicks = useMemo(() => {
    const raw = Math.round((totalMinutes - 30) / 15);
    return clampN(raw, 0, TOTAL_TICKS);
  }, [totalMinutes]);

  const ingameTicks = useMemo(() => clampN(liveBlocks * 3, 0, litTicks), [liveBlocks, litTicks]);
  const ingameStart = Math.max(0, litTicks - ingameTicks);

  const displayTitle =
    preset === "vod" ? "VOD Review" :
    preset === "instant" ? "Instant Insight" :
    preset === "signature" ? "Signature Session" :
    "Custom Session";

  return (
    <div
      className={[
        "relative rounded-2xl p-5 transition-all duration-300",
        "bg-[#0A0B21]/10",
        isActive
          ? "backdrop-blur-[12px] backdrop-brightness-95 backdrop-saturate-90 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          : "backdrop-blur-[4px] shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
        className,
      ].join(" ")}
      {...(layoutId ? { "data-framer-layout-id": layoutId } : {})}
      style={{
        boxShadow: isActive ? "0 16px 40px rgba(0,0,0,.45)" : "0 10px 30px rgba(0,0,0,.25)",
      }}
    >
      {/* Micro-texture (appears on first customize and stays while mounted) */}
      {showAffordance && (
        <span
          aria-hidden
          className="
            pointer-events-none absolute inset-0 rounded-2xl opacity-[0.06]
            bg-[radial-gradient(rgba(255,255,255,1)_1px,transparent_1px)]
            [background-size:14px_14px]
          "
        />
      )}

      {/* Super faint border (same trigger as texture) */}
      {showAffordance && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10"
        />
      )}

      {/* Emblem */}
      <div className="pointer-events-none absolute right-4 top-3">
        <SessionIcon preset={preset} color={ring} glow={glow} />
      </div>

      {/* Header */}
      <div className="text-xs uppercase tracking-wide text-white/65 mb-2">Session</div>
      <h3 className="text-2xl font-extrabold tracking-tight">{displayTitle}</h3>

      {/* Meta */}
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

      {/* Ticks */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
            const isLit = i < litTicks;
            const isIngame = isLit && i >= ingameStart && i < litTicks;

            return (
              <div
                key={i}
                className="relative flex-1 rounded-full ring-1 overflow-hidden"
                style={{
                  height: TICK_H,
                  backgroundColor: isLit ? ring : "rgba(255,255,255,0.12)",
                  borderColor: isLit ? "transparent" : "rgba(255,255,255,0.18)",
                  boxShadow: isLit ? `0 2px 10px ${glow}` : "none",
                }}
              >
                {isIngame && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                          135deg,
                          rgba(0,0,0,0.28) 0 6px,
                          transparent 6px 12px
                        )`,
                        backgroundSize: "32px 32px",
                        opacity: 1,
                        mixBlendMode: "multiply",
                        willChange: "background-position",
                      }}
                      animate={{ backgroundPosition: ["0px 0px", "32px 0px"] }}
                      transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                          135deg,
                          rgba(255,255,255,0.16) 0 6px,
                          transparent 6px 12px
                        )`,
                        backgroundSize: "32px 32px",
                        opacity: 0.35,
                        mixBlendMode: "screen",
                        willChange: "background-position",
                      }}
                      animate={{ backgroundPosition: ["32px 0px", "0px 0px"] }}
                      transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

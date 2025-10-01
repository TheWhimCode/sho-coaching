// components/SessionBlock.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getPreset, type Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";

// Icon libs
import { Scroll, Lightning, PuzzlePiece, Signature } from "@phosphor-icons/react";
import BlazeFillIcon from "remixicon-react/BlazeFillIcon";

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
  /** Selected start time of the session (local Date) */
  selectedDate?: Date | null;
};

const TICK_H = 8;
const TOTAL_TICKS = 6;
const clampN = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function SessionIcon({
  preset,
  color,
  glow,
}: {
  preset: Preset;
  color: string;
  glow: string;
}) {
  const size = 26;
  const glowStyle = glow ? { filter: `drop-shadow(0 0 8px ${glow})` } : undefined;

  if (preset === "vod") {
    return <Scroll size={size} weight="fill" color={color} style={glowStyle} aria-hidden />;
  }
  if (preset === "instant") {
    return <Lightning size={size} weight="fill" color={color} style={glowStyle} aria-hidden />;
  }
  if (preset === "signature") {
    return <Signature size={size} weight="bold" color={color} style={glowStyle} aria-hidden />;
  }
  return <PuzzlePiece size={size} weight="fill" color={color} style={glowStyle} aria-hidden />;
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
  selectedDate = null,
}: Props) {
  const totalMinutes = minutes + liveBlocks * 45;
  const preset = getPreset(minutes, followups, liveBlocks);
  const { ring, glow } = colorsByPreset[preset];

  const [everActivated, setEverActivated] = useState(false);
  useEffect(() => {
    if (isActive && !everActivated) setEverActivated(true);
  }, [isActive, everActivated]);

  const showAffordance = isActive || everActivated;

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

  const dateLabel = useMemo(() => {
    if (!selectedDate) return null;
    try {
      return selectedDate.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [selectedDate]);

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
          className="pointer-events-none absolute inset-0 rounded-2xl bg-dottexture"
        />
      )}

      {/* Border: always on; stronger while customizing */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-2xl border transition-colors duration-300 ${
          showAffordance ? "border-white/10" : "border-white/5"
        }`}
      />

      {/* Emblem */}
      <div className="pointer-events-none absolute right-6 top-5">
        <SessionIcon preset={preset} color={ring} glow={glow} />
      </div>

      {/* Header row */}
      <div className="mb-2 flex items-center justify-between pr-10">
        <div className="text-xs uppercase tracking-wide text-white/65">
          {dateLabel ?? "Session"}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-extrabold tracking-tight">{displayTitle}</h3>

      {/* Meta */}
      <div className="mt-10 flex items-center justify-between text-[15px] font-semibold">
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

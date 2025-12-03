"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  computePriceWithProduct,
  totalMinutes,
  titlesByPreset,
  colorsByPreset,
  products,
  iconsByPreset,
} from "@/engine/session";

import type { SessionConfig, Preset } from "@/engine/session";

type Props = {
  session: SessionConfig;
  preset: Preset;
  isActive?: boolean;
  className?: string;
  layoutId?: string;
  selectedDate?: Date | null;
};

const TICK_H = 8;
const TOTAL_TICKS = 6;
const clampN = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export default function SessionBlock({
  session,
  preset,
  isActive = false,
  className = "",
  layoutId,
  selectedDate,
}: Props) {

  const { liveMin, followups, liveBlocks } = session;

  // unified color system
  const color = colorsByPreset[preset];
  const glow = color.glow;
  const isGradient = "gradient" in color;
  const ring = isGradient ? color.gradient : color.ring;

  const isBundle = preset === "rush";

  const total = totalMinutes(session);
  const { priceEUR: sessionPrice } = computePriceWithProduct(session);
  const title = titlesByPreset[preset];

  const p = session.productId ? products[session.productId] : undefined;

  const { icon: Icon, weight } = iconsByPreset[preset];

  const [everActivated, setEverActivated] = useState(false);
  useEffect(() => {
    if (isActive && !everActivated) setEverActivated(true);
  }, [isActive, everActivated]);

  const showAffordance = isActive || everActivated;

  const litTicks = useMemo(() => {
    if (isBundle) return TOTAL_TICKS;
    const raw = Math.round((total - 30) / 15);
    return clampN(raw, 0, TOTAL_TICKS);
  }, [total, isBundle]);

  const ingameTicks = isBundle
    ? 0
    : clampN(liveBlocks * 3, 0, litTicks);

  const ingameStart = isBundle
    ? TOTAL_TICKS
    : Math.max(0, litTicks - ingameTicks);

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
    >
      {showAffordance && (
        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-dottexture" />
      )}

      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-2xl border transition-colors duration-300 ${
          showAffordance ? "border-white/10" : "border-white/5"
        }`}
      />

      {/* ICON (always solid fallback color) */}
      <div className="pointer-events-none absolute right-6 top-5">
        <svg width="26" height="26" style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
          <Icon
            size={26}
            weight={weight}
            color={color.ring}
          />
        </svg>
      </div>

      <div className="mb-2 flex items-center justify-between pr-10">
        <div className="text-xs uppercase tracking-wide text-white/65">
          {dateLabel ?? "Session"}
        </div>
      </div>

      <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>

      <div className="mt-10 flex items-center justify-between text-[15px] font-semibold">
        <span className="text-white/90 flex items-center gap-2">
          {total} min
          {p?.sessionsCount && <span> ×{p.sessionsCount}</span>}

          {followups > 0 && (
            <>
              <span className="inline-block w-[5px] h-[5px] rounded-sm bg-white/55" />
              <span className="text-white/85">
                Follow-up{followups > 1 ? ` ×${followups}` : ""}
              </span>
            </>
          )}
        </span>

        <span className="text-white/90">€{sessionPrice}</span>
      </div>

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
                  background: isLit ? ring : "rgba(255,255,255,0.12)",
                  borderColor: isLit ? "transparent" : "rgba(255,255,255,0.18)",
                  boxShadow: isLit ? `0 2px 10px ${glow}` : "none",
                }}
              >
                {!isBundle && isIngame && (
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        135deg,
                        rgba(0,0,0,0.28) 0 6px,
                        transparent 6px 12px
                      )`,
                      backgroundSize: "32px 32px",
                    }}
                    animate={{
                      backgroundPosition: ["0px 0px", "32px 0px"],
                    }}
                    transition={{
                      duration: 1.4,
                      ease: "linear",
                      repeat: Infinity,
                    }}
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

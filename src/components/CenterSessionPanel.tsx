"use client";

import { motion } from "framer-motion";
import SessionBlock from "@/components/SessionBlock";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title?: string;
  baseMinutes: number;   // live minutes
  extraMinutes?: number; // +15 chunks already applied
  totalPriceEUR: number;
  isCustomizing?: boolean; // drawer state
  followups?: number;      // 0–2
  liveBlocks?: number;     // optional
};

/* ---------- preset detection (mirrors SessionBlock) ---------- */
function getPreset(minutes: number, followups = 0) {
  if (minutes === 60 && followups === 0) return "vod" as const;
  if (minutes === 30 && followups === 0) return "quick" as const;
  if (minutes === 45 && followups === 1) return "signature" as const;
  return "custom" as const;
}
type Preset = ReturnType<typeof getPreset>;

/* ---------- palette (same as SessionBlock) ---------- */
/** Toggle: use a distinct color for Custom instead of VOD blue */
const CUSTOM_HAS_OWN_COLOR = true;

function presetColors(preset: "quick" | "signature" | "vod" | "custom") {
  switch (preset) {
    case "quick":     return { ring: "#F8D34B", glow: "rgba(248,211,75,.65)" };   // yellow
    case "signature": return { ring: "#F87171", glow: "rgba(248,113,113,.65)" };  // red
    case "vod":       return { ring: "#69A8FF", glow: "rgba(105,168,255,.65)" };  // blue
    case "custom":
    default:
      // neutral steel (subtle, non-presety)
      return { ring: "rgba(255,255,255,0.28)", glow: "rgba(255,255,255,0.16)" };
  }
}


/* ---------- stat rules (your spec) ---------- */
function depthOfInsight(min: number): 1|2|3|4|5 {
  if (min <= 30) return 2;
  if (min <= 45) return 3;
  if (min <= 75) return 4;
  return 5; // 90–120
}
function clarityStructure(min: number, preset: Preset): 1|2|3|4|5 {
  if (preset === "signature") return 5;
  if (min <= 45) return 4;
  if (min <= 75) return 3;
  if (min <= 105) return 2;
  return 1;
}
function lastingImpact(min: number, followups: number): 1|2|3|4|5 {
  let base: 1|2|3 = (min <= 30 ? 1 : min <= 45 ? 2 : 3);
  const withFU = Math.min(5, base + Math.max(0, Math.min(2, followups)));
  return withFU as 1|2|3|4|5;
}
function flexibility(preset: Preset): 1|2|3|4|5 {
  if (preset === "quick") return 1;
  if (preset === "signature") return 1;
  if (preset === "vod") return 2;
  return 5; // custom
}

/* ---------- prev hook ---------- */
function usePrevious<T>(v: T) {
  const ref = useRef(v);
  useEffect(() => { ref.current = v; }, [v]);
  return ref.current;
}

/* ---------- animated, color-coded pips ---------- */
function Pips({ value, ring, glow }: { value: number; ring: string; glow: string }) {
  const prev = (usePrevious(value) ?? value) as number;
  const rising = value > prev;

  const inactiveBg = "rgba(255,255,255,0.07)";
  const inactiveRing = "rgba(255,255,255,0.12)";

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => {
        const wasActive = i < prev;
        const isActive = i < value;

        let delay = 0;
        if (rising && isActive && !wasActive) delay = (i - prev) * 0.03;
        if (!rising && wasActive && !isActive) delay = (prev - 1 - i) * 0.03;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: isActive ? ring : inactiveBg,
              boxShadow: isActive ? `0 0 8px ${glow}` : "0 0 0 rgba(0,0,0,0)",
              scale: isActive ? 1 : 0.94,
              opacity: isActive ? 1 : 0.75,
            }}
            transition={{ duration: 0.18, delay: Math.max(0, delay) }}
            className="rounded-[5px] ring-1"
            style={{
              width: 14,
              height: 18,
              borderColor: isActive ? "transparent" : inactiveRing,
            }}
          />
        );
      })}
    </div>
  );
}

type StatRow = { label: string; value: number };
function StatRowAnimated({ label, value, ring, glow }: StatRow & { ring: string; glow: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[15px] text-white/90">{label}</span>
      <Pips value={value} ring={ring} glow={glow} />
    </div>
  );
}

/* ---------- main panel ---------- */
export default function CenterSessionPanel({
  title = "VOD Review",
  baseMinutes,
  extraMinutes = 0,
  totalPriceEUR,
  isCustomizing = false,
  followups = 0,
  liveBlocks = 0,
}: Props) {
  const minutes = baseMinutes + extraMinutes;
  const preset = getPreset(minutes, followups);
  const { ring, glow } = useMemo(() => presetColors(preset), [preset]);

  const stats: StatRow[] = [
    { label: "Depth of Insight",    value: depthOfInsight(minutes) },
    { label: "Clarity & Structure", value: clarityStructure(minutes, preset) },
    { label: "Lasting Impact",      value: lastingImpact(minutes, followups) },
    { label: "Flexibility",         value: flexibility(preset) },
  ];

  /* --- placeholder vs stats (unlock on first open) --- */
  const [statsUnlocked, setStatsUnlocked] = useState(false);
  const prevCustomizing = usePrevious(isCustomizing) ?? isCustomizing;

  // Show stats immediately on first open, then keep forever
  useEffect(() => {
    if (!statsUnlocked && isCustomizing && !prevCustomizing) setStatsUnlocked(true);
  }, [isCustomizing, prevCustomizing, statsUnlocked]);

  // Fixed height to avoid layout shift
  const STATS_AREA_HEIGHT = 150;

  const placeholder = (
    <div className="absolute inset-0">
      <div className="text-[12px] font-semibold tracking-wide uppercase text-white/65 mb-3">
        Session profile
      </div>
      <div className="space-y-2 text-sm text-white/80">
        <p>See what this session emphasizes at a glance:</p>
        <ul className="space-y-1 list-disc list-inside text-white/75">
          <li>Depth vs. structure</li>
          <li>What you’ll take away</li>
          <li>How flexible the format is</li>
        </ul>
      </div>
    </div>
  );

  const statsBlock = (
    <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
      <div className="text-[12px] font-semibold tracking-wide uppercase text-white/65 mb-3">
        Session profile
      </div>
      <div className="space-y-3">
        {stats.map((s) => (
          <StatRowAnimated key={s.label} {...s} ring={ring} glow={glow} />
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="relative w-full max-w-md">
      <div className="rounded-2xl backdrop-blur-md p-6 shadow-[0_10px_30px_rgba(0,0,0,.35)] bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)]">
        <SessionBlock
          title={title}
          minutes={minutes}
          priceEUR={totalPriceEUR}
          followups={followups}
          liveBlocks={liveBlocks}
          isActive={isCustomizing}
          background="transparent"
          className="p-0"
        />

        {/* Divider */}
        <div className="mt-4 mb-3 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />

        {/* Reserved area: placeholder until first open; stats appear on first open and persist */}
        <div style={{ height: STATS_AREA_HEIGHT }} className="relative">
          {statsUnlocked ? statsBlock : placeholder}
        </div>
      </div>
    </div>
  );
}

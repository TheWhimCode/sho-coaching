// components/HeroSection/CenterSessionPanel.tsx
"use client";

import SessionBlock from "@/pages/customization/components/SessionBlock";
import DualWipeLR from "@/components/DualWipeLR";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPreset, type Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";
import { computePriceEUR } from "@/lib/pricing";

/* ===================== Types ===================== */
type Props = {
  title?: string;
  baseMinutes: number;     // base live minutes (no in-game added)
  isCustomizing?: boolean; // drawer open/close
  followups?: number;      // 0–2
  liveBlocks?: number;     // number of 45m in-game blocks (0..2)
};

/* ===================== Stat Rules ===================== */
const clamp15 = (n: number) => Math.max(1, Math.min(5, n)) as 1|2|3|4|5;

function depthOfInsight(baseMin: number, liveBlocks: number): 1|2|3|4|5 {
  let v = baseMin <= 30 ? 2
        : baseMin <= 45 ? 3
        : baseMin <= 75 ? 4
        : 5;
  if (v === 2 && liveBlocks > 0) v = 3;
  return clamp15(v);
}

// UPDATED: cap of 4 only applies to the +1 from live blocks; signature remains 5 by default
function clarityStructure(baseMin: number, preset: Preset, liveBlocks: number): 1|2|3|4|5 {
  // Base clarity & structure
  let v = preset === "signature" ? 5
        : baseMin <= 45 ? 4
        : baseMin <= 75 ? 3
        : baseMin <= 105 ? 2
        : 1;

  // Live blocks add +1 ONLY if current value is 3 or less
  // (so 4 stays 4; signature stays 5)
  if (liveBlocks >= 1 && v <= 3) v += 1;

  return clamp15(v);
}

function lastingImpact(baseMin: number, followups: number, liveBlocks: number): 1|2|3|4|5 {
  const base = baseMin <= 30 ? 2 : 3;
  let v = base + Math.min(2, Math.max(0, followups));
  if (liveBlocks >= 2 && v <= 3) v += 1;
  return Math.max(1, Math.min(5, v)) as 1|2|3|4|5;
}

function flexibility(preset: Preset, liveBlocks: number): 1|2|3|4|5 {
  let v = preset === "instant" ? 1
        : preset === "signature" ? 1
        : preset === "vod" ? 3
        : 5; // custom
  v -= liveBlocks;
  return clamp15(v);
}

/* ===================== Hooks ===================== */
function usePrevious<T>(v: T) {
  const r = useRef(v);
  useEffect(() => { r.current = v; }, [v]);
  return r.current as T;
}

/* ===================== Icons ===================== */
function IconDepth({ color, glow, size = 18 }: { color: string; glow: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden
      style={{ color, filter: `drop-shadow(0 0 6px ${glow})` }}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" fill="none"/>
      <circle cx="12" cy="12" r="2.2" fill="currentColor"/>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconClarity({ color, glow, size = 18 }: { color: string; glow: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden
      style={{ color, filter: `drop-shadow(0 0 6px ${glow})` }}>
      <path d="M12 3l6 9-6 9-6-9 6-9z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  );
}
function IconImpact({ color, glow, size = 18 }: { color: string; glow: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden
      style={{ color, filter: `drop-shadow(0 0 6px ${glow})` }}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
      <path d="M12 7v5l4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function IconFlex({ color, glow, size = 18 }: { color: string; glow: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden
      style={{ color, filter: `drop-shadow(0 0 6px ${glow})` }}>
      <rect x="4" y="6"  width="10" height="2" rx="1" fill="currentColor" />
      <rect x="10" y="11" width="10" height="2" rx="1" fill="currentColor" />
      <rect x="6" y="16" width="8"  height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

/* ===================== UI Bits ===================== */
function Pips({ value, ring, glow }: { value: number; ring: string; glow: string }) {
  const prev = usePrevious(value) ?? value;
  const rising = value > prev;
  const inactiveBg = "rgba(255,255,255,0.07)";
  const inactiveRing = "rgba(255,255,255,0.12)";

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => {
        const was = i < (prev as number);
        const is  = i < value;
        let delay = 0;
        if (rising && is && !was) delay = (i - (prev as number)) * 0.03;
        if (!rising && was && !is) delay = ((prev as number) - 1 - i) * 0.03;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: is ? ring : inactiveBg,
              boxShadow: is ? `0 0 8px ${glow}` : "0 0 0 rgba(0,0,0,0)",
              scale: is ? 1 : 0.94,
              opacity: is ? 1 : 0.75,
            }}
            transition={{ duration: 0.18, delay: Math.max(0, delay) }}
            className="rounded-[5px] ring-1"
            style={{ width: 14, height: 18, borderColor: is ? "transparent" : inactiveRing }}
          />
        );
      })}
    </div>
  );
}

function StatRow({
  icon, label, value, ring, glow,
}: { icon: React.ReactNode; label: string; value: number; ring: string; glow: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-[15px] text-white/90">
        <span className="shrink-0">{icon}</span>
        {label}
      </span>
      <Pips value={value} ring={ring} glow={glow} />
    </div>
  );
}

/* ===================== Main ===================== */
export default function CenterSessionPanel({
  title = "VOD Review",
  baseMinutes,
  isCustomizing = false,
  followups = 0,
  liveBlocks = 0,
}: Props) {
  const baseOnly = baseMinutes;

  // Unified minutes (base + 45 per live block)
  const liveMinutes = useMemo(
    () => baseOnly + (liveBlocks ?? 0) * 45,
    [baseOnly, liveBlocks]
  );

  // Preset flips to custom if any live block is added
  const preset = useMemo(
    () => getPreset(baseOnly, followups, liveBlocks),
    [baseOnly, followups, liveBlocks]
  );
  const { ring, glow } = colorsByPreset[preset];

  // Dynamic price preview
  const pricePreview = useMemo(
    () => computePriceEUR(liveMinutes, followups).priceEUR,
    [liveMinutes, followups]
  );

  const stats = [
    { label: "Depth of Insight",    value: depthOfInsight(baseOnly, liveBlocks),           icon: <IconDepth  color={ring} glow={glow} /> },
    { label: "Clarity & Structure", value: clarityStructure(baseOnly, preset, liveBlocks), icon: <IconClarity color={ring} glow={glow} /> },
    { label: "Lasting Impact",      value: lastingImpact(baseOnly, followups, liveBlocks), icon: <IconImpact  color={ring} glow={glow} /> },
    { label: "Flexibility",         value: flexibility(preset, liveBlocks),                icon: <IconFlex    color={ring} glow={glow} /> },
  ];

  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const prevOpen = usePrevious(isCustomizing) ?? false;

  useEffect(() => {
    if (!revealed && !prevOpen && isCustomizing) {
      setRevealed(true);
      setPlaying(true);
    }
  }, [isCustomizing, prevOpen, revealed]);

  const STATS_AREA_HEIGHT = 160;

  const placeholder = (
    <>
      <div className="h-[18px] mb-3" />
      <div className="space-y-2 text-sm text-white/80">
        <p>Customize to reveal what this session emphasizes.</p>
        <ul className="space-y-1 list-disc list-inside text-white/75">
          <li>Depth vs. structure</li>
          <li>Expected lasting impact</li>
          <li>Format flexibility</li>
        </ul>
      </div>
    </>
  );

  const statsContent = (
    <>
      <div
        className="text-[12px] font-semibold tracking-wide uppercase mb-3"
        style={{ color: ring, filter: `drop-shadow(0 0 6px ${glow})` }}
      >
        Session profile
      </div>
      <div className="space-y-3">
        {stats.map((s) => (
          <StatRow key={s.label} icon={s.icon} label={s.label} value={s.value} ring={ring} glow={glow} />
        ))}
      </div>
    </>
  );

  return (
    <div className="relative w-full max-w-md">
      <div className="rounded-2xl backdrop-blur-[1px] p-6 bg-[#0B1220]/10 ring-1 ring-[rgba(146,180,255,.10)]">
        <SessionBlock
          title={title}
          minutes={baseOnly}
          priceEUR={pricePreview}
          followups={followups}
          liveBlocks={liveBlocks}
          isActive={isCustomizing}
          background="transparent"
          className="p-0"
        />

        <div className="mt-4 mb-3 h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        <div style={{ height: STATS_AREA_HEIGHT }} className="relative">
          {!revealed ? (
            <div className="absolute inset-0">{placeholder}</div>
          ) : playing ? (
            <DualWipeLR
              play
              onDone={() => setPlaying(false)}
              a={<div className="h-full">{placeholder}</div>}
              b={<div className="h-full">{statsContent}</div>}
            />
          ) : (
            <div className="absolute inset-0">{statsContent}</div>
          )}
        </div>
      </div>
    </div>
  );
}

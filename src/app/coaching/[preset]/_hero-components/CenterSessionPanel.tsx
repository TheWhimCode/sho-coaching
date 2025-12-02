"use client";

import SessionBlock from "@/app/coaching/[preset]/_hero-components/SessionBlock";
import DualWipeLR from "@/components/DualWipeLR";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  totalMinutes,
  colorsByPreset,
  computeSessionPrice,
  computePriceWithProduct,
} from "@/engine/session";

import type { SessionConfig, Preset } from "@/engine/session";

import GlassPanel from "@/app/_components/panels/GlassPanel";
import { Lightbulb, Layers, HeartPulse, Shuffle } from "lucide-react";

type Props = {
  title?: string;
  session: SessionConfig;
  preset: Preset;
  isCustomizing?: boolean;
  enterDelay?: number;
};

const clamp15 = (n: number) => Math.max(1, Math.min(5, n)) as 1 | 2 | 3 | 4 | 5;

function depthOfInsight(baseMin: number, liveBlocks: number) {
  let v =
    baseMin <= 30 ? 2
    : baseMin <= 45 ? 3
    : baseMin <= 75 ? 4
    : 5;
  if (v === 2 && liveBlocks > 0) v = 3;
  return clamp15(v);
}

function clarityStructure(baseMin: number, preset: Preset, liveBlocks: number) {
  let v =
    preset === "signature" ? 5
    : baseMin <= 45 ? 4
    : baseMin <= 75 ? 3
    : baseMin <= 105 ? 2
    : 1;

  if (liveBlocks >= 1 && v <= 3) v += 1;
  return clamp15(v);
}

function lastingImpact(baseMin: number, followups: number, liveBlocks: number) {
  const base = baseMin <= 30 ? 2 : 3;
  let v = base + Math.min(2, Math.max(0, followups));
  
  if (liveBlocks >= 2 && v <= 3) v += 1;
  return clamp15(v);
}

function flexibility(preset: Preset, liveBlocks: number) {
  let v =
    preset === "instant" ? 1
    : preset === "signature" ? 1
    : preset === "vod" ? 3
    : preset === "bundle_4x60" ? 5
    : 5;
  v -= liveBlocks;
  return clamp15(v);
}

function usePrevious<T>(v: T) {
  const r = useRef(v);
  useEffect(() => {
    r.current = v;
  }, [v]);
  return r.current as T;
}

function Pips({
  value,
  ring,
  glow,
  gradient,
}: {
  value: number;
  ring: string;
  glow: string;
  gradient?: string;
}) {
  const prev = usePrevious(value) ?? value;
  const inactiveBg = "rgba(255,255,255,0.07)";

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => {
        const is = i < value;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              background: is
                ? gradient ?? ring
                : inactiveBg,
              boxShadow: is ? `0 0 8px ${glow}` : "none",
              scale: is ? 1 : 0.94,
              opacity: is ? 1 : 0.75,
            }}
            transition={{ duration: 0.18 }}
            className="rounded-[5px] ring-1"
            style={{ width: 14, height: 18 }}
          />
        );
      })}
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  ring,
  glow,
  gradient,
}: {
  icon: any;
  label: string;
  value: number;
  ring: string;
  glow: string;
  gradient?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-[15px] text-white/90">
        <Icon size={16} style={{ color: ring }} />
        {label}
      </span>
      <Pips value={value} ring={ring} glow={glow} gradient={gradient} />
    </div>
  );
}

export default function CenterSessionPanel({
  title = "VOD Review",
  session,
  preset,
  isCustomizing = false,
  enterDelay = 0.05,
}: Props) {
  const liveMinutes = totalMinutes(session);

  const color = colorsByPreset[preset];
  const glow = color.glow;
  const isGradient = "gradient" in color;
  const ring = isGradient ? color.ring : color.ring;
  const gradient = isGradient ? color.gradient : undefined;

  const pricePreview = computePriceWithProduct(session).priceEUR;

  const forceFive = preset === "bundle_4x60";

  const stats = [
    { label: "Depth of Insight",    value: forceFive ? 5 : depthOfInsight(session.liveMin, session.liveBlocks), icon: Lightbulb },
    { label: "Clarity & Structure", value: forceFive ? 5 : clarityStructure(session.liveMin, preset, session.liveBlocks), icon: Layers },
    { label: "Lasting Impact",      value: forceFive ? 5 : lastingImpact(session.liveMin, session.followups, session.liveBlocks), icon: HeartPulse },
    { label: "Flexibility",         value: forceFive ? 5 : flexibility(preset, session.liveBlocks), icon: Shuffle },
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: enterDelay }}
      className="relative w-full max-w-md"
    >
      <GlassPanel className="p-4 md:p-5">
        <SessionBlock
          session={session}
          preset={preset}
          isActive={isCustomizing}
          className="p-0"
        />

        <div className="mt-4 md:mt-5 mb-3 md:mb-3 h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        <div style={{ height: STATS_AREA_HEIGHT }} className="relative">
          <div className="absolute inset-0">
            <div className="grid gap-3">
              <div
                className="text-[12px] font-semibold tracking-wide uppercase"
                style={{ color: ring, filter: `drop-shadow(0 0 6px ${glow})` }}
              >
                Session profile
              </div>

              <div className="space-y-3">
                {stats.map((s) => (
                  <StatRow
                    key={s.label}
                    icon={s.icon}
                    label={s.label}
                    value={s.value}
                    ring={ring}
                    glow={glow}
                    gradient={gradient}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

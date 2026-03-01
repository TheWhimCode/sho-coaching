"use client";

import { useState, useEffect, useMemo, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Hourglass, Gem, Flame } from "lucide-react";
import { getSkillcheckStreak, consumeStreakRenewedToday, STREAK_UPDATED_EVENT } from "@/app/skillcheck/streak";
import { syncLeaderboardOnVisit } from "@/app/skillcheck/leaderboard-client-id";

const CELEBRATION_DURATION_MS = 2200;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/** Isolated so parent re-renders (e.g. streak state) don't touch the ring/particles and restart the animation. */
const StreakCelebration = memo(function StreakCelebration() {
  const particles = useMemo(() => {
    const count = 12;
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand(0, 0.5);
      const dist = rand(18, 42);
      return {
        key: `sp-${i}`,
        sx: Math.cos(angle) * dist,
        sy: Math.sin(angle) * dist,
        delay: rand(0, 120),
        dur: rand(500, 900),
      };
    });
  }, []);
  return (
    <>
      {/* Small ring around flame, same size as the square buttons below (56px); fades in and out */}
      <div
        className="streak-ring-small pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-orange)] opacity-0"
      />
      <div
        className="streak-ring-expand pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 rounded-full border-2 border-[var(--color-orange)] opacity-0"
      />
      {particles.map((p) => (
        <div
          key={p.key}
          className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-[var(--color-orange)] opacity-0"
          style={
            {
              animation: `streak-particle ${p.dur}ms ease-out ${p.delay}ms both`,
              "--sx": `${p.sx}px`,
              "--sy": `${p.sy}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
});

const gameModes = [
  { key: "draft", label: "Draft", href: "/skillcheck/draft", icon: Swords },
  { key: "cooldowns", label: "Cooldowns", href: "/skillcheck/cooldowns", icon: Hourglass },
  { key: "items", label: "Items", href: "/skillcheck/items", icon: Gem },
] as const;

// Collapsed: p-3 (12px) each side + 56px button = 80px total.
const COLLAPSED_W = 80;
const EXPANDED_W = 260;

const iconBtn =
  "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-white/[0.12] hover:to-white/[0.06] hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)] hover:ring-1 hover:ring-white/25 cursor-pointer";

export default function SkillcheckRail() {
  const pathname = usePathname();
  // Start with 0 so server and client match (no hydration mismatch); load from localStorage after mount
  const [streak, setStreak] = useState({ streakDays: 0 });
  const [expanded, setExpanded] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setStreak(getSkillcheckStreak());
    if (consumeStreakRenewedToday() && getSkillcheckStreak().streakDays > 0) {
      setShowStreakCelebration(true);
    }
    syncLeaderboardOnVisit();
  }, []);

  useEffect(() => {
    if (!showStreakCelebration) return;
    const t = window.setTimeout(
      () => setShowStreakCelebration(false),
      CELEBRATION_DURATION_MS
    );
    return () => window.clearTimeout(t);
  }, [showStreakCelebration]);

  useEffect(() => {
    const onStreakUpdated = () => {
      setStreak(getSkillcheckStreak());
      if (consumeStreakRenewedToday() && getSkillcheckStreak().streakDays > 0) {
        setShowStreakCelebration(true);
      }
    };
    window.addEventListener(STREAK_UPDATED_EVENT, onStreakUpdated);
    return () => window.removeEventListener(STREAK_UPDATED_EVENT, onStreakUpdated);
  }, []);

  const streakActive = streak.streakDays > 0;

  return (
    <div
      className="fixed left-0 z-20 hidden md:flex flex-col rounded-r-2xl border border-l-0 border-white/10 bg-black/50 backdrop-blur-md shadow-lg transition-[width] duration-200 ease-out overflow-visible"
      style={{
        top: "32%",
        transform: "translateY(-50%)",
        width: expanded ? EXPANDED_W : COLLAPSED_W,
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex flex-col gap-3 p-3 overflow-visible">
        {/* Streak + Check Leaderboard: one row, one button; streak count absolutely under icon (no extra space) */}
        <Link
          href="/skillcheck/leaderboard"
          className="flex h-14 items-center gap-3 rounded-2xl px-0 transition-colors cursor-pointer hover:bg-white/5"
          aria-label={streakActive ? `${streak.streakDays} day streak` : "No streak"}
        >
          {/* Hidden until streak loaded from localStorage, then fade in to avoid showing 0 */}
          <div
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-visible transition-opacity duration-300 ${
              hasMounted ? "opacity-100" : "opacity-0"
            }`}
          >
            {hasMounted && showStreakCelebration && <StreakCelebration />}
            <span className="-translate-y-[2px]">
              <Flame
                className={`h-7 w-7 ${
                  streakActive
                    ? "fill-[var(--color-orange)] text-[var(--color-orange)]"
                    : "fill-none text-[var(--color-orange)]"
                }`}
                strokeWidth={streakActive ? 0 : 1.5}
              />
            </span>
            {/* Streak count under icon, absolutely positioned; same color as flame */}
            <span className="pointer-events-none absolute left-1/2 bottom-0.5 -translate-x-1/2 text-[12px] leading-none text-[var(--color-orange)] whitespace-nowrap">
              {streak.streakDays}
            </span>
          </div>
          {expanded && (
            <span className="text-sm font-medium text-white/90 whitespace-nowrap pr-2">
              Check Leaderboard
            </span>
          )}
        </Link>

        <div className="border-t border-white/10 flex-shrink-0 h-0" aria-hidden />

        {/* Game mode links: icon + optional label */}
        {gameModes.map((m) => {
          const Icon = m.icon;
          const isActive = pathname.startsWith(m.href);
          return (
            <Link
              key={m.key}
              href={m.href}
              className={`flex items-center gap-3 h-14 rounded-2xl transition-colors cursor-pointer ${
                isActive ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className={iconBtn}>
                <Icon className="h-6 w-6 opacity-90 text-white" />
              </div>
              {expanded && (
                <span className="text-sm font-medium text-white/90 whitespace-nowrap">
                  {m.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

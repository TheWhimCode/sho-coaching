"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  type MotionValue,
} from "framer-motion";
import {
  ArrowDown,
  Sparkles,
  Trophy,
  Heart,
  Star,
  Mic2,
  Gamepad2,
} from "lucide-react";
import TypingText from "@/app/_components/animations/TypingText";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import { championAvatarByName, rankMiniCrestSvg } from "@/lib/league/datadragon";
import { ROLE_ICONS } from "@/lib/datadragon/roles";
import {
  ABOUT_MINO_ACCENT,
  ABOUT_MINO_ACHIEVEMENTS,
  ABOUT_MINO_GLOW,
  type AboutMinoAchievement,
} from "@/app/_components/linktree/aboutMinoAchievements";
import {
  getPinkSectionScrollMetrics,
  useOverlayScrollViewport,
} from "@/lib/overlayScrollViewport";

const OverlayScrollRootContext = createContext<HTMLElement | null>(null);

const EASE = [0.22, 1, 0.36, 1] as const;
const HERO_VIDEO = "/videos/about/ChallPromotionthinner.webm";
const PASTEL_PINK_BG =
  "linear-gradient(165deg, #FFF5FA 0%, #FDF2F8 22%, #FBCFE8 58%, #F9A8D4 100%)";
const ABOUT_GOLD = "#E8C36A";
const ABOUT_SECTION_BG = "#050B18";
const PINK_SECTION_HEIGHT = "min-h-[150dvh]";
/** Panel sits higher + pink/panel reveal earlier; keep `PINK_SCROLL_REVEAL_OFFSET` in sync with `pt-0 md:pt-[4vh]`. */
const PINK_SCROLL_REVEAL_OFFSET = 0.08;
const PINK_REVEAL_START_RATIO = 0.72 + PINK_SCROLL_REVEAL_OFFSET;
const PINK_PANEL_REVEAL_RANGE: [number, number] = [
  0.3 - PINK_SCROLL_REVEAL_OFFSET,
  0.75 - PINK_SCROLL_REVEAL_OFFSET,
];
const PINK_PANEL_REVEAL_END = PINK_PANEL_REVEAL_RANGE[1];
/** Horror lights-out: on → snap off → one dying flicker → dead. */
const LIGHTS_OUT_DURATION_S = 0.82;
const LIGHTS_OUT_TIMES = [0, 0.05, 0.16, 0.38] as const;
/** Bulb sputters back on when re-entering from below. */
const LIGHTS_IN_DURATION_S = 0.95;
const LIGHTS_IN_TIMES = [0, 0.12, 0.24, 0.5] as const;

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Hero-side fade: 0 at section entry, 1 when reveal completes. */
function pinkTopFade(reveal: number) {
  return smoothstep(Math.min(1, reveal / PINK_PANEL_REVEAL_END));
}
const HERO_CONTENT_HEIGHT =
  "min-h-[100svh] supports-[height:100dvh]:min-h-dvh";
const HERO_VIDEO_HEIGHT =
  "h-[110svh] supports-[height:100dvh]:h-[110dvh]";
const ABOUT_BG_Z = "pointer-events-none absolute inset-0 z-0";
const ABOUT_CONTENT_Z = "relative isolate z-10";

function AboutPageBackgrounds({ pinkPresence }: { pinkPresence: MotionValue<number> }) {
  return (
    <div className={ABOUT_BG_Z} aria-hidden>
      <div className="absolute inset-0" style={{ background: ABOUT_SECTION_BG }} />
      <div className={clsx("absolute inset-x-0 top-0 overflow-hidden", HERO_VIDEO_HEIGHT)}>
        <div className="relative w-full">
          <video
            src={HERO_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="block h-auto w-full max-w-none"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(48%,22rem)]"
            style={{
              background:
                "linear-gradient(to top, #050B18 0%, rgba(5, 11, 24, 0.92) 18%, rgba(5, 11, 24, 0.45) 45%, transparent 100%)",
            }}
            aria-hidden
          />
        </div>
      </div>
      <motion.div className="absolute inset-0" style={{ opacity: pinkPresence }} aria-hidden>
        <div className="absolute inset-0" style={{ background: PASTEL_PINK_BG }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 90% at 50% 35%, rgba(255,255,255,0.65), transparent 70%)",
          }}
        />
      </motion.div>
    </div>
  );
}

type PinkPanelCardProps = {
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
  demonMode: boolean;
};

function PinkPanelCard({ eyebrow, title, body, tags, demonMode }: PinkPanelCardProps) {
  return (
    <motion.div
      className={clsx(
        "relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl md:p-7",
        demonMode
          ? "border border-[#E8C36A]/50 bg-[#050B18]/55"
          : "border border-white/70 bg-white/72"
      )}
      animate={{
        boxShadow: demonMode
          ? `0 0 42px -10px ${ABOUT_GOLD}, 0 0 56px -14px rgba(244,114,182,0.48), inset 0 1px 0 rgba(255,255,255,0.12)`
          : `0 28px 70px -28px ${ABOUT_MINO_GLOW}, 0 0 0 1px rgba(255,255,255,0.45)`,
      }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        animate={{
          opacity: demonMode ? 1 : 0,
          background:
            "linear-gradient(135deg, rgba(244,114,182,0.14) 0%, transparent 42%, rgba(232,195,106,0.12) 100%)",
        }}
        transition={{ duration: 0.45 }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        animate={{
          opacity: demonMode ? 0.9 : 0,
          background: `linear-gradient(90deg, transparent, ${ABOUT_MINO_ACCENT}, ${ABOUT_GOLD}, transparent)`,
        }}
        transition={{ duration: 0.45 }}
        aria-hidden
      />

      <div className="relative">
        <motion.p
          className="text-[11px] font-medium uppercase tracking-[0.22em]"
          animate={{ color: demonMode ? ABOUT_GOLD : "rgba(190, 24, 93, 0.8)" }}
          transition={{ duration: 0.4 }}
        >
          {eyebrow}
          {demonMode ? (
            <span className="text-[#F9A8D4]"> · demon kitten</span>
          ) : null}
        </motion.p>
        <motion.h2
          className="mt-2.5 text-xl font-semibold leading-snug md:mt-3 md:text-2xl"
          animate={{
            color: demonMode ? "#FDF2F8" : "#4A1D35",
            textShadow: demonMode ? `0 0 28px rgba(232,195,106,0.35)` : "none",
          }}
          transition={{ duration: 0.4 }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="mt-3 text-sm leading-relaxed md:mt-4 md:text-base"
          animate={{ color: demonMode ? "rgba(253, 242, 248, 0.82)" : "rgba(107, 40, 72, 0.88)" }}
          transition={{ duration: 0.4 }}
        >
          {body}
        </motion.p>
        <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
          {tags.map((tag) => (
            <motion.span
              key={tag}
              className="rounded-full px-3 py-1 text-xs font-medium"
              animate={{
                borderColor: demonMode ? "rgba(232,195,106,0.45)" : "rgba(249,168,212,0.5)",
                backgroundColor: demonMode ? "rgba(5,11,24,0.55)" : "rgba(253,242,248,0.8)",
                color: demonMode ? ABOUT_GOLD : "#9D174D",
              }}
              style={{ borderWidth: 1, borderStyle: "solid" }}
              transition={{ duration: 0.4 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const ROLE_LABEL: Record<AboutMinoAchievement["role"], string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  adc: "ADC",
  sup: "Support",
};

const TIER_LABEL: Record<string, string> = {
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
};

const STATS = [
  { value: "5+", label: "Years coaching", icon: Trophy },
  { value: "500+", label: "Student reviews", icon: Star },
  { value: "4.9", label: "Average rating", icon: Sparkles },
  { value: "3×", label: "Challenger peaks", icon: Gamepad2 },
] as const;

const MOODS = [
  {
    emoji: "🌸",
    title: "Soft mode",
    subtitle: "Enchanters · comfort picks",
    body: "Gentle streams, cozy energy, and the kind of gameplay that feels like a warm blanket — still high elo, just softer around the edges.",
  },
  {
    emoji: "✦",
    title: "Spooky mode",
    subtitle: "Viego · Pyke · the edgy picks",
    body: "Same person, different soundtrack. Resets, picks, and chaos — talented demon kitten hours, if you know you know.",
  },
] as const;

const VIBES = [
  { emoji: "🎀", text: "Femboy · catboy · vtuber — it's part of the package, not the pitch" },
  { emoji: "✨", text: "Five years of coaching behind the softness" },
  { emoji: "💗", text: "Sometimes enchanters, sometimes something spicier — mood-dependent" },
  { emoji: "🐾", text: "Warm sessions, honest feedback, zero ranked-demon cosplay" },
] as const;

function FadeUp({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const scrollRoot = useContext(OverlayScrollRootContext);
  const scrollRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    scrollRootRef.current = scrollRoot;
  }, [scrollRoot]);

  const inView = useInView(ref, {
    once: true,
    amount: 0.25,
    root: scrollRoot ? scrollRootRef : undefined,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({
  children,
  pink = false,
  gold = false,
}: {
  children: React.ReactNode;
  pink?: boolean;
  gold?: boolean;
}) {
  return (
    <p
      className="text-[11px] font-medium uppercase tracking-[0.22em]"
      style={{
        color: gold ? ABOUT_GOLD : pink ? "#FBCFE8" : ABOUT_MINO_ACCENT,
      }}
    >
      {children}
    </p>
  );
}

function ChampionIcons({
  champions,
  visible,
}: {
  champions: string[];
  visible: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex min-w-0 flex-wrap items-center justify-end gap-1.5 transition-all duration-300",
        visible
          ? "max-h-12 opacity-100"
          : "pointer-events-none max-h-0 overflow-hidden opacity-0"
      )}
    >
      {champions.map((champ) => (
        <div
          key={champ}
          className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-900 ring-1 ring-[#E8C36A]/35 md:h-9 md:w-9"
          title={champ}
        >
          <Image
            src={championAvatarByName(champ)}
            alt={champ}
            width={36}
            height={36}
            className="h-full w-full scale-[1.12] object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

function AchievementCard({
  achievement,
  index,
}: {
  achievement: AboutMinoAchievement;
  index: number;
}) {
  const [crestHovered, setCrestHovered] = useState(false);
  const tierName = TIER_LABEL[achievement.tier] ?? achievement.tier;
  const roleName = ROLE_LABEL[achievement.role];
  const isPrimary = index === 0;

  return (
    <FadeUp delay={index * 0.08}>
      <GlassPanel
        className={clsx(
          "flex items-center gap-3 p-3.5 transition-[box-shadow,border-color] duration-300 md:p-4",
          "bg-[#0B1220]/55 ring-1 ring-[#E8C36A]/20",
          "hover:ring-[color-mix(in_srgb,#F5B8D9_45%,#E8C36A_55%)]",
          isPrimary &&
            "shadow-[0_0_40px_-12px_rgba(232,195,106,0.28),0_0_32px_-14px_rgba(245,184,217,0.22)]"
        )}
      >
        <span
          className="relative inline-flex h-10 w-10 shrink-0 cursor-default items-center justify-center"
          onMouseEnter={() => setCrestHovered(true)}
          onMouseLeave={() => setCrestHovered(false)}
          onFocus={() => setCrestHovered(true)}
          onBlur={() => setCrestHovered(false)}
          onClick={() => setCrestHovered((on) => !on)}
          tabIndex={0}
          role="button"
          aria-label={`Show ${tierName} ${roleName} champions`}
        >
          <Image
            src={rankMiniCrestSvg(achievement.tier)}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain drop-shadow-[0_0_14px_rgba(232,195,106,0.4)]"
            unoptimized
          />
          <span className="sr-only">
            {tierName} {roleName}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white md:text-base">
            {tierName}{" "}
            <span className="font-medium text-fg-muted">· {roleName}</span>
            {isPrimary && (
              <span className="ml-2 text-xs font-medium" style={{ color: ABOUT_GOLD }}>
                main
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-fg-muted/75 md:text-sm">Peak rank</p>
        </div>

        <ChampionIcons champions={achievement.champions} visible={crestHovered} />

        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-[#F5B8D9]/25"
          style={{ background: "color-mix(in srgb, #E8C36A 12%, transparent)" }}
        >
          <Image
            src={ROLE_ICONS[achievement.role]}
            alt={roleName}
            width={24}
            height={24}
            className="h-6 w-6 object-contain opacity-90"
            unoptimized
          />
        </span>
      </GlassPanel>
    </FadeUp>
  );
}

function StatCard({
  value,
  label,
  icon: Icon,
  index,
}: {
  value: string;
  label: string;
  icon: typeof Trophy;
  index: number;
}) {
  return (
    <FadeUp delay={index * 0.1}>
      <GlassPanel className="flex min-h-[9.5rem] flex-col items-center justify-center gap-2 p-6 text-center">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/10"
          style={{
            background: `color-mix(in srgb, ${ABOUT_MINO_ACCENT} 18%, transparent)`,
            boxShadow: `0 0 24px -8px ${ABOUT_MINO_GLOW}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: ABOUT_MINO_ACCENT }} />
        </span>
        <p className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">{value}</p>
        <p className="text-sm text-fg-muted/85">{label}</p>
      </GlassPanel>
    </FadeUp>
  );
}

function MoodCard({
  mood,
  index,
}: {
  mood: (typeof MOODS)[number];
  index: number;
}) {
  return (
    <FadeUp delay={index * 0.12}>
      <div className="relative overflow-hidden rounded-3xl border border-[#FBCFE8]/25 bg-[#FDF2F8]/[0.06] p-6 backdrop-blur-sm md:p-7">
        <motion.span
          className="text-3xl md:text-4xl"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatDelay: 1.5 + index,
            ease: "easeInOut",
          }}
          aria-hidden
        >
          {mood.emoji}
        </motion.span>
        <h3 className="mt-4 text-xl font-semibold text-[#FDF2F8] md:text-2xl">{mood.title}</h3>
        <p className="mt-1 text-sm text-[#FBCFE8]/90">{mood.subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#FDF2F8]/75 md:text-base">{mood.body}</p>
      </div>
    </FadeUp>
  );
}

function VibeRow({
  emoji,
  text,
  index,
}: {
  emoji: string;
  text: string;
  index: number;
}) {
  return (
    <FadeUp delay={index * 0.07}>
      <div className="flex items-start gap-4 rounded-3xl border border-[#FBCFE8]/20 bg-[#FDF2F8]/[0.07] px-4 py-4 transition-colors duration-300 hover:border-[#FBCFE8]/35 hover:bg-[#FDF2F8]/[0.1]">
        <motion.span
          className="select-none text-2xl md:text-3xl"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            repeatDelay: 2 + index * 0.4,
            ease: "easeInOut",
          }}
          aria-hidden
        >
          {emoji}
        </motion.span>
        <p className="pt-1 text-sm leading-relaxed text-[#FDF2F8]/82 md:text-base">{text}</p>
      </div>
    </FadeUp>
  );
}

export default function AboutMinoClient() {
  const pinkZoneRef = useRef<HTMLDivElement>(null);
  const prevZoneRef = useRef<"pink" | "dark">("pink");
  const animDirectionRef = useRef<"out" | "in" | null>(null);
  const metricsRef = useRef({ reveal: 0, exit: 0 });
  const blinkAnimatingRef = useRef(false);
  const blinkControlRef = useRef<ReturnType<typeof animate> | null>(null);
  const scrollViewport = useOverlayScrollViewport();
  const pinkReveal = useMotionValue(0);
  const pinkExit = useMotionValue(0);
  const pinkPresence = useMotionValue(0);
  const panelPresence = useMotionValue(0);
  const [panelDemonMode, setPanelDemonMode] = useState(false);
  const setPanelDemonModeRef = useRef(setPanelDemonMode);
  setPanelDemonModeRef.current = setPanelDemonMode;

  useEffect(() => {
    if (!scrollViewport) return;

    const overlayZone = (exit: number) => (exit > 0 ? "dark" : "pink");

    const syncSteadyOverlay = () => {
      const { reveal, exit } = metricsRef.current;
      pinkPresence.set(exit > 0 ? 0 : pinkTopFade(reveal));
    };

    const stopBlink = () => {
      blinkControlRef.current?.stop();
      blinkControlRef.current = null;
      blinkAnimatingRef.current = false;
      animDirectionRef.current = null;
    };

    const startBlinkOut = () => {
      stopBlink();
      setPanelDemonModeRef.current(true);
      blinkAnimatingRef.current = true;
      animDirectionRef.current = "out";
      const from = pinkPresence.get();
      blinkControlRef.current = animate(pinkPresence, [from, 0, 1, 0], {
        duration: LIGHTS_OUT_DURATION_S,
        times: [...LIGHTS_OUT_TIMES],
        ease: "linear",
        onComplete: () => {
          stopBlink();
          syncSteadyOverlay();
        },
      });
    };

    const startBlinkIn = (target: number) => {
      stopBlink();
      setPanelDemonModeRef.current(false);
      blinkAnimatingRef.current = true;
      animDirectionRef.current = "in";
      const from = pinkPresence.get();
      blinkControlRef.current = animate(
        pinkPresence,
        [from, target * 0.6, target * 0.05, target],
        {
          duration: LIGHTS_IN_DURATION_S,
          times: [...LIGHTS_IN_TIMES],
          ease: "linear",
          onComplete: () => {
            stopBlink();
            syncSteadyOverlay();
          },
        }
      );
    };

    const update = () => {
      const zone = pinkZoneRef.current;
      if (!zone) return;

      const { reveal, exit } = getPinkSectionScrollMetrics(
        zone,
        scrollViewport,
        PINK_REVEAL_START_RATIO
      );
      pinkReveal.set(reveal);
      pinkExit.set(exit);
      metricsRef.current = { reveal, exit };

      panelPresence.set(pinkTopFade(reveal));

      const currentZone = overlayZone(exit);
      const prevZone = prevZoneRef.current;

      if (blinkAnimatingRef.current) {
        const reversed =
          (animDirectionRef.current === "out" && currentZone === "pink") ||
          (animDirectionRef.current === "in" && currentZone === "dark");

        if (reversed) {
          if (currentZone === "pink") {
            startBlinkIn(pinkTopFade(reveal));
          } else {
            startBlinkOut();
          }
        }

        prevZoneRef.current = currentZone;
        return;
      }

      if (currentZone === "dark" && prevZone === "pink") {
        startBlinkOut();
      } else if (currentZone === "pink" && prevZone === "dark") {
        startBlinkIn(pinkTopFade(reveal));
      } else {
        syncSteadyOverlay();
      }

      prevZoneRef.current = currentZone;

      if (!blinkAnimatingRef.current) {
        setPanelDemonModeRef.current(currentZone === "dark");
      }
    };

    scrollViewport.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      stopBlink();
      scrollViewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollViewport, pinkReveal, pinkExit, pinkPresence, panelPresence]);

  const panelOpacity = panelPresence;
  const panelRightX = useTransform(panelPresence, [0, 1], [72, 0]);
  const panelLeftX = useTransform(panelPresence, [0, 1], [-72, 0]);
  const panelY = useTransform(panelPresence, [0, 1], [28, 0]);
  const panelLeftY = useTransform(panelPresence, [0, 1], [36, 0]);

  return (
    <OverlayScrollRootContext.Provider value={scrollViewport}>
      <div className="relative w-full overflow-x-hidden text-white">
        <AboutPageBackgrounds pinkPresence={pinkPresence} />

        <div className={ABOUT_CONTENT_Z}>
          {/* ── HERO (content only) ── */}
          <section className={clsx("flex flex-col justify-end", HERO_CONTENT_HEIGHT)}>
            <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-20 md:px-8 md:pb-32 md:pt-24">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
              >
                <SectionLabel>Vtuber · coach · femboy</SectionLabel>
                <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                  About{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, #fff 0%, ${ABOUT_MINO_ACCENT} 55%, #F472B6 100%)`,
                    }}
                  >
                    Mino
                  </span>{" "}
                  <span className="inline-block animate-[wiggle_2.5s_ease-in-out_infinite]">
                    🌸
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-base text-fg-muted/90 md:text-xl">
                  <TypingText
                    text="Fixing the League community one stream at a time"
                    speed={28}
                    delay={900}
                    color={ABOUT_MINO_ACCENT}
                    className="text-base text-fg-muted/90 md:text-xl"
                  />
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.8 }}
                className="mt-10 flex justify-center md:justify-start"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center gap-2 text-fg-muted/60"
                >
                  <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
                  <ArrowDown className="h-5 w-5" style={{ color: ABOUT_MINO_ACCENT }} />
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ── PINK SCROLL ZONE (1.5× viewport) ── */}
          <div
            ref={pinkZoneRef}
            className={clsx(
              "flex flex-col justify-start px-5 pb-24 pt-0 md:px-8 md:pb-32 md:pt-[4vh]",
              PINK_SECTION_HEIGHT
            )}
          >
            <div className="flex w-full flex-col gap-6 md:gap-8 lg:gap-10">
              <motion.div
                className="ml-auto w-full max-w-md md:mr-[8%] md:max-w-lg lg:mr-[10%]"
                style={{ opacity: panelOpacity, x: panelRightX, y: panelY }}
              >
                <PinkPanelCard
                  demonMode={panelDemonMode}
                  eyebrow="Also me"
                  title="Talented, soft, and a little magical."
                  body="The credentials are real. The vibe is just pinker. Streams, content, and coaching all come from the same place: high elo skill with a feminine, playful energy that doesn't take itself too seriously."
                  tags={["Vtuber", "Coach", "Femboy", "Challenger"]}
                />
              </motion.div>

              <motion.div
                className="mr-auto w-full max-w-md md:ml-[8%] md:max-w-lg lg:ml-[10%]"
                style={{ opacity: panelOpacity, x: panelLeftX, y: panelLeftY }}
              >
                <PinkPanelCard
                  demonMode={panelDemonMode}
                  eyebrow="In session"
                  title="Sweet voice, sharp eyes on your gameplay."
                  body="Coaching is where the kitten energy meets Challenger discipline — clear fixes, no fluff, and a session that still feels warm even when the feedback stings a little."
                  tags={["VOD review", "Live coaching", "Mindset", "Macro"]}
                />
              </motion.div>
            </div>
          </div>

          {/* ── DARK ZONE — peak ranks ── */}
          <section className="section-y mx-auto max-w-4xl px-5 md:px-8">
            <FadeUp className="mb-8 md:mb-12">
              <SectionLabel gold>Credentials</SectionLabel>
              <h2 className="mt-3 text-2xl font-extrabold md:text-4xl">
                Peak ranks{" "}
                <span style={{ color: ABOUT_GOLD }}>&</span>{" "}
                <span style={{ color: ABOUT_MINO_ACCENT }}>main pools</span>
              </h2>
              <p className="mt-3 max-w-lg text-sm text-fg-muted/80 md:text-base">
                Hover a rank crest to peek the champion pool.
              </p>
            </FadeUp>

            <div className="flex flex-col gap-3">
              {ABOUT_MINO_ACHIEVEMENTS.map((a, i) => (
                <AchievementCard key={`${a.tier}-${a.role}`} achievement={a} index={i} />
              ))}
            </div>
          </section>

          <section className="section-y mx-auto max-w-5xl px-5 pb-20 md:px-8 md:pb-28">
            <FadeUp className="mb-8 text-center md:mb-12">
              <SectionLabel>By the numbers</SectionLabel>
              <h2 className="mt-3 text-2xl font-extrabold md:text-4xl">Experience you can trust</h2>
            </FadeUp>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {STATS.map((stat, i) => (
                <StatCard key={stat.label} {...stat} index={i} />
              ))}
            </div>
          </section>

          {/* ── MOODS & personality ── */}
          <section className="section-y relative mx-auto max-w-4xl px-5 md:px-8">
            <FadeUp className="mb-8 text-center md:mb-10">
              <SectionLabel pink>Two sides</SectionLabel>
              <h2 className="mt-3 text-2xl font-semibold text-[#FDF2F8] md:text-4xl">
                Depends what I&apos;m playing
              </h2>
            </FadeUp>

            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              {MOODS.map((mood, i) => (
                <MoodCard key={mood.title} mood={mood} index={i} />
              ))}
            </div>
          </section>

          <section className="section-y relative mx-auto max-w-3xl px-5 md:px-8">
            <FadeUp className="mb-8 md:mb-10">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#FBCFE8]" />
                <SectionLabel pink>The rest</SectionLabel>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[#FDF2F8] md:text-4xl">
                Feminine, silly, still very good at League
              </h2>
            </FadeUp>

            <div className="flex flex-col gap-3">
              {VIBES.map((v, i) => (
                <VibeRow key={v.text} {...v} index={i} />
              ))}
            </div>

            <FadeUp delay={0.2} className="mt-10">
              <div className="flex items-center gap-4 rounded-3xl border border-[#FBCFE8]/22 bg-[#FDF2F8]/[0.08] p-5 backdrop-blur-sm md:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FDF2F8]/10 ring-1 ring-[#FBCFE8]/25">
                  <Mic2 className="h-6 w-6 text-[#FBCFE8]" />
                </span>
                <div>
                  <p className="font-medium text-[#FDF2F8]">Streams & community</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#FDF2F8]/72">
                    Twitch, TikTok, Discord — come hang out, watch some League, see which mode shows
                    up that day.
                  </p>
                </div>
              </div>
            </FadeUp>
          </section>

          <section className="section-y relative mx-auto max-w-2xl px-5 pb-28 text-center md:px-8 md:pb-36">
            <FadeUp>
              <SectionLabel pink>Ready?</SectionLabel>
              <h2 className="mt-3 text-2xl font-semibold text-[#FDF2F8] md:text-4xl">
                Let&apos;s climb together
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[#FDF2F8]/72">
                Book a session, try a skillcheck, or say hi on Discord.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/coaching"
                  className="relative inline-flex min-w-[11rem] items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-[#3b1228] transition hover:brightness-105"
                  style={{
                    background: `linear-gradient(135deg, #FDF2F8 0%, ${ABOUT_MINO_ACCENT} 55%, #F9A8D4 100%)`,
                    boxShadow: `0 10px 32px -8px ${ABOUT_MINO_GLOW}`,
                  }}
                >
                  Book coaching
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-w-[11rem] items-center justify-center rounded-2xl border border-[#FBCFE8]/30 bg-[#FDF2F8]/10 px-6 py-3 text-sm font-medium text-[#FDF2F8]/90 transition hover:border-[#FBCFE8]/50 hover:bg-[#FDF2F8]/15"
                >
                  Back home
                </Link>
              </div>
            </FadeUp>
          </section>
        </div>
      </div>
    </OverlayScrollRootContext.Provider>
  );
}

"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
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

const EASE = [0.22, 1, 0.36, 1] as const;
const HERO_VIDEO = "/videos/about/ChallPromotionthinner.webm";

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
  const inView = useInView(ref, { once: true, amount: 0.25 });

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
}: {
  children: React.ReactNode;
  pink?: boolean;
}) {
  return (
    <p
      className="text-[11px] tracking-[0.22em] uppercase font-medium"
      style={{ color: pink ? "#FBCFE8" : ABOUT_MINO_ACCENT }}
    >
      {children}
    </p>
  );
}

function ChampionIcons({ champions }: { champions: string[] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5">
      {champions.map((champ) => (
        <motion.div
          key={champ}
          whileHover={{ scale: 1.08, y: -2 }}
          className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-900 ring-1 ring-white/20 md:h-9 md:w-9"
          title={champ}
        >
          <Image
            src={championAvatarByName(champ)}
            alt={champ}
            width={36}
            height={36}
            className="h-full w-full object-cover scale-[1.12]"
            unoptimized
          />
        </motion.div>
      ))}
    </div>
  );
}

function AchievementCard({ achievement, index }: { achievement: AboutMinoAchievement; index: number }) {
  const tierName = TIER_LABEL[achievement.tier] ?? achievement.tier;
  const roleName = ROLE_LABEL[achievement.role];
  const isPrimary = index === 0;

  return (
    <FadeUp delay={index * 0.08}>
      <GlassPanel
        className={[
          "flex items-center gap-3 p-3.5 md:p-4 transition-[box-shadow,border-color] duration-300",
          isPrimary
            ? "ring-1 ring-white/15 shadow-[0_0_40px_-12px_rgba(244,114,182,0.25)]"
            : "hover:ring-1 hover:ring-[color-mix(in_srgb,var(--about-accent)_30%,transparent)]",
        ].join(" ")}
        style={{ ["--about-accent" as string]: ABOUT_MINO_ACCENT }}
      >
        <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center">
          <Image
            src={rankMiniCrestSvg(achievement.tier)}
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain drop-shadow-[0_0_12px_rgba(244,114,182,0.35)]"
            unoptimized
          />
          <span className="sr-only">
            {tierName} {roleName}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white md:text-base">
            {tierName}{" "}
            <span className="text-fg-muted font-medium">· {roleName}</span>
            {isPrimary && (
              <span className="ml-2 text-xs font-medium" style={{ color: ABOUT_MINO_ACCENT }}>
                main
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-fg-muted/75 md:text-sm">Peak rank</p>
        </div>

        <ChampionIcons champions={achievement.champions} />

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
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
      <GlassPanel className="flex flex-col items-center justify-center gap-2 p-6 text-center min-h-[9.5rem]">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/10"
          style={{
            background: `color-mix(in srgb, ${ABOUT_MINO_ACCENT} 18%, transparent)`,
            boxShadow: `0 0 24px -8px ${ABOUT_MINO_GLOW}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: ABOUT_MINO_ACCENT }} />
        </span>
        <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">{value}</p>
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
          className="text-2xl md:text-3xl select-none"
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
  return (
    <div className="relative w-full overflow-x-hidden text-white">
      {/* ── HERO ── */}
      <section className="relative isolate min-h-[100svh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-0 pointer-events-none" aria-hidden>
          <video
            src={HERO_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="block w-full h-auto max-w-none -translate-y-8"
          />
        </div>
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050B18]/55 via-[#050B18]/25 to-[#050B18]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050B18] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-32">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            >
              <SectionLabel>League coach · Challenger</SectionLabel>
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
                  text="Challenger jungle. Five years coaching. 500+ reviews."
                  speed={28}
                  delay={900}
                  color={ABOUT_MINO_ACCENT}
                  className="text-base md:text-xl text-fg-muted/90"
                />
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.8 }}
              className="mt-14 flex justify-center md:justify-start"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-2 text-fg-muted/60"
              >
                <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
                <ArrowDown className="h-5 w-5" style={{ color: ABOUT_MINO_ACCENT }} />
              </motion.div>
            </motion.div>
          </div>
        </section>

      {/* ═══════════ IMPRESSIVE TOP — dark credentials ═══════════ */}
      <div className="relative bg-[#050B18]">
        {/* ── PEAK RANKS ── */}
        <section className="section-y mx-auto max-w-4xl px-5 md:px-8">
          <FadeUp className="mb-8 md:mb-12">
            <SectionLabel>Credentials</SectionLabel>
            <h2 className="mt-3 text-2xl font-extrabold md:text-4xl">Peak ranks & main pools</h2>
          </FadeUp>

          <div className="flex flex-col gap-3">
            {ABOUT_MINO_ACHIEVEMENTS.map((a, i) => (
              <AchievementCard key={`${a.tier}-${a.role}`} achievement={a} index={i} />
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="section-y mx-auto max-w-5xl px-5 md:px-8 pb-20 md:pb-28">
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
      </div>

      {/* ═══════════ PINK ZONE — mood shift on scroll ═══════════ */}
      <div
        className="relative"
        style={{
          background: `
            linear-gradient(180deg, #050B18 0%, #2a1020 6%, #3d1530 18%, #4f1a3d 45%, #5c2248 100%)
          `,
        }}
      >
        {/* Top fade-in glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          aria-hidden
          style={{
            background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${ABOUT_MINO_GLOW}, transparent 70%)`,
          }}
        />

        {/* ── INTRO ── */}
        <section className="section-y relative mx-auto max-w-3xl px-5 md:px-8">
          <FadeUp>
            <SectionLabel pink>Also me</SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold leading-snug text-[#FDF2F8] md:text-4xl">
              Talented, soft, and a little magical.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#FDF2F8]/78 md:text-lg">
              The credentials are real — the vibe is just… pinker. Streams, content, and
              coaching all come from the same place: high elo skill with a feminine, playful
              energy that doesn&apos;t take itself too seriously.
            </p>
          </FadeUp>
        </section>

        {/* ── TWO MOODS ── */}
        <section className="section-y relative mx-auto max-w-4xl px-5 md:px-8">
          <FadeUp className="mb-8 md:mb-10 text-center">
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

        {/* ── PERSONALITY ── */}
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
                  Twitch, TikTok, Discord — come hang out, watch some League, see which mode
                  shows up that day.
                </p>
              </div>
            </div>
          </FadeUp>
        </section>

        {/* ── CTA ── */}
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
  );
}

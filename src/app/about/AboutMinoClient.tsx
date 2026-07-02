"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type MotionValue,
} from "framer-motion";
import { ArrowDown } from "lucide-react";
import StripeRevealText from "@/app/_components/animations/StripeRevealText";
import { rankEmblemUrl } from "@/lib/league/datadragon";
import {
  ABOUT_MINO_ACCENT,
  ABOUT_MINO_ACHIEVEMENTS,
  ABOUT_MINO_GLOW,
  type AboutMinoAchievement,
} from "@/app/_components/linktree/aboutMinoAchievements";
import {
  getPinkSectionScrollMetrics,
  lockScrollViewport,
  useOverlayScrollViewport,
} from "@/lib/overlayScrollViewport";
import { ABOUT_HERO_VIDEO } from "@/lib/coaching/coachingClipVideos";

function AboutPawIcon({
  className,
  tone = "pink",
}: {
  className?: string;
  tone?: "pink" | "gold";
}) {
  return (
    <span
      aria-hidden
      className={clsx(
        "relative inline-block size-12 shrink-0 -rotate-[30deg] mask-[url(/images/guide/paw.png)] mask-contain mask-center mask-no-repeat md:size-14",
        tone === "gold" ? "bg-[#E8C36A]" : "bg-[#F0ABCF]",
        className
      )}
    />
  );
}

const OverlayScrollRootContext = createContext<HTMLElement | null>(null);

const EASE = [0.22, 1, 0.36, 1] as const;
const PASTEL_PINK_BG =
  "linear-gradient(165deg, #D0B0C4 0%, #C192AB 30%, #B07496 65%, #9E5880 100%)";
const PINK_OVERLAY_RADIAL =
  "radial-gradient(ellipse 120% 90% at 50% 35%, rgba(170,110,140,0.11), transparent 70%)";
const PINK_LAYER_FIXED: React.CSSProperties = { backgroundAttachment: "fixed" };
/** Demon target center must land within this many px of viewport center to start the reveal. */
const DEMON_CENTER_TOLERANCE_PX = 56;
const ABOUT_GOLD = "#E8C36A";
const ABOUT_SECTION_BG = "#050B18";
const PINK_SECTION_HEIGHT = "min-h-[165dvh] lg:min-h-[170dvh] xl:min-h-[175dvh]";
/** Panel sits higher + pink/panel reveal earlier; keep `PINK_SCROLL_REVEAL_OFFSET` in sync with `pt-0 md:pt-[4vh]`. */
const PINK_SCROLL_REVEAL_OFFSET = 0.08;
const PINK_REVEAL_START_RATIO = 0.72 + PINK_SCROLL_REVEAL_OFFSET;
const PINK_PANEL_REVEAL_RANGE: [number, number] = [
  0.3 - PINK_SCROLL_REVEAL_OFFSET,
  0.75 - PINK_SCROLL_REVEAL_OFFSET,
];
const PINK_PANEL_REVEAL_END = PINK_PANEL_REVEAL_RANGE[1];
/** Quick fade to dark when leaving the pink scroll zone. */
const LIGHTS_OUT_DURATION_S = 0.4;
const LIGHTS_OUT_EASE = EASE;
/** Lights back on when re-entering pink from below. */
const LIGHTS_IN_DURATION_S = 0.4;
const LIGHTS_IN_EASE = [0, 0, 0.2, 1] as const;

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

function PinkOverlayLayers() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: PASTEL_PINK_BG, ...PINK_LAYER_FIXED }}
      />
      <div
        className="absolute inset-0"
        style={{ background: PINK_OVERLAY_RADIAL, ...PINK_LAYER_FIXED }}
      />
    </>
  );
}

const PANEL_VIEWPORT_TRIGGER_RATIO = 0.5;

/** Fires once when the element's top edge reaches `heightRatio` of the scroll viewport. */
function useTriggerAtViewportHeight(
  ref: React.RefObject<HTMLElement | null>,
  scrollRoot: HTMLElement | null,
  heightRatio: number
) {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!ref.current || !scrollRoot || triggered) return;

    const check = () => {
      const el = ref.current;
      if (!el) return;

      const containerRect = scrollRoot.getBoundingClientRect();
      const sectionRect = el.getBoundingClientRect();
      const topInViewport = sectionRect.top - containerRect.top;

      if (topInViewport <= containerRect.height * heightRatio) {
        setTriggered(true);
      }
    };

    scrollRoot.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();

    return () => {
      scrollRoot.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [ref, scrollRoot, heightRatio, triggered]);

  return triggered;
}

const PANEL_REVEAL_DURATION_S = 0.65;

/** One-shot panel entrance when the panel top edge crosses 50% of the scroll viewport height. */
function useOneShotPanelReveal(
  ref: React.RefObject<HTMLElement | null>,
  scrollRoot: HTMLElement | null,
  presence: MotionValue<number>
) {
  const doneRef = useRef(false);

  useEffect(() => {
    if (!scrollRoot) return;

    const check = () => {
      if (doneRef.current) return;
      const el = ref.current;
      if (!el) return;

      const containerRect = scrollRoot.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const topInViewport = rect.top - containerRect.top;
      const threshold = containerRect.height * PANEL_VIEWPORT_TRIGGER_RATIO;

      if (topInViewport <= threshold) {
        doneRef.current = true;
        animate(presence, 1, { duration: PANEL_REVEAL_DURATION_S, ease: EASE });
      }
    };

    scrollRoot.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();

    return () => {
      scrollRoot.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [ref, scrollRoot, presence]);
}

function AboutPageBackgrounds({ pinkPresence }: { pinkPresence: MotionValue<number> }) {
  return (
    <div className={ABOUT_BG_Z} aria-hidden>
      <div className="absolute inset-0" style={{ background: ABOUT_SECTION_BG }} />
      <div className={clsx("absolute inset-x-0 top-0 overflow-hidden", HERO_VIDEO_HEIGHT)}>
        <div className="relative w-full">
          <video
            src={ABOUT_HERO_VIDEO}
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
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ opacity: pinkPresence }}
        aria-hidden
      >
        <PinkOverlayLayers />
      </motion.div>
    </div>
  );
}

type PinkPanelStat = {
  value: string;
  label: string;
};

type PinkPanelCardProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  titlePaw?: boolean;
  closingPaw?: boolean;
  body: string;
  bodyClosing?: string;
  plainClosing?: boolean;
  tags?: string[];
  stats?: PinkPanelStat[];
  cta?: { label: string; href: string };
  footer?: string;
  demonMode: boolean;
  goldClosing?: boolean;
};

function PinkPanelCard({
  eyebrow,
  title,
  subtitle,
  titlePaw = false,
  closingPaw = false,
  body,
  bodyClosing,
  plainClosing = false,
  tags = [],
  stats = [],
  cta,
  footer,
  demonMode,
  goldClosing = false,
}: PinkPanelCardProps) {
  const bodyParagraphs = body.split(/\n\n+/).filter(Boolean);

  return (
    <motion.div
      className={clsx(
        "relative rounded-2xl p-5 backdrop-blur-xl sm:p-6 xl:rounded-3xl xl:p-8",
        demonMode
          ? "border border-[#F472B6]/55 bg-transparent"
          : "border border-white/70 bg-white/72"
      )}
      animate={{
        boxShadow: demonMode
          ? "none"
          : `0 28px 70px -28px ${ABOUT_MINO_GLOW}, 0 0 0 1px rgba(255,255,255,0.45)`,
      }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div className="relative flex flex-col gap-[0.25lh]">
        {eyebrow ? (
          <motion.p
            className="text-[11px] font-medium uppercase tracking-[0.22em] xl:text-xs"
            animate={{ color: demonMode ? ABOUT_GOLD : "rgba(190, 24, 93, 0.8)" }}
            transition={{ duration: 0.4 }}
          >
            {eyebrow}
          </motion.p>
        ) : null}
        {title ? (
          <motion.h2
            className="text-xl font-semibold leading-snug sm:text-2xl xl:text-3xl"
            animate={{
              color: demonMode ? "#FDF2F8" : "#4A1D35",
            }}
            transition={{ duration: 0.4 }}
          >
            {title}
            {titlePaw ? <AboutPawIcon className="-top-0.5 ml-3 align-middle sm:ml-4 xl:-top-1 xl:ml-5" /> : null}
          </motion.h2>
        ) : null}
        {(subtitle || bodyParagraphs.length > 0 || bodyClosing) && (
          <motion.div
            className="flex flex-col gap-[0.25lh] text-sm leading-[1.75] sm:text-[0.9375rem] lg:text-base xl:text-lg xl:leading-relaxed"
            animate={{ color: demonMode ? "rgba(253, 242, 248, 0.82)" : "rgba(107, 40, 72, 0.88)" }}
            transition={{ duration: 0.4 }}
          >
            {subtitle ? <p>{subtitle}</p> : null}
            {bodyParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {bodyClosing ? (
              goldClosing ? (
                <p className="border-t border-white/[0.07] pt-[0.25lh] text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-[#E8C36A] sm:text-sm sm:tracking-[0.16em]">
                  {bodyClosing}
                </p>
              ) : closingPaw ? (
                <p className="relative mt-[0.375lh] w-fit max-w-full self-start font-semibold">
                  {bodyClosing}
                  <AboutPawIcon className="pointer-events-none !absolute left-full top-1/2 ml-2 -translate-y-1/2 sm:ml-3 md:ml-4" />
                </p>
              ) : (
                <p className={plainClosing ? undefined : "font-semibold"}>{bodyClosing}</p>
              )
            ) : null}
          </motion.div>
        )}
        {footer ? (
          <motion.p
            className="text-sm font-medium not-italic xl:text-lg"
            animate={{ color: demonMode ? "rgba(249, 168, 212, 0.85)" : "rgba(74, 29, 53, 0.92)" }}
            transition={{ duration: 0.4 }}
          >
            {footer}
          </motion.p>
        ) : null}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <motion.span
                key={tag}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium"
                animate={{
                  borderColor: demonMode ? "rgba(244,114,182,0.45)" : "rgba(249,168,212,0.5)",
                  backgroundColor: demonMode ? "transparent" : "rgba(253,242,248,0.8)",
                  color: demonMode ? "#F9A8D4" : "#9D174D",
                }}
                style={{ borderWidth: 1, borderStyle: "solid" }}
                transition={{ duration: 0.4 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        ) : null}
        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 xl:gap-3">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                className="rounded-2xl px-3 py-3 text-center xl:px-4 xl:py-4"
                animate={{
                  borderColor: demonMode ? "rgba(244,114,182,0.4)" : "rgba(249,168,212,0.45)",
                  backgroundColor: demonMode ? "transparent" : "rgba(253,242,248,0.85)",
                }}
                style={{ borderWidth: 1, borderStyle: "solid" }}
                transition={{ duration: 0.4 }}
              >
                <motion.p
                  className="text-lg font-extrabold tracking-tight xl:text-2xl"
                  animate={{ color: demonMode ? "#FDF2F8" : "#4A1D35" }}
                  transition={{ duration: 0.4 }}
                >
                  {stat.value}
                </motion.p>
                <motion.p
                  className="mt-1 text-[11px] leading-snug xl:text-sm"
                  animate={{ color: demonMode ? "rgba(253, 242, 248, 0.72)" : "rgba(107, 40, 72, 0.8)" }}
                  transition={{ duration: 0.4 }}
                >
                  {stat.label}
                </motion.p>
              </motion.div>
            ))}
          </div>
        ) : null}
        {cta ? (
          <motion.div transition={{ duration: 0.4 }}>
            <Link
              href={cta.href}
              className={clsx(
                "inline-flex w-full items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition xl:px-6 xl:py-3 xl:text-base",
                demonMode
                  ? "border border-[#FBCFE8]/35 bg-transparent text-[#FDF2F8] hover:border-[#FBCFE8]/55 hover:bg-transparent"
                  : "bg-white text-[#4A1D35] ring-1 ring-[#F9A8D4]/25 hover:bg-[#FDF2F8]"
              )}
              style={
                demonMode
                  ? undefined
                  : {
                      boxShadow:
                        "0 12px 40px -6px rgba(244, 114, 182, 0.55), 0 4px 16px -2px rgba(251, 182, 206, 0.45)",
                    }
              }
            >
              {cta.label}
            </Link>
          </motion.div>
        ) : null}
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

const CHALLENGER_PEAKS = ABOUT_MINO_ACHIEVEMENTS.filter(
  (achievement) => achievement.tier === "CHALLENGER"
).sort((a, b) => {
  const order: Record<AboutMinoAchievement["role"], number> = {
    mid: 0,
    jng: 1,
    sup: 2,
    top: 3,
    adc: 4,
  };
  return order[a.role] - order[b.role];
});

function RankEmblemSlab({
  achievement,
  index,
  show,
}: {
  achievement: AboutMinoAchievement;
  index: number;
  show: boolean;
}) {
  const roleName = ROLE_LABEL[achievement.role];

  return (
    <motion.div
      className={clsx(
        "flex shrink-0 flex-col items-center",
        index === 1 && "-mt-8 md:-mt-12"
      )}
      initial={{ opacity: 0, y: 44 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: CREST_REVEAL_DURATION_S, delay: index * CREST_REVEAL_STAGGER_S, ease: EASE }}
    >
      <div
        className="relative flex h-40 w-40 items-center justify-center md:h-48 md:w-48"
        style={{ overflow: "visible" }}
        aria-hidden
      >
        <Image
          src={rankEmblemUrl(achievement.tier)}
          alt=""
          width={128}
          height={128}
          className="h-full w-full object-contain"
          style={{
            transform: "scale(6.5)",
            transformOrigin: "center",
          }}
          unoptimized
        />
      </div>

      <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-[#E8C36A]/70 md:tracking-[0.34em]">
        {roleName}
      </p>
    </motion.div>
  );
}

const CREST_REVEAL_STAGGER_S = 0.12;
const CREST_REVEAL_DURATION_S = 0.65;
const CREST_REVEAL_COMPLETE_MS =
  (CHALLENGER_PEAKS.length - 1) * CREST_REVEAL_STAGGER_S * 1000 +
  CREST_REVEAL_DURATION_S * 1000;
const HEADLINE_AFTER_LAST_CREST_MS = 700;
const CREST_TO_HEADLINE_GAP_MS = Math.round(
  (CREST_REVEAL_COMPLETE_MS + HEADLINE_AFTER_LAST_CREST_MS) / 2
);
const DEMON_PINK_OUTLINE_MS = 2000;
/** Matches pink-outline `demon` crossfade in `RankDemonCredentials`. */
const DEMON_PINK_OUTLINE_FADE_MS = 500;
const DEMON_PRELUDE_LOCK_MS = DEMON_PINK_OUTLINE_MS + DEMON_PINK_OUTLINE_FADE_MS;
const CREST_AFTER_DEMON_MS = 450;

const DEMON_TEXT_CLASS =
  "pointer-events-none absolute left-1/2 -translate-x-1/2 select-none font-black uppercase leading-none tracking-[-0.05em]";
const DEMON_STACK_TOP = "-top-7 md:-top-6";

const AFTERGLOW_BLOCK_GAP_PB = "pb-20 md:pb-24 lg:pb-28 xl:pb-36 2xl:pb-40";
const AFTERGLOW_BLOCK_GAP_MT = "mt-20 md:mt-24 lg:mt-28 xl:mt-36 2xl:mt-40";
const COACHING_FADE_SECTION_HEIGHT =
  "min-h-[130dvh] lg:min-h-[150dvh] xl:min-h-[165dvh]";
/** Long vertical wash: dark afterglow → pastel pink at the bottom. */
const BLACK_TO_PINK_GRADIENT = `linear-gradient(180deg, ${ABOUT_SECTION_BG} 0%, ${ABOUT_SECTION_BG} 6%, #0a101f 16%, #151028 28%, #2a1a32 42%, #523652 56%, #7a4d68 70%, #9E5880 84%, #C192AB 94%, #D0B0C4 100%)`;

function RankDemonCredentials({
  sectionRef,
  scrollTargetRef,
  demonRevealEnabled,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
  scrollTargetRef: React.RefObject<HTMLDivElement | null>;
  demonRevealEnabled: boolean;
}) {
  const [demonFinal, setDemonFinal] = useState(false);
  const [showCrests, setShowCrests] = useState(false);
  const [showHeadline, setShowHeadline] = useState(false);
  const [showPeakElo, setShowPeakElo] = useState(false);

  /** Parent enables only after prelude scroll centers the demon target. */
  const demonTriggered = demonRevealEnabled;

  useEffect(() => {
    if (!demonTriggered) return;

    const toFinal = window.setTimeout(() => setDemonFinal(true), DEMON_PINK_OUTLINE_MS);
    const crestsAt = DEMON_PINK_OUTLINE_MS + CREST_AFTER_DEMON_MS;
    const headlineAt = crestsAt + CREST_TO_HEADLINE_GAP_MS;
    const peakEloAt = headlineAt + CREST_TO_HEADLINE_GAP_MS;
    const toCrests = window.setTimeout(() => setShowCrests(true), crestsAt);
    const toHeadline = window.setTimeout(() => setShowHeadline(true), headlineAt);
    const toPeakElo = window.setTimeout(() => setShowPeakElo(true), peakEloAt);

    return () => {
      window.clearTimeout(toFinal);
      window.clearTimeout(toCrests);
      window.clearTimeout(toHeadline);
      window.clearTimeout(toPeakElo);
    };
  }, [demonTriggered]);

  return (
    <section
      ref={sectionRef}
      className={clsx("relative overflow-visible pt-14 md:pt-16", AFTERGLOW_BLOCK_GAP_PB)}
    >
      <div ref={scrollTargetRef} className="relative -translate-y-12 md:-translate-y-14">
      <motion.p
        className={clsx(
          DEMON_TEXT_CLASS,
          DEMON_STACK_TOP,
          "z-10 text-[clamp(5.5rem,25vw,16.5rem)]"
        )}
        style={{
          WebkitTextStroke: "2px #F472B6",
          color: "transparent",
          paintOrder: "stroke fill",
        }}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={
          demonTriggered
            ? { opacity: demonFinal ? 0 : 1, scale: 1.08 }
            : { opacity: 0, scale: 1.04 }
        }
        transition={{ duration: 0.5, ease: EASE }}
        aria-hidden
      >
        demon
      </motion.p>

      <motion.p
        className={clsx(
          DEMON_TEXT_CLASS,
          DEMON_STACK_TOP,
          "z-10 text-[clamp(5.35rem,24vw,16.25rem)]"
        )}
        style={{ color: "rgba(255,255,255,0.028)" }}
        initial={{ opacity: 0, scale: 1 }}
        animate={
          demonTriggered && demonFinal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }
        }
        transition={{ duration: 0.55, ease: EASE }}
        aria-hidden
      >
        demon
      </motion.p>

      <div className="relative z-20 mx-auto max-w-6xl overflow-visible px-5 pb-0 pt-2 md:pt-4">
        <div className="relative flex w-full flex-col items-center overflow-visible">
          <motion.div
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-full -translate-x-1/2 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={showHeadline ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.55, ease: EASE }}
            aria-hidden={!showHeadline}
          >
            <p
              className="text-[clamp(3.25rem,12vw,7rem)] font-black leading-[0.88] tracking-tighter text-white"
              style={{ textShadow: "0 0 100px rgba(232,195,106,0.12)" }}
            >
              3<span style={{ color: ABOUT_GOLD }}>×</span>
            </p>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.45em] text-[#F472B6]/85 md:tracking-[0.5em]">
              challenger
            </p>
          </motion.div>

          <div className="flex w-full max-w-7xl items-end justify-center gap-14 sm:gap-18 md:gap-28 lg:gap-32">
            {CHALLENGER_PEAKS.map((achievement, index) => (
              <RankEmblemSlab
                key={`${achievement.tier}-${achievement.role}`}
                achievement={achievement}
                index={index}
                show={showCrests}
              />
            ))}
          </div>

          <motion.p
            className="mt-8 text-center text-[12px] uppercase tracking-[0.4em] text-fg-muted/45 md:mt-10"
            initial={{ opacity: 0, y: 12 }}
            animate={showPeakElo ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.55, ease: EASE }}
            aria-hidden={!showPeakElo}
          >
            peak elo
          </motion.p>
        </div>
      </div>
      </div>
    </section>
  );
}

const OTHER_GAME_RANK_ROWS: { name: string; imageSrc: string; zoomIn?: boolean }[][] = [
  [
    { name: "Overwatch", imageSrc: "/images/about/Overwatch.jpg", zoomIn: true },
    { name: "Marvel Rivals", imageSrc: "/images/about/MarvelRivals.jpg", zoomIn: true },
    { name: "Apex Legends", imageSrc: "/images/about/Apex.jpg" },
  ],
  [
    { name: "Hearthstone", imageSrc: "/images/about/Heartstone.jpg", zoomIn: true },
    { name: "LoR", imageSrc: "/images/about/LoR.png", zoomIn: true },
  ],
  [{ name: "Marvel Snap", imageSrc: "/images/about/Omega.jpg", zoomIn: true }],
];

/** Stagger items within a row; extra pause between rows. */
const OTHER_GAME_ITEM_STAGGER_S = 0.07;
const OTHER_GAME_ROW_STAGGER_S = 0.28;
const OTHER_GAME_GRID_GAP = "gap-4 sm:gap-5 lg:gap-6 xl:gap-7";
const OTHER_GAME_REVEAL_X = 26;
const OTHER_GAME_REVEAL_DURATION_S = 0.52;

function otherGameRevealDelay(rowIndex: number, colIndex: number) {
  let delay = 0;
  for (let row = 0; row < rowIndex; row++) {
    delay += OTHER_GAME_RANK_ROWS[row].length * OTHER_GAME_ITEM_STAGGER_S + OTHER_GAME_ROW_STAGGER_S;
  }
  return delay + colIndex * OTHER_GAME_ITEM_STAGGER_S;
}

function OtherGameRankCard({
  name,
  imageSrc,
  zoomIn = false,
}: {
  name: string;
  imageSrc: string;
  zoomIn?: boolean;
}) {
  return (
    <div className="group relative size-24 sm:size-28 lg:size-32 xl:size-36">
      <div className="relative size-full overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] ring-1 ring-white/8">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className={clsx(
            "object-cover transition duration-500",
            zoomIn ? "scale-110 group-hover:scale-[1.14]" : "group-hover:scale-[1.04]"
          )}
          sizes="(max-width: 1024px) 112px, 144px"
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_40px_rgba(0,0,0,0.82),inset_0_6px_20px_rgba(0,0,0,0.72)]"
          aria-hidden
        />
      </div>
      <p className="pointer-events-none absolute right-0 top-full z-10 mt-0.5 whitespace-nowrap text-right text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:text-[10px]">
        {name}
      </p>
    </div>
  );
}

function PlayForMyselfPanel({ inView }: { inView: boolean }) {
  return (
    <motion.div
      className="relative w-full max-w-sm sm:max-w-md md:max-w-[22rem] lg:max-w-md xl:max-w-lg"
      initial={{ opacity: 0, x: -36 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -36 }}
      transition={{ duration: 0.62, delay: 0.08, ease: EASE }}
    >
      <PinkPanelCard
        demonMode
        goldClosing
        title="I play for myself."
        body={
          "The game doesn't care about how you feel. I want the dragon. I want to win. I want to help my team. But I don't play based on what I want."
        }
        bodyClosing="I play based on what's possible."
      />
    </motion.div>
  );
}

function CoachingPanel({ inView }: { inView: boolean }) {
  return (
    <motion.div
      className="relative w-full max-w-sm sm:max-w-md md:max-w-[22rem] lg:max-w-md xl:max-w-xl 2xl:max-w-xl"
      initial={{ opacity: 0, x: -72, y: 36 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: -72, y: 36 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      <PinkPanelCard
        demonMode
        eyebrow="Coaching"
        title="I have 5 years of coaching experience!"
        body={
          "In 2020 I started coaching and got something like ~2000 sessions done since then for all roles and ranks.\n\n" +
          "Feel free to check it out, I swear it's lowkey goated."
        }
        stats={[
          { value: "500+", label: "Student reviews" },
          { value: "4.9/5", label: "Average rating" },
        ]}
        cta={{ label: "Learn more", href: "/coaching" }}
      />
    </motion.div>
  );
}

function CoachingFadeSection() {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRoot = useContext(OverlayScrollRootContext);
  const panelInView = useTriggerAtViewportHeight(
    panelRef,
    scrollRoot,
    PANEL_VIEWPORT_TRIGGER_RATIO
  );

  return (
    <section
      className={clsx(
        "relative px-5 pb-24 pt-0 md:px-8 md:pb-32",
        COACHING_FADE_SECTION_HEIGHT
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: BLACK_TO_PINK_GRADIENT }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-start pt-20 md:pt-28 lg:pt-36 xl:pt-40 xl:max-w-7xl">
        <div
          ref={panelRef}
          className="mr-auto w-full md:ml-[5%] xl:ml-[8%] 2xl:ml-[10%]"
        >
          <CoachingPanel inView={panelInView} />
        </div>
      </div>
    </section>
  );
}

function RankAfterglowSection() {
  const panelRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);
  const scrollRoot = useContext(OverlayScrollRootContext);
  const panelInView = useTriggerAtViewportHeight(
    panelRef,
    scrollRoot,
    PANEL_VIEWPORT_TRIGGER_RATIO
  );
  const gamesInView = useTriggerAtViewportHeight(
    gamesRef,
    scrollRoot,
    PANEL_VIEWPORT_TRIGGER_RATIO
  );

  return (
    <section className="relative px-5 pb-0 pt-0 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col xl:max-w-7xl">
        <div ref={panelRef} className="md:ml-[4%] xl:ml-[6%] 2xl:ml-[8%]">
          <PlayForMyselfPanel inView={panelInView} />
        </div>

        <div
          ref={gamesRef}
          className={clsx(
            "ml-auto w-full max-w-xl pr-4 text-right sm:pr-6 md:pr-8 xl:pr-12 2xl:pr-16",
            AFTERGLOW_BLOCK_GAP_MT
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={gamesInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <SectionLabel gold>Beyond League</SectionLabel>
          </motion.div>

          <div className={clsx("mt-2 flex flex-col items-end sm:mt-2.5", OTHER_GAME_GRID_GAP)}>
            {OTHER_GAME_RANK_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className={clsx("flex justify-end", OTHER_GAME_GRID_GAP)}>
                  {row.map((game, colIndex) => {
                    const delay = otherGameRevealDelay(rowIndex, colIndex);

                    return (
                      <motion.div
                        key={game.name}
                        initial={{ opacity: 0, x: -OTHER_GAME_REVEAL_X }}
                        animate={
                          gamesInView
                            ? { opacity: 1, x: 0 }
                            : { opacity: 0, x: -OTHER_GAME_REVEAL_X }
                        }
                        transition={{
                          duration: OTHER_GAME_REVEAL_DURATION_S,
                          delay,
                          ease: EASE,
                        }}
                      >
                        <OtherGameRankCard
                          name={game.name}
                          imageSrc={game.imageSrc}
                          zoomIn={game.zoomIn}
                        />
                      </motion.div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AboutMinoClient() {
  const pinkZoneRef = useRef<HTMLDivElement>(null);
  const demonSectionRef = useRef<HTMLElement>(null);
  const demonScrollTargetRef = useRef<HTMLDivElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const prevZoneRef = useRef<"pink" | "dark">("pink");
  const animDirectionRef = useRef<"out" | "in" | null>(null);
  const metricsRef = useRef({ reveal: 0, exit: 0 });
  const blinkAnimatingRef = useRef(false);
  const blinkControlRef = useRef<ReturnType<typeof animate> | null>(null);
  const preludeRunningRef = useRef(false);
  const preludeCompleteRef = useRef(false);
  const unlockScrollRef = useRef<(() => void) | null>(null);
  const demonCenterYRef = useRef<number | null>(null);
  const scrollViewport = useOverlayScrollViewport();
  const pinkReveal = useMotionValue(0);
  const pinkExit = useMotionValue(0);
  const pinkPresence = useMotionValue(0);
  const panel1Presence = useMotionValue(0);
  const panel2Presence = useMotionValue(0);
  const [panelDemonMode, setPanelDemonMode] = useState(false);
  const [demonRevealEnabled, setDemonRevealEnabled] = useState(false);
  const setPanelDemonModeRef = useRef(setPanelDemonMode);
  setPanelDemonModeRef.current = setPanelDemonMode;

  useOneShotPanelReveal(panel1Ref, scrollViewport, panel1Presence);
  useOneShotPanelReveal(panel2Ref, scrollViewport, panel2Presence);

  useEffect(() => {
    if (!scrollViewport) return;

    const overlayZone = (exit: number) => (exit > 0 ? "dark" : "pink");

    const syncSteadyOverlay = () => {
      const { reveal, exit } = metricsRef.current;
      if (exit > 0) return;
      pinkPresence.set(pinkTopFade(reveal));
    };

    const ensureLightsOut = () => {
      if (blinkAnimatingRef.current) return;
      if (pinkPresence.get() <= 0.01) {
        pinkPresence.set(0);
        return;
      }
      void startBlinkOut();
    };

    const stopBlink = () => {
      blinkControlRef.current?.stop();
      blinkControlRef.current = null;
      blinkAnimatingRef.current = false;
      animDirectionRef.current = null;
    };

    const startBlinkOut = () =>
      new Promise<void>((resolve) => {
        stopBlink();
        setPanelDemonModeRef.current(true);
        blinkAnimatingRef.current = true;
        animDirectionRef.current = "out";
        const from = pinkPresence.get();
        blinkControlRef.current = animate(pinkPresence, [from, 0], {
          duration: LIGHTS_OUT_DURATION_S,
          ease: LIGHTS_OUT_EASE,
          onComplete: () => {
            stopBlink();
            syncSteadyOverlay();
            resolve();
          },
        });
      });

    const startBlinkIn = (target: number) => {
      stopBlink();
      setPanelDemonModeRef.current(false);
      blinkAnimatingRef.current = true;
      animDirectionRef.current = "in";
      const from = pinkPresence.get();
      blinkControlRef.current = animate(pinkPresence, [from, target], {
        duration: LIGHTS_IN_DURATION_S,
        ease: LIGHTS_IN_EASE,
        onComplete: () => {
          stopBlink();
          syncSteadyOverlay();
        },
      });
    };

    const shouldStartDemonPrelude = () => {
      if (preludeCompleteRef.current || preludeRunningRef.current) return false;

      const demonEl = demonScrollTargetRef.current ?? demonSectionRef.current;
      if (!demonEl) return false;

      const containerRect = scrollViewport.getBoundingClientRect();
      const elRect = demonEl.getBoundingClientRect();
      const elCenter = elRect.top + elRect.height / 2 - containerRect.top;
      const viewCenter = containerRect.height / 2;
      const prevCenter = demonCenterYRef.current;
      demonCenterYRef.current = elCenter;

      const inBand = Math.abs(elCenter - viewCenter) <= DEMON_CENTER_TOLERANCE_PX;
      const crossedCenter =
        prevCenter !== null &&
        prevCenter > viewCenter + DEMON_CENTER_TOLERANCE_PX &&
        elCenter <= viewCenter + DEMON_CENTER_TOLERANCE_PX;

      return inBand || crossedCenter;
    };

    const runDemonPrelude = async () => {
      if (preludeRunningRef.current || preludeCompleteRef.current) return;

      const demonEl = demonScrollTargetRef.current ?? demonSectionRef.current;
      if (!demonEl || !shouldStartDemonPrelude()) return;

      preludeRunningRef.current = true;

      try {
        unlockScrollRef.current = lockScrollViewport(scrollViewport);
        await startBlinkOut();
        preludeCompleteRef.current = true;
        prevZoneRef.current = overlayZone(metricsRef.current.exit);
        setDemonRevealEnabled(true);
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, DEMON_PRELUDE_LOCK_MS);
        });
      } finally {
        unlockScrollRef.current?.();
        unlockScrollRef.current = null;
        preludeRunningRef.current = false;
      }
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

      if (preludeRunningRef.current) return;

      if (!preludeCompleteRef.current) {
        if (exit > 0) {
          ensureLightsOut();
        } else if (!blinkAnimatingRef.current) {
          syncSteadyOverlay();
        }
        if (shouldStartDemonPrelude()) {
          void runDemonPrelude();
        }
        return;
      }

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
            ensureLightsOut();
          }
        }

        prevZoneRef.current = currentZone;
        return;
      }

      if (exit > 0) {
        ensureLightsOut();
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
      unlockScrollRef.current?.();
      unlockScrollRef.current = null;
      scrollViewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollViewport, pinkReveal, pinkExit, pinkPresence]);

  const panel1Opacity = panel1Presence;
  const panel1X = useTransform(panel1Presence, [0, 1], [72, 0]);
  const panel1Y = useTransform(panel1Presence, [0, 1], [28, 0]);
  const panel2Opacity = panel2Presence;
  const panel2X = useTransform(panel2Presence, [0, 1], [-72, 0]);
  const panel2Y = useTransform(panel2Presence, [0, 1], [36, 0]);

  return (
    <OverlayScrollRootContext.Provider value={scrollViewport}>
      <div className="relative w-full overflow-x-hidden text-white">
        <AboutPageBackgrounds pinkPresence={pinkPresence} />

        <div className={ABOUT_CONTENT_Z}>
          {/* ── HERO (content only) ── */}
          <section className={clsx("flex flex-col justify-end", HERO_CONTENT_HEIGHT)}>
            <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-20 md:px-8 md:pb-32 md:pt-24 xl:pb-36 2xl:pb-40">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 3.2 }}
              >
                <SectionLabel>Vtuber · coach · femboy</SectionLabel>
                <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[4.875rem]">
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
                <p className="mt-5 max-w-xl text-base text-fg-muted/90 md:text-lg lg:text-xl xl:text-[1.3125rem] 2xl:text-[1.375rem]">
                  <StripeRevealText
                    text="Fixing the League community, one stream at a time"
                    delay={3900}
                    duration={2400}
                    accentColor={ABOUT_MINO_ACCENT}
                    className="text-base md:text-lg lg:text-xl xl:text-[1.3125rem] 2xl:text-[1.375rem]"
                  />
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6, duration: 0.8 }}
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

          {/* ── PINK SCROLL ZONE ── */}
          <div
            ref={pinkZoneRef}
            className={clsx(
              "flex flex-col px-5 pb-24 pt-0 md:px-8 md:pb-32 md:pt-[4vh]",
              PINK_SECTION_HEIGHT
            )}
          >
            <div className="flex w-full min-h-0 flex-1 flex-col">
              <div className="flex-1" aria-hidden />
              <motion.div
                ref={panel1Ref}
                className="ml-auto w-full max-w-sm sm:max-w-md md:max-w-[22rem] lg:max-w-md xl:max-w-xl 2xl:max-w-xl md:mr-[5%] xl:mr-[8%] 2xl:mr-[10%]"
                style={{ opacity: panel1Opacity, x: panel1X, y: panel1Y }}
              >
                <PinkPanelCard
                  demonMode={panelDemonMode}
                  eyebrow="Hello~"
                  title="I'm Mino! It's nice to meet you"
                  body={
                    "I'm a catboy, VTuber, League coach, #1 Viego, femboy.\n\n" +
                    "I stream League and try to be educational sometimes... I'm obsessed with the color pink and making things look pretty!"
                  }
                  bodyClosing="Let's be friends, MEOW"
                  plainClosing
                />
              </motion.div>

              <div
                className="min-h-[22vh] flex-[4] shrink-0 lg:min-h-[26vh] xl:min-h-[20vh] xl:flex-[2]"
                aria-hidden
              />

              <motion.div
                ref={panel2Ref}
                className="mr-auto w-full max-w-sm sm:max-w-md md:max-w-[22rem] lg:max-w-md xl:max-w-xl 2xl:max-w-xl md:ml-[5%] xl:ml-[8%] 2xl:ml-[10%]"
                style={{ opacity: panel2Opacity, x: panel2X, y: panel2Y }}
              >
                <PinkPanelCard
                  demonMode={panelDemonMode}
                  eyebrow="Mission"
                  title="My goal"
                  closingPaw
                  body={
                    "The League community is known for its toxicity and I'd like to change that!! or at least try... >.<\n\n" +
                    "If someone's having a bad game they already feel bad about that. Making them feel worse deteriorates the game quality and mental health of the community long-term, which led us to where we are now..."
                  }
                  bodyClosing="Let's make a difference together!"
                />
              </motion.div>

              <div className="min-h-0 flex-[4] xl:flex-[6]" aria-hidden />
            </div>
          </div>

          <RankDemonCredentials
            sectionRef={demonSectionRef}
            scrollTargetRef={demonScrollTargetRef}
            demonRevealEnabled={demonRevealEnabled}
          />

          <RankAfterglowSection />

          <CoachingFadeSection />

          <section className="flex min-h-[45vh] flex-col items-center justify-center px-5 pb-28 pt-20 text-center md:px-8 md:pb-36 md:pt-28">
            <p className="text-base text-fg-muted/50 md:text-lg">
              work in progress, adding more soon :3
            </p>
          </section>
        </div>
      </div>
    </OverlayScrollRootContext.Provider>
  );
}

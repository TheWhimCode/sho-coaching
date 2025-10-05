"use client";

import { ReactNode, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import type { Slot as UiSlot } from "@/components/AvailableSlots";
import CenterSessionPanel from "./CenterSessionPanel";
import { fetchSuggestedStarts } from "@/lib/booking/suggest";
import { SlotStatus } from "@prisma/client";
import { computeQuickPicks } from "@/lib/booking/quickPicks";
import { fetchSlots } from "@/utils/api";
import type { Slot } from "@/utils/api";
import LeftSteps from "./LeftSteps";
import RightBookingPanel from "./RightBooking";
import { getPreset } from "@/lib/sessions/preset";
import { stepsByPreset } from "@/lib/sessions/steps";
import { titlesByPreset, taglinesByPreset } from "@/lib/sessions/labels";
import Calendar from "@/app/calendar/Calendar";

type Props = {
  title: string;
  subtitle: string;
  image: string;
  children?: ReactNode;
  followups?: number;
  onCustomize?: () => void;
  onOpenCalendar?: (opts: { slotId?: string; liveMinutes: number }) => void;
  slots?: UiSlot[];
  baseMinutes?: number;
  isCustomizingCenter?: boolean;
  isDrawerOpen?: boolean;
  liveBlocks?: number;
  presetOverride?: "vod" | "signature" | "instant" | "custom";
  /** 0 = fixed, 1 = same as content */
  parallaxSpeed?: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const BG_FADE_DURATION = 1;
const CONTENT_BASE_DELAY = 0.8;

const TITLE_DELAY   = CONTENT_BASE_DELAY + 0.15;
const TAGLINE_DELAY = CONTENT_BASE_DELAY + 0.35;
const PANEL_DELAY   = {
  left:   CONTENT_BASE_DELAY + 0.20,
  center: CONTENT_BASE_DELAY + 0.60,
  right:  CONTENT_BASE_DELAY + 1.00,
} as const;

// Parallax safety buffer: the image is always this much taller than the viewport on mobile.
// This prevents any height changes (and thus skips) after mount.
const MAX_BG_EXTRA_PX = 320;

// End the intro lock a bit after the last delayed panel.
const INTRO_LOCK_MS = Math.round((PANEL_DELAY.right + 0.5) * 1000);

const makeTitleVariants = (firstLoad: boolean) => ({
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1, x: 0,
    transition: { duration: firstLoad ? 0.40 : 0.22, ease: EASE, delay: firstLoad ? TITLE_DELAY : 0.25 },
  },
  exit: { opacity: 0, x: 24, transition: { duration: 0.18, ease: EASE } },
});

const makeTaglineVariants = (firstLoad: boolean) => ({
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1, x: 0,
    transition: { duration: firstLoad ? 0.38 : 0.20, ease: EASE, delay: firstLoad ? TAGLINE_DELAY : 0.40 },
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.16, ease: EASE } },
});

export default function SessionHero({
  title,
  subtitle,
  image,
  onCustomize,
  onOpenCalendar,
  slots,
  followups,
  baseMinutes = 60,
  isCustomizingCenter = false,
  isDrawerOpen = false,
  liveBlocks = 0,
  presetOverride,
  parallaxSpeed = 0.1,
}: Props) {
  const [autoSlots, setAutoSlots] = useState<UiSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedSlots, setSeedSlots] = useState<Slot[]>([]);
  const [quickPool, setQuickPool] = useState<{ id: string; startISO: string }[]>([]);
  const [showCal, setShowCal] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | null>(null);
  const [drawerW, setDrawerW] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  useEffect(() => { setIsFirstLoad(false); }, []);

  const baseOnly = baseMinutes ?? 60;
  const liveMinutesRaw = baseOnly + (liveBlocks ?? 0) * 45;
  const liveMinutes = Math.min(120, Math.max(30, liveMinutesRaw));

  const computedPreset = getPreset(baseOnly, followups ?? 0, liveBlocks ?? 0);
  const preset = presetOverride ?? computedPreset;
  const leftSteps = stepsByPreset[preset];

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Parallax (mobile only) — image height never changes after mount
  const sectionRef = useRef<HTMLElement | null>(null);
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), INTRO_LOCK_MS);
    return () => clearTimeout(t);
  }, []);

  // Measure travel (for mapping) but clamp to the preallocated extra.
  const [travelPx, setTravelPx] = useState(0);
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const measure = () => {
      if (isDesktop) { setTravelPx(0); return; }
      const sectionH = el.offsetHeight;
      const vh = window.innerHeight;
      const scrollable = Math.max(0, sectionH - vh);
      const speed = Math.max(0, Math.min(1, parallaxSpeed));
      const travel = Math.min(MAX_BG_EXTRA_PX, Math.max(0, scrollable * (1 - speed)));
      setTravelPx(travel);
    };

    // Measure twice across frames for initial stability
    const r1 = requestAnimationFrame(measure);
    const r2 = requestAnimationFrame(measure);

    // After intro, allow updates on real viewport changes only
    const onResize = () => measure();
    const onOrient = () => measure();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onOrient);

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrient);
    };
  }, [parallaxSpeed, isDesktop]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Map scroll → parallax, but keep y frozen until the intro ends
  const bgYActive = useTransform(scrollYProgress, [0, 1], [0, travelPx]);

  useEffect(() => {
    const calc = () => setDrawerW(Math.min(440, window.innerWidth * 0.92));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const end = new Date(tomorrow);
        end.setDate(end.getDate() + 21);
        end.setHours(23, 59, 59, 999);
        const rows = await fetchSlots(tomorrow, end, liveMinutes);
        if (!on) return;
        setSeedSlots(rows);
        setQuickPool(rows.map((r) => ({ id: r.id, startISO: r.startTime ?? (r as any).startISO })));
      } catch {}
    })();
    return () => { on = false; };
  }, [liveMinutes]);

  useEffect(() => {
    let on = true;
    setLoading(true);
    (async () => {
      try {
        const s = await fetchSuggestedStarts(liveMinutes);
        if (!on) return;
        setAutoSlots(
          s.map((x) => ({
            id: x.id,
            startISO: x.startTime,
            durationMin: liveMinutes,
            status: SlotStatus.free,
          }))
        );
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [liveMinutes]);

  const quick = useMemo(() => computeQuickPicks(quickPool), [quickPool]);
  const quickUiSlots: UiSlot[] = quick.map((q) => ({
    id: q.id,
    startISO: q.startISO,
    durationMin: liveMinutes,
    status: SlotStatus.free,
    label: q.label,
  }));

  const shiftX = isDrawerOpen && isDesktop ? drawerW / 2 : 0;

  const handleOpenCalendar = (opts: { slotId?: string; liveMinutes: number }) => {
    setInitialSlotId(opts.slotId ?? null);
    setShowCal(true);
  };

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-[100svh] md:h-[100svh] overflow-hidden overscroll-contain text-white vignette"
    >
      {/* background */}
      <motion.div
        className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: BG_FADE_DURATION, ease: EASE }}
      >
        {/* Desktop: video */}
        <video
          src="/videos/customize/Particle1_slow.webm"
          autoPlay
          muted
          loop
          playsInline
          className="hidden md:block h-full w-full object-cover object-left md:object-center"
        />

        {/* Mobile: static image with parallax */}
        <motion.img
          src="/videos/customize/Particle_static.png"
          alt=""
          className="block md:hidden w-full object-cover object-left will-change-transform"
          loading="eager"
          style={{
            // Fixed extra height from the start — never changes post-mount
            height: `calc(100% + ${MAX_BG_EXTRA_PX}px)`,
            // Only move after intro; until then keep y=0
            y: !isDesktop && introDone ? bgYActive : 0,
          }}
          initial={false}
        />

        <div className="absolute inset-0 bg-black/20" />
      </motion.div>

      {/* content */}
      <motion.div
        className="relative z-20 h-full flex items-center py-5 md:py-14"
        animate={{ x: shiftX }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
          <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-[1.2fr_1.1fr_.95fr] items-start">
            {/* Reserve header space on mobile */}
            <header className="md:col-span-3 mb-0 md:mb-4 min-h-[110px] md:min-h-0">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={preset}
                  variants={makeTitleVariants(isFirstLoad)}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="text-4xl font-extrabold leading-tight md:text-6xl lg:text-5xl"
                >
                  {titlesByPreset[preset]}
                </motion.h1>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p
                  key={preset + "-tag"}
                  variants={makeTaglineVariants(isFirstLoad)}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="mt-2 text-white/80 text-xl md:text-2xl italic"
                >
                  {taglinesByPreset[preset]}
                </motion.p>
              </AnimatePresence>
            </header>

            {/* LEFT — hidden on mobile */}
            <div className="hidden md:block self-start">
              <LeftSteps
                steps={leftSteps}
                title="How it works"
                animKey={preset}
                preset={preset}
                enterDelay={PANEL_DELAY.left}
              />
            </div>

            {/* CENTER — reserve space on mobile */}
            <motion.div
              className="self-start min-h-[400px] md:min-h-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: PANEL_DELAY.center }}
            >
              <CenterSessionPanel
                title={title}
                baseMinutes={baseMinutes}
                isCustomizing={isCustomizingCenter}
                followups={followups ?? 0}
                liveBlocks={liveBlocks}
              />
            </motion.div>

            {/* RIGHT — reserve space on mobile */}
            <motion.div
              className="min-h-[300px] md:min-h-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: PANEL_DELAY.right }}
            >
              <RightBookingPanel
                liveMinutes={liveMinutes}
                loading={loading}
                slots={quickUiSlots}
                onOpenCalendar={onOpenCalendar ?? handleOpenCalendar}
                onCustomize={onCustomize ?? (() => setShowCal(true))}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Mobile dimmer when calendar is open */}
      <AnimatePresence>
        {showCal && (
          <motion.div
            key="mobile-dim"
            className="fixed inset-0 z-30 md:hidden bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Calendar overlay */}
      {showCal && (
        <Calendar
          sessionType={titlesByPreset[preset]}
          liveMinutes={liveMinutes}
          prefetchedSlots={seedSlots}
          initialSlotId={initialSlotId}
          onClose={() => setShowCal(false)}
          liveBlocks={liveBlocks}
          followups={followups ?? 0}
        />
      )}
    </section>
  );
}

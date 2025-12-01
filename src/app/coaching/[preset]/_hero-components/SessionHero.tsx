"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Slot as UiSlot } from "@/components/AvailableSlots";
import CenterSessionPanel from "./CenterSessionPanel";
import { fetchSuggestedStarts } from "@/lib/booking/suggest";
import { SlotStatus } from "@prisma/client";
import { computeQuickPicks } from "@/lib/booking/quickPicks";
import { fetchSlots } from "@/utils/api";
import type { Slot } from "@/utils/api";
import LeftSteps from "./LeftSteps";
import RightBookingPanel from "./RightBooking";
import Calendar from "@/app/calendar/Calendar";

// ⬇ Engine imports only
import {
  clamp,
  totalMinutes,
  getPreset,
  titlesByPreset,
  taglinesByPreset,
  stepsByPreset,
  type Preset,
} from "@/engine/session";
import type { ProductId } from "@/engine/session";


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
productId?: ProductId;
  presetOverride?: Preset;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const BG_FADE_DURATION = 3;
const CONTENT_BASE_DELAY = 0.8;

const TITLE_DELAY = CONTENT_BASE_DELAY + 0.15;
const TAGLINE_DELAY = CONTENT_BASE_DELAY + 0.35;
const PANEL_DELAY = {
  left: CONTENT_BASE_DELAY + 0.2,
  center: CONTENT_BASE_DELAY + 0.6,
  right: CONTENT_BASE_DELAY + 1.0,
} as const;

/* animations unchanged */
const makeTitleVariants = (firstLoad: boolean) => ({
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: firstLoad ? 0.4 : 0.22,
      ease: EASE,
      delay: firstLoad ? TITLE_DELAY : 0.25,
    },
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: { duration: 0.18, ease: EASE },
  },
});

const makeTaglineVariants = (firstLoad: boolean) => ({
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: firstLoad ? 0.38 : 0.2,
      ease: EASE,
      delay: firstLoad ? TAGLINE_DELAY : 0.4,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.16, ease: EASE },
  },
});

export default function SessionHero({
  title,
  subtitle,
  image,
  onCustomize,
  onOpenCalendar,
  slots,
  followups = 0,
  baseMinutes = 60,
  isCustomizingCenter = false,
  isDrawerOpen = false,
  liveBlocks = 0,
  presetOverride,
  productId,
}: Props) {

  // ✔ unified engine logic
  const session = clamp({ liveMin: baseMinutes, followups, liveBlocks, productId });
  const liveMinutes = totalMinutes(session);

  // now bundle-aware
  const computedPreset = getPreset(
    session.liveMin,
    session.followups,
    session.liveBlocks,
    session.productId,
  );

  const preset = presetOverride ?? computedPreset;
  const leftSteps = stepsByPreset[preset];

  const [autoSlots, setAutoSlots] = useState<UiSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedSlots, setSeedSlots] = useState<Slot[]>([]);
  const [quickPool, setQuickPool] = useState<{ id: string; startISO: string }[]>([]);
  const [showCal, setShowCal] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | null>(null);
  const [drawerW, setDrawerW] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  const [minHHeader, setMinHHeader] = useState(110);
  const [minHCenter, setMinHCenter] = useState(400);
  const [minHRight, setMinHRight] = useState(300);

  const measureHeights = () => {
    if (isDesktop) return;
    setMinHHeader(prev => Math.max(prev, headerRef.current?.offsetHeight ?? prev));
    setMinHCenter(prev => Math.max(prev, centerRef.current?.offsetHeight ?? prev));
    setMinHRight(prev => Math.max(prev, rightRef.current?.offsetHeight ?? prev));
  };

  useEffect(() => setIsFirstLoad(false), []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const calc = () => setDrawerW(Math.min(440, window.innerWidth * 0.92));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // ---- data fetching unchanged
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
        setQuickPool(rows.map(r => ({
          id: r.id,
          startISO: r.startTime ?? (r as any).startISO
        })));
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
          s.map(x => ({
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
  const quickUiSlots: UiSlot[] = quick.map(q => ({
    id: q.id,
    startISO: q.startISO,
    durationMin: liveMinutes,
    status: SlotStatus.free,
    label: q.label,
  }));

  const shiftX = isDrawerOpen && isDesktop ? drawerW / 2 : 0;

  useEffect(() => {
    const t = setTimeout(measureHeights, 0);
    return () => clearTimeout(t);
  }, [isDesktop, loading, preset, baseMinutes, liveBlocks, followups]);

  const handleOpenCalendar = (opts: { slotId?: string; liveMinutes: number }) => {
    setInitialSlotId(opts.slotId ?? null);
    setShowCal(true);
  };

  return (
    <section className="relative isolate min-h-[100svh] md:h-[100svh] overflow-hidden overscroll-contain text-white vignette">
      
      {/* ✔ restored background exactly like original */}
      <motion.div
        className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: BG_FADE_DURATION, ease: EASE }}
      >
        <video
          src="/videos/customize/Particle1_slow.webm"
          autoPlay
          muted
          loop
          playsInline
          className="hidden md:block h-full w-full object-cover object-left md:object-center"
        />
        <img
          src="/videos/customize/Particle_static.png"
          alt=""
          className="block md:hidden h-full w-full object-cover object-left"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/20" />
      </motion.div>

      {/* content unchanged */}
      <motion.div
        className="relative z-20 h-full flex items-center py-5 md:py-14"
        animate={{ x: shiftX }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
          <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-[1.2fr_1.1fr_.95fr] items-start">
            
            {/* HEADER */}
            <div
              style={!isDesktop ? { minHeight: minHHeader } : undefined}
              ref={headerRef}
              className="md:col-span-3 mb-0 md:mb-4"
            >
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
            </div>

            {/* LEFT */}
            <div className="hidden md:block self-start">
              <LeftSteps
                steps={leftSteps}
                title="How it works"
                animKey={preset}
                preset={preset}
                enterDelay={PANEL_DELAY.left}
              />
            </div>

            {/* CENTER */}
            <motion.div
              style={!isDesktop ? { minHeight: minHCenter } : undefined}
              ref={centerRef}
              className="self-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: PANEL_DELAY.center }}
            >
<CenterSessionPanel
  session={session}
  preset={preset}
  isCustomizing={isCustomizingCenter}
/>


            </motion.div>

            {/* RIGHT */}
            <motion.div
              style={!isDesktop ? { minHeight: minHRight } : undefined}
              ref={rightRef}
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

      {showCal && (
        <Calendar
          sessionType={titlesByPreset[preset]}
          liveMinutes={liveMinutes}
          prefetchedSlots={seedSlots}
          initialSlotId={initialSlotId}
          onClose={() => setShowCal(false)}
          liveBlocks={session.liveBlocks}
          followups={session.followups}
        />
      )}
    </section>
  );
}

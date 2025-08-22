// components/HeroSection/SessionHero.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AvailableSlots, { Slot as UiSlot } from "@/components/AvailableSlots";
import CenterSessionPanel from "@/components/CenterSessionPanel";
import { fetchSuggestedStarts } from "@/lib/booking/suggest";
import { SlotStatus } from "@prisma/client";
import { computeQuickPicks } from "@/lib/booking/quickPicks";
import { fetchSlots } from "@/utils/api";
import LeftSteps from "@/components/HeroSection/LeftSteps";
import RightBookingPanel from "@/components/HeroSection/RightBooking";
import { getPreset } from "@/lib/sessions/preset";
import { stepsByPreset } from "@/lib/sessions/steps";
import { titlesByPreset, taglinesByPreset } from "@/lib/sessions/labels";
import { colorsByPreset } from "@/lib/sessions/colors";


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
  basePriceEUR?: number;
  extraMinutes?: number;
  totalPriceEUR?: number;
  isCustomizingCenter?: boolean;
  /** ← pass drawerOpen here */
  isDrawerOpen?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const TITLE_DELAY   = 0.25;
const TAGLINE_DELAY = 0.5;

const titleVariants = {
  hidden: { opacity: 0, x: -24 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.40, ease: EASE, delay: TITLE_DELAY } },
  exit:   { opacity: 0, x: 24,  transition: { duration: 0.20, ease: EASE } },
};

const taglineVariants = {
  hidden: { opacity: 0, x: -20 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.38, ease: EASE, delay: TAGLINE_DELAY } },
  exit:   { opacity: 0, x: 20,  transition: { duration: 0.18, ease: EASE } },
};
export default function SessionHero({
  title,
  subtitle,
  image,
  onCustomize,
  onOpenCalendar,
  slots,
  followups,
  baseMinutes = 60,
  basePriceEUR = 50,
  extraMinutes = 0,
  totalPriceEUR = 50,
  isCustomizingCenter = false,
  isDrawerOpen = false,
}: Props) {
  const [autoSlots, setAutoSlots] = useState<UiSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickPool, setQuickPool] = useState<{ id: string; startISO: string }[]>([]);
  const [drawerW, setDrawerW] = useState(0); // px

  const liveMinutes = (baseMinutes ?? 60) + (extraMinutes ?? 0);
  const preset = getPreset(liveMinutes, followups ?? 0);
  const leftSteps = stepsByPreset[preset];

  // match CustomizeDrawer width: w-[min(440px,92vw)]
  useEffect(() => {
    const calc = () => setDrawerW(Math.min(440, window.innerWidth * 0.92));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // fetch quick-pick pool
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
        setQuickPool(rows.map((r: any) => ({ id: r.id, startISO: r.startTime ?? r.startISO })));
      } catch {}
    })();
    return () => { on = false; };
  }, [liveMinutes]);

  // fetch autoslots
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

  // shift by half the drawer width so the hero stays centered in the remaining space
  const shiftX = isDrawerOpen ? drawerW / 2 : 0;

  return (
    <section className="relative isolate h-[100svh] overflow-hidden text-white vignette">
      {/* background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <video src="/videos/hero-test.mp4" autoPlay muted loop playsInline className="h-full w-full object-cover [filter:grayscale(1)_contrast(1.05)_brightness(.8)]" />
        <div className="absolute inset-0 mix-blend-color bg-[#1f3d8b]/90" />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="absolute inset-0 hud-grid pointer-events-none z-0" />
      <div className="absolute inset-0 scanlines pointer-events-none z-0" />
      <div className="absolute inset-0 noise pointer-events-none z-0" />

      {/* content — animated */}
      <motion.div
        className="relative z-20 h-full flex items-center py-10 md:py-14"
        animate={{ x: shiftX }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
          <div className="grid md:grid-cols-[1.2fr_1.1fr_.95fr] gap-5 items-start">
            <header className="md:col-span-3 mb-2 md:mb-4">
  <AnimatePresence mode="wait">
    <motion.h1
      key={preset}
      variants={titleVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="text-5xl font-extrabold leading-tight md:text-6xl lg:text-5xl"  // smaller than before
    >
      {titlesByPreset[preset]}
    </motion.h1>
  </AnimatePresence>

  <AnimatePresence mode="wait">
    <motion.p
      key={preset + "-tag"}
      variants={taglineVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="mt-2 text-white/80 text-2xl italic"  // slightly smaller too
    >
      {taglinesByPreset[preset]}
    </motion.p>
  </AnimatePresence>
</header>



            <div className="self-start">
              <LeftSteps steps={leftSteps} title="How it works" animKey={preset} />
            </div>

            <div className="self-start">
              <CenterSessionPanel
                title={title}
                baseMinutes={baseMinutes}
                extraMinutes={extraMinutes}
                totalPriceEUR={totalPriceEUR}
                isCustomizing={isCustomizingCenter}
                followups={followups ?? 0}
              />
            </div>

            <RightBookingPanel
              liveMinutes={liveMinutes}
              loading={loading}
              slots={quickUiSlots}
              onOpenCalendar={onOpenCalendar}
              onCustomize={onCustomize}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

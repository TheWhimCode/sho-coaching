// src/app/coaching/_components/SessionHero.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Slot as UiSlot } from "@/components/AvailableSlots";
import CenterSessionPanel from "./CenterSessionPanel";
import { fetchSuggestedStarts } from "@/lib/booking/suggest";
import { SlotStatus } from "@prisma/client";
import { computeQuickPicks } from "@/lib/booking/quickPicks";
import { fetchSlots } from "@/utils/api";
import LeftSteps from "./LeftSteps";
import RightBookingPanel from "./RightBooking";
import { getPreset } from "@/lib/sessions/preset";
import { stepsByPreset } from "@/lib/sessions/steps";
import { titlesByPreset, taglinesByPreset } from "@/lib/sessions/labels";

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
  liveBlocks?: number; // number of 45m in-game blocks (0..2)
  /** Force preset from route or client state so headings/steps react to customization */
  presetOverride?: "vod" | "signature" | "instant" | "custom";
};

const EASE = [0.22, 1, 0.36, 1] as const;
const TITLE_DELAY = 0.25;
const TAGLINE_DELAY = 0.5;

const PANEL_DELAY = { left: 0.25, center: 0.4, right: 0.65 } as const;

const titleVariants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE, delay: TITLE_DELAY } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.2, ease: EASE } },
};

const taglineVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.38, ease: EASE, delay: TAGLINE_DELAY } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.18, ease: EASE } },
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
  isCustomizingCenter = false,
  isDrawerOpen = false,
  liveBlocks = 0,
  presetOverride,
}: Props) {
  const [autoSlots, setAutoSlots] = useState<UiSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickPool, setQuickPool] = useState<{ id: string; startISO: string }[]>([]);
  const [drawerW, setDrawerW] = useState(0); // px

  // BASE minutes only
  const baseOnly = baseMinutes ?? 60;

  // Unified duration for availability/checkout, clamped 30..120
  const liveMinutesRaw = baseOnly + (liveBlocks ?? 0) * 45;
  const liveMinutes = Math.min(120, Math.max(30, liveMinutesRaw));

  // Preset (computed from cfg, but allow caller to override so it reacts to customization)
  const computedPreset = getPreset(baseOnly, followups ?? 0, liveBlocks ?? 0);
  const preset = presetOverride ?? computedPreset;

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

  // shift by half the drawer width so the hero stays centered
  const shiftX = isDrawerOpen ? drawerW / 2 : 0;

  return (
    <section className="relative isolate h-[100svh] overflow-hidden text-white vignette">
      {/* background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <video
          src="/videos/Particle1_slow.webm"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

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
                  className="text-5xl font-extrabold leading-tight md:text-6xl lg:text-5xl"
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
                  className="mt-2 text-white/80 text-2xl italic"
                >
                  {taglinesByPreset[preset]}
                </motion.p>
              </AnimatePresence>
            </header>

            {/* LEFT */}
            <div className="self-start">
              <LeftSteps
                steps={leftSteps}
                title="How it works"
                animKey={preset}   // retrigger on preset switch
                preset={preset}     // color/glow per preset
                enterDelay={PANEL_DELAY.left}
              />
            </div>

            {/* CENTER */}
            <motion.div
              className="self-start"
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

            {/* RIGHT */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: PANEL_DELAY.right }}
            >
              <RightBookingPanel
                liveMinutes={liveMinutes}
                loading={loading}
                slots={quickUiSlots}
                onOpenCalendar={onOpenCalendar}
                onCustomize={onCustomize}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

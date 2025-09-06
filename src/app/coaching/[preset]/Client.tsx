// src/app/coaching/[preset]/Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import SessionHero from "../_components/SessionHero";
import CalLikeOverlay from "@/app/calendar/Calendar";
import CustomizeDrawer from "../_components/CustomizeDrawer";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { Cfg } from "../../../utils/sessionConfig";
import { fetchSlots, type Slot as ApiSlot } from "@/utils/api";
import { computePriceEUR } from "@/lib/pricing";
import { getPreset, type Preset } from "@/lib/sessions/preset";

export default function Client({ preset }: { preset: string }) {
  // Seed config from URL preset
  const init = useMemo(() => {
    switch (preset) {
      case "signature":
        return { title: "Signature Session", cfg: { liveMin: 45, liveBlocks: 0, followups: 1 } as Cfg };
      case "instant":
        return { title: "Instant Insight", cfg: { liveMin: 30, liveBlocks: 0, followups: 0 } as Cfg };
      case "vod":
      default:
        return { title: "VOD Review", cfg: { liveMin: 60, liveBlocks: 0, followups: 0 } as Cfg };
    }
  }, [preset]);

  const [cfg, setCfg] = useState<Cfg>(init.cfg);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Overlay + prefetch
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | undefined>();
  const [liveMinutes, setLiveMinutes] = useState(init.cfg.liveMin);
  const [prefetchedSlots, setPrefetchedSlots] = useState<ApiSlot[] | undefined>();

  // Active preset that follows customization (so Hero & steps update live)
  const [activePreset, setActivePreset] = useState<Preset>(() => {
    if (preset === "vod" || preset === "signature" || preset === "instant") return preset as Preset;
    return getPreset(init.cfg.liveMin, init.cfg.followups, init.cfg.liveBlocks);
  });

  // Track desktop vs mobile
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768); // md breakpoint
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Reset cfg on route preset change
  useEffect(() => {
    setCfg(init.cfg);
    setLiveMinutes(init.cfg.liveMin);
    // also reset active preset to the route preset on navigation
    setActivePreset(() => {
      if (preset === "vod" || preset === "signature" || preset === "instant") return preset as Preset;
      return getPreset(init.cfg.liveMin, init.cfg.followups, init.cfg.liveBlocks);
    });
  }, [init, preset]);

  // Update active preset whenever the user customizes the config
  useEffect(() => {
    const p = getPreset(cfg.liveMin, cfg.followups, cfg.liveBlocks);
    setActivePreset(p);
  }, [cfg.liveMin, cfg.followups, cfg.liveBlocks]);

  // Prefetch availability when base minutes change
  useEffect(() => {
    let on = true;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    end.setHours(23, 59, 59, 999);
    (async () => {
      try {
        const data = await fetchSlots(start, end, cfg.liveMin);
        if (on) setPrefetchedSlots(data);
      } catch {}
    })();
    return () => {
      on = false;
    };
  }, [cfg.liveMin]);

  const totalMinutes = cfg.liveMin + cfg.liveBlocks * 45;
  const { priceEUR } = computePriceEUR(totalMinutes, cfg.followups);

  return (
    <LayoutGroup id="booking-flow">
      <main className="relative min-h-screen text-white overflow-x-hidden">
        <SessionHero
          // keep Hero labels/steps in sync with current config
          presetOverride={activePreset}
          // (legacy, kept for compatibility with your component)
          title={init.title}
          subtitle=""
          image=""
          baseMinutes={cfg.liveMin}
          followups={cfg.followups}
          liveBlocks={cfg.liveBlocks}
          isCustomizingCenter={drawerOpen}
          isDrawerOpen={drawerOpen}
          onCustomize={() => setDrawerOpen(true)}
          onOpenCalendar={({ slotId, liveMinutes }) => {
            setInitialSlotId(slotId);
            setLiveMinutes(liveMinutes);
            setCalendarOpen(true);
          }}
        />

        <AnimatePresence>
          {calendarOpen && (
            <CalLikeOverlay
              sessionType={init.title}
              liveMinutes={liveMinutes}
              initialSlotId={initialSlotId ?? null}
              prefetchedSlots={prefetchedSlots}
              followups={cfg.followups}
              liveBlocks={cfg.liveBlocks}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile-only backdrop when drawer is open */}
        <AnimatePresence>
          {!isDesktop && drawerOpen && (
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={() => setDrawerOpen(false)}
            />
          )}
        </AnimatePresence>

        <CustomizeDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          cfg={cfg}
          onChange={setCfg}
        />
      </main>
    </LayoutGroup>
  );
}

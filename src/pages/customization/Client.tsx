// components/HeroSection/pages/VODReviewClient.tsx
"use client";

import { useEffect, useState } from "react";
import SessionHero from "@/pages/customization/SessionHero";
import CalLikeOverlay from "@/pages/customization/calendar/Calendar";
import CustomizeDrawer from "@/pages/customization/components/CustomizeDrawer";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import type { Cfg } from "../../utils/sessionConfig";
import { fetchSlots, type Slot as ApiSlot } from "@/utils/api";
import { computePriceEUR } from "@/lib/pricing";

export default function VODReviewClient() {
  // customization state
  const [cfg, setCfg] = useState<Cfg>({
    liveMin: 60,
    liveBlocks: 0,
    followups: 0,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  // overlay + prefetch
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | undefined>();
  const [liveMinutes, setLiveMinutes] = useState(60);
  const [prefetchedSlots, setPrefetchedSlots] = useState<ApiSlot[] | undefined>();

  // prefetch availability when base minutes change
  useEffect(() => {
    let on = true;
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const end = new Date(tomorrow);
    end.setDate(end.getDate() + 14);
    end.setHours(23, 59, 59, 999);

    (async () => {
      try {
        const data = await fetchSlots(tomorrow, end, cfg.liveMin);
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
  title="VOD Review"
  subtitle="League of Legends gameplay analysis"
  image="/videos/vod-review-poster-end.png"
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

        {/* Calendar overlay */}
        <AnimatePresence>
          {calendarOpen && (
            <CalLikeOverlay
              sessionType="VOD Review"
              liveMinutes={liveMinutes}
              initialSlotId={initialSlotId ?? null}
              prefetchedSlots={prefetchedSlots}
              followups={cfg.followups}
              liveBlocks={cfg.liveBlocks}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Drawer */}
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

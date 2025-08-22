// components/HeroSection/pages/VODReviewClient.tsx (or your path)
"use client";

import { useEffect, useState } from "react";
import SessionHero from "../SessionHero";
import CalLikeOverlay from "../CalLikeOverlay";
import CustomizeDrawer from "../CustomizeDrawer";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import type { Cfg } from "../../utils/sessionConfig";
import { fetchSlots, type Slot as ApiSlot } from "@/utils/api";

export default function VODReviewClient() {
  // hint (you can keep/remove; hero no longer scrolls down)


  // customize state
  const [cfg, setCfg] = useState<Cfg>({ liveMin: 60, liveBlocks: 0, followups: 0 });
  const calcPrice = (c: Cfg) => {
    const live = (c.liveMin / 60) * 40;
    const fu = c.followups * 15;
    return Math.round((live + fu) * 100) / 100;
  };
  const [drawerOpen, setDrawerOpen] = useState(false);

  // overlay + prefetch
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | undefined>();
  const [liveMinutes, setLiveMinutes] = useState(60);
  const [prefetchedSlots, setPrefetchedSlots] = useState<ApiSlot[] | undefined>();

  useEffect(() => {
    let on = true;
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const end = new Date(tomorrow); end.setDate(end.getDate() + 14); end.setHours(23,59,59,999);
    (async () => {
      try {
        const data = await fetchSlots(tomorrow, end, cfg.liveMin);
        if (on) setPrefetchedSlots(data);
      } catch {}
    })();
    return () => { on = false; };
  }, [cfg.liveMin]);

  return (
    <LayoutGroup id="booking-flow">
      <main className="relative min-h-screen text-white overflow-x-hidden">
        <SessionHero
          title="VOD Review"
          subtitle="League of Legends gameplay analysis"
          image="/videos/vod-review-poster-end.png"
          baseMinutes={cfg.liveMin}
          extraMinutes={0}
          totalPriceEUR={calcPrice(cfg)}
          followups={cfg.followups}
          isCustomizingCenter={drawerOpen}
          isDrawerOpen={drawerOpen}               
          onCustomize={() => setDrawerOpen(true)}
          onOpenCalendar={({ slotId, liveMinutes }) => {
            setInitialSlotId(slotId);
            setLiveMinutes(liveMinutes);
            setCalendarOpen(true);
          }}
          onBookNow={() => {
            setInitialSlotId(undefined);
            setLiveMinutes(cfg.liveMin);
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
              inGame={cfg.liveBlocks > 0}
              followups={cfg.followups}
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

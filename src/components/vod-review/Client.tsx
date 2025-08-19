"use client";

import { useEffect, useState } from "react";
import SessionHero from "../SessionHero";
import CalLikeOverlay from "../CalLikeOverlay";
import SessionTiles from "@/components/SessionTiles";
import SessionExample from "@/components/SessionExample";
import CustomizeDrawer from "../CustomizeDrawer";
import SessionTestimonialsSection from "@/components/SessionTestimonialsSection";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import type { Cfg } from "../../utils/sessionConfig";
import { fetchSlots, type Slot as ApiSlot } from "@/utils/api";
import { startOfMonth, startOfWeek, endOfMonth, endOfWeek } from "date-fns";

export default function VODReviewClient() {
  // hint + sections
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 3000);
    const hide = () => setShowHint(false);
    window.addEventListener("scroll", hide, { once: true });
    window.addEventListener("pointerdown", hide, { once: true });
    return () => { clearTimeout(t); window.removeEventListener("scroll", hide); window.removeEventListener("pointerdown", hide); };
  }, []);
  const scrollToDetails = () => document.getElementById("details")?.scrollIntoView({ behavior: "smooth", block: "start" });

  // customize state
  const [cfg, setCfg] = useState<Cfg>({ liveMin: 60, liveBlocks: 0, followups: 0 });
const calcPrice = (c: Cfg) => {
  const live = (c.liveMin / 60) * 40;     // 30→€20, 45→€30, 60→€40, 75→€50, 90→€60, ...
  const fu   = c.followups * 15;          // each follow-up is €15
  return Math.round((live + fu) * 100) / 100; // keep cents tidy
};  const [drawerOpen, setDrawerOpen] = useState(false);

  // overlay state + prefetch for instant open
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | undefined>();
  const [liveMinutes, setLiveMinutes] = useState(60);
  const [prefetchedSlots, setPrefetchedSlots] = useState<ApiSlot[] | undefined>();

  useEffect(() => {
    let on = true;
    (async () => {
      const month = new Date();
      const from = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
      const to   = endOfWeek(endOfMonth(month),   { weekStartsOn: 1 });
      try {
        const data = await fetchSlots(from, to, cfg.liveMin);
        if (on) setPrefetchedSlots(data);
      } catch {}
    })();
    return () => { on = false; };
  }, [cfg.liveMin]);

  return (
    <LayoutGroup id="booking-flow">
      <main className="relative min-h-screen text-white overflow-x-hidden">
        {/* HERO */}
        <SessionHero
          title="VOD Review"
          subtitle="League of Legends gameplay analysis"
          image="/videos/vod-review-poster-end.png"
          showHint={showHint}
          onHintClick={scrollToDetails}
          howItWorks={[
            "Send your VOD + goals",
            "Live review + timestamped notes",
            "Action plan & follow-ups",
          ]}
          baseMinutes={cfg.liveMin}
          extraMinutes={0}
          totalPriceEUR={calcPrice(cfg)}
          followups={cfg.followups}
          isCustomizingCenter={drawerOpen}
          onCustomize={() => setDrawerOpen(true)}
          // NEW: open the calendar (from Book Now or quick times)
          onOpenCalendar={({ slotId, liveMinutes }) => {
            setInitialSlotId(slotId);
            setLiveMinutes(liveMinutes);
            setCalendarOpen(true);
          }}
          // (optional) keep a Book Now button that opens the calendar
          onBookNow={() => {
            setInitialSlotId(undefined);
            setLiveMinutes(cfg.liveMin);
            setCalendarOpen(true);
          }}
        />

        {/* Overlay */}
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
        <CustomizeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} cfg={cfg} onChange={setCfg} />

        {/* Background gradient behind sections */}
<div className="pointer-events-none fixed inset-0 -z-50 bg-gradient-to-b from-indigo-950 via-blue-950 to-violet-950" />

        {/* Below-the-fold sections */}
        <SessionTiles />

        <section id="details" className="scroll-mt-24 mx-auto max-w-6xl px-6 py-10 grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl font-bold mb-4">What you get</h2>
            <ul className="flex flex-col gap-3 text-white/85 text-sm">
              <li>✔ Profile review & goals</li>
              <li>✔ Strengths & weaknesses breakdown</li>
              <li>✔ Timestamped notes + action plan</li>
              <li>✔ Personal 3-step improvement path</li>
            </ul>
          </div>
          <SessionExample youtubeUrl="https://www.youtube.com/embed/NMu6PjdTIgk" className="justify-self-end max-w-[420px]" />
        </section>

        <SessionTestimonialsSection sessionType="vod-review" />
      </main>
    </LayoutGroup>
  );
}

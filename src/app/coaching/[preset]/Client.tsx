"use client";

import { useEffect, useMemo, useState } from "react";
import SessionHero from "./_hero-components/SessionHero";
import CalLikeOverlay from "@/app/calendar/Calendar";
import CustomizeDrawer from "./_hero-components/CustomizeDrawer";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { Cfg } from "@/utils/sessionConfig";
import { fetchSlots, type Slot as ApiSlot } from "@/utils/api";
import { computePriceEUR } from "@/lib/pricing";
import { getPreset, type Preset } from "@/lib/sessions/preset";
import { useSearchParams } from "next/navigation";

export default function Client({ preset }: { preset: string }) {
  const params = useSearchParams();
  const wantsCustomize = params.get("open") === "customize";
  const focus = params.get("focus");

  const qBase = Number(params.get("base") ?? NaN);
  const qFU   = Number(params.get("followups") ?? NaN);
  const qLive = Number(params.get("live") ?? NaN);

  const init = useMemo(() => {
    const safe = (n: number, def: number) => (Number.isFinite(n) ? n : def);

    if (preset === "custom") {
      const liveMin   = safe(qBase, 60);
      const followups = Math.max(0, Math.min(2, safe(qFU, 0)));
      const liveBlocks= Math.max(0, Math.min(2, safe(qLive, 0)));
      return {
        title: "Custom Session",
        cfg: { liveMin, followups, liveBlocks } as Cfg,
      };
    }

    switch (preset) {
      case "signature":
        return { title: "Signature Session", cfg: { liveMin: 45, liveBlocks: 0, followups: 1 } as Cfg };
      case "instant":
        return { title: "Instant Insight",   cfg: { liveMin: 30, liveBlocks: 0, followups: 0 } as Cfg };
      case "vod":
      default:
        return { title: "VOD Review",        cfg: { liveMin: 60, liveBlocks: 0, followups: 0 } as Cfg };
    }
  }, [preset, qBase, qFU, qLive]);

  const [cfg, setCfg] = useState<Cfg>(init.cfg);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | undefined>();
  const [liveMinutes, setLiveMinutes] = useState(init.cfg.liveMin);
  const [prefetchedSlots, setPrefetchedSlots] = useState<ApiSlot[] | undefined>();

  const [activePreset, setActivePreset] = useState<Preset>(() =>
    getPreset(init.cfg.liveMin, init.cfg.followups, init.cfg.liveBlocks)
  );

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("no-scrollbar");
    body.classList.add("no-scrollbar");
    return () => {
      html.classList.remove("no-scrollbar");
      body.classList.remove("no-scrollbar");
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    if (drawerOpen || calendarOpen) body.style.overflow = "hidden";
    else body.style.overflow = "";
    return () => { body.style.overflow = ""; };
  }, [drawerOpen, calendarOpen]);

  useEffect(() => {
    setCfg(init.cfg);
    setLiveMinutes(init.cfg.liveMin);
    setActivePreset(getPreset(init.cfg.liveMin, init.cfg.followups, init.cfg.liveBlocks));
  }, [init]);

  useEffect(() => {
    setActivePreset(getPreset(cfg.liveMin, cfg.followups, cfg.liveBlocks));
  }, [cfg.liveMin, cfg.followups, cfg.liveBlocks]);

  // Prefetch availability when minutes change
  useEffect(() => {
    let on = true;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    end.setHours(23, 59, 59, 999);

    const totalMinutes = cfg.liveMin + cfg.liveBlocks * 45;

    (async () => {
      try {
        const data = await fetchSlots(start, end, totalMinutes);
        if (on) setPrefetchedSlots(data);
      } catch {}
    })();

    return () => { on = false; };
  }, [cfg.liveMin, cfg.liveBlocks]);

  const totalMinutes = cfg.liveMin + cfg.liveBlocks * 45;
  const { priceEUR } = computePriceEUR(totalMinutes, cfg.followups);

  useEffect(() => {
    if (preset === "custom" && wantsCustomize) {
      const t = setTimeout(() => setDrawerOpen(true), 2800);
      return () => clearTimeout(t);
    }
  }, [preset, wantsCustomize]);

  return (
    <LayoutGroup id="booking-flow">
      <main className="relative min-h-[100svh] text-white overflow-x-hidden">
        <SessionHero
          presetOverride={activePreset}
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
          parallaxSpeed={0.1}
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

        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
          )}
        </AnimatePresence>

        <CustomizeDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          cfg={cfg}
          onChange={setCfg}
          highlightKey={focus === "followups" ? "followups" : undefined}
        />
      </main>

      <style jsx global>{`
        html.no-scrollbar,
        body.no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          overscroll-behavior: none;
        }
        html.no-scrollbar::-webkit-scrollbar,
        body.no-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
          background: transparent;
        }
      `}</style>
    </LayoutGroup>
  );
}

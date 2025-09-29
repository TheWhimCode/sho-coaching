// src/app/coaching/[preset]/Client.tsx
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
  const focus = params.get("focus"); // e.g. "followups"

  // Read query once for initial seeding
  const qBase = Number(params.get("base") ?? NaN);
  const qFU   = Number(params.get("followups") ?? NaN);
  const qLive = Number(params.get("live") ?? NaN);

  const init = useMemo(() => {
    // helper to clamp & coerce
    const safe = (n: number, def: number) => (Number.isFinite(n) ? n : def);

    if (preset === "custom") {
      // Start with the linked values if present (so no post-mount flip)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, qBase, qFU, qLive]);

  const [cfg, setCfg] = useState<Cfg>(init.cfg);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Overlay + prefetch
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | undefined>();
  const [liveMinutes, setLiveMinutes] = useState(init.cfg.liveMin);
  const [prefetchedSlots, setPrefetchedSlots] = useState<ApiSlot[] | undefined>();

  // Active preset follows current config (so hero/steps update)
  const [activePreset, setActivePreset] = useState<Preset>(() =>
    getPreset(init.cfg.liveMin, init.cfg.followups, init.cfg.liveBlocks)
  );

  // If route segment changes, reset cfg accordingly (but ‘custom’ stays on its seeded values)
  useEffect(() => {
    setCfg(init.cfg);
    setLiveMinutes(init.cfg.liveMin);
    setActivePreset(getPreset(init.cfg.liveMin, init.cfg.followups, init.cfg.liveBlocks));
  }, [init]);

  // Keep active preset synced as user customizes
  useEffect(() => {
    setActivePreset(getPreset(cfg.liveMin, cfg.followups, cfg.liveBlocks));
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
    return () => { on = false; };
  }, [cfg.liveMin]);

  const totalMinutes = cfg.liveMin + cfg.liveBlocks * 45;
  const { priceEUR } = computePriceEUR(totalMinutes, cfg.followups);

  // Auto-open drawer with delayed timing on deep-link
  useEffect(() => {
    if (preset === "custom" && wantsCustomize) {
      // Base 0.8 + right 1.0 + extra 1.0 = 2.8s
      const delay = 2800;
      const t = setTimeout(() => setDrawerOpen(true), delay);
      return () => clearTimeout(t);
    }
  }, [preset, wantsCustomize]);

  return (
    <LayoutGroup id="booking-flow">
      <main className="relative min-h-screen text-white overflow-x-hidden">
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

        {/* mobile backdrop for drawer */}
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
    </LayoutGroup>
  );
}

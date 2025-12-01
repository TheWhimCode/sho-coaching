"use client";

import { useEffect, useMemo, useState } from "react";
import SessionHero from "./_hero-components/SessionHero";
import CalLikeOverlay from "@/app/calendar/Calendar";
import CustomizeDrawer from "./_hero-components/CustomizeDrawer";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { SessionConfig } from "@/engine/session/model/session";
import { fetchSlots, type Slot as ApiSlot } from "@/utils/api";
import { computePriceEUR } from "@/lib/pricing";
import { getPreset, type Preset } from "@/engine/session/rules/preset";
import { useSearchParams } from "next/navigation";

export default function Client({ preset }: { preset: string }) {

  // ⭐ normalize route param once
  const canonicalPreset = preset.replace(/-/g, "_");

  const params = useSearchParams();
  const wantsCustomize = params.get("open") === "customize";
  const focus = params.get("focus");

  const qBase = Number(params.get("base") ?? NaN);
  const qFU = Number(params.get("followups") ?? NaN);
  const qLive = Number(params.get("live") ?? NaN);

  const init = useMemo(() => {
    const safe = (n: number, def: number) =>
      (Number.isFinite(n) ? n : def);

    if (canonicalPreset === "custom") {
      return {
        title: "Custom Session",
        session: {
          liveMin: safe(qBase, 60),
          followups: Math.max(0, Math.min(2, safe(qFU, 0))),
          liveBlocks: Math.max(0, Math.min(2, safe(qLive, 0))),
          productId: canonicalPreset,
        } as SessionConfig,
      };
    }

    return {
      title: canonicalPreset,
      session: {
        liveMin: 60,
        followups: 0,
        liveBlocks: 0,
        productId: canonicalPreset,
      } as SessionConfig,
    };
  }, [canonicalPreset, qBase, qFU, qLive]);

  const [session, setSession] = useState<SessionConfig>(init.session);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialSlotId, setInitialSlotId] = useState<string | undefined>();
  const [liveMinutes, setLiveMinutes] = useState(init.session.liveMin);
  const [prefetchedSlots, setPrefetchedSlots] = useState<ApiSlot[] | undefined>();

  const [activePreset, setActivePreset] = useState<Preset>(() =>
    getPreset(
      init.session.liveMin,
      init.session.followups,
      init.session.liveBlocks,
      init.session.productId
    )
  );

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    let raf1 = 0, raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        html.classList.add("no-scrollbar");
        body.classList.add("no-scrollbar");
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      html.classList.remove("no-scrollbar");
      body.classList.remove("no-scrollbar");
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    if (drawerOpen || calendarOpen) body.style.overflow = "hidden";
    else body.style.overflow = "";
    return () => {
      body.style.overflow = "";
    };
  }, [drawerOpen, calendarOpen]);

  useEffect(() => {
    setSession(init.session);
    setLiveMinutes(init.session.liveMin);
    setActivePreset(
      getPreset(
        init.session.liveMin,
        init.session.followups,
        init.session.liveBlocks,
        init.session.productId
      )
    );
  }, [init]);

  useEffect(() => {
    setActivePreset(
      getPreset(
        session.liveMin,
        session.followups,
        session.liveBlocks,
        session.productId
      )
    );
  }, [session.liveMin, session.followups, session.liveBlocks, session.productId]);

  useEffect(() => {
    let on = true;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    end.setHours(23, 59, 59, 999);

    const totalMinutes = session.liveMin + session.liveBlocks * 45;

    (async () => {
      try {
        const data = await fetchSlots(start, end, totalMinutes);
        if (on) setPrefetchedSlots(data);
      } catch {}
    })();

    return () => {
      on = false;
    };
  }, [session.liveMin, session.liveBlocks]);

  const totalMinutes = session.liveMin + session.liveBlocks * 45;
  const { priceEUR } = computePriceEUR(totalMinutes, session.followups);

  useEffect(() => {
    if (canonicalPreset === "custom" && wantsCustomize) {
      const t = setTimeout(() => setDrawerOpen(true), 2800);
      return () => clearTimeout(t);
    }
  }, [canonicalPreset, wantsCustomize]);

  return (
    <LayoutGroup id="booking-flow">
      <main className="relative min-h-[100svh] text-white overflow-x-hidden bg-[#000000]">
        <SessionHero
          presetOverride={activePreset}
          title={init.title}
          subtitle=""
          image=""
          baseMinutes={session.liveMin}
          followups={session.followups}
          liveBlocks={session.liveBlocks}
          isCustomizingCenter={drawerOpen}
          isDrawerOpen={drawerOpen}
            productId={session.productId}   // <<<<< REQUIRED

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
              followups={session.followups}
              liveBlocks={session.liveBlocks}
              onClose={() => setCalendarOpen(false)}
                  productId={session.productId}   // <-- this was missing

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
          session={session}
          onChange={setSession}
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

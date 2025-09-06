"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, startOfDay } from "date-fns";
import { SlotStatus } from "@prisma/client";

import { fetchSlots } from "@/utils/api";
import type { Slot } from "@/utils/api";
import { holdSlot, releaseHold } from "@/utils/holds";
import { getPreset } from "@/lib/sessions/preset";

import CalendarGrid from "./components/CalendarGrid";
import TimeSlotsList from "./components/TimeSlotsList";

import { motion, AnimatePresence, type Variants } from "framer-motion";

type Props = {
  sessionType: string;
  liveMinutes: number;
  followups?: number;
  onClose?: () => void;
  initialSlotId?: string | null;
  /** seed with already-fetched availability (kept up to date by parent) */
  prefetchedSlots?: Slot[];
  liveBlocks?: number;
};

const overlay: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: [0.2, 0.8, 0.2, 1] } },
};

const shell: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] } },
  exit: { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] } },
};

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default function Calendar({
  sessionType,
  liveMinutes,
  followups = 0,
  onClose,
  initialSlotId = null,
  prefetchedSlots,
  liveBlocks = 0,
}: Props) {
  const router = useRouter();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const DISPLAY_STEP_MIN = 30;

  /** Seed from prefetched slots so UI is instant */
  const [slots, setSlots] = useState<Slot[]>(() => prefetchedSlots ?? []);
  /** Only show spinner if we truly have nothing to show */
  const [loading, setLoading] = useState<boolean>(() => !(prefetchedSlots?.length));
  /** Optional “silent refresh” flag (no UI use here, but kept if you want to show a tiny badge) */
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [pending, setPending] = useState(false);
  const [holdKey, setHoldKey] = useState<string | null>(null);
  const [dErr, setDErr] = useState<string | null>(null);

  const goingToCheckout = useRef(false);
  const [isOpen, setIsOpen] = useState(true);

  /** Keep state in sync if parent refreshes prefetchedSlots (e.g., duration changes) */
  useEffect(() => {
    if (!prefetchedSlots) return;
    setSlots(prefetchedSlots);
    setLoading(false); // we already have data; never show spinner on open
    // clear selection if now invalid
    if (selectedSlotId && !prefetchedSlots.some((s) => s.id === selectedSlotId)) {
      setSelectedSlotId(null);
    }
  }, [prefetchedSlots]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------- Availability fetch (silent, duration-aware) --------
  useEffect(() => {
    let ignore = false;
    const tomorrow = addDays(startOfDay(new Date()), 1);
    const end = addDays(tomorrow, 14);
    end.setHours(23, 59, 59, 999);

    // If slots are already seeded, hydrate silently without toggling the loading spinner.
    const doSpinner = slots.length === 0;

    const t = setTimeout(async () => {
      if (doSpinner) setLoading(true);
      setHydrating(true);
      setError(null);
      try {
        const data = await fetchSlots(tomorrow, end, liveMinutes);
        if (!ignore) {
          setSlots(data);
          if (selectedSlotId && !data.some((s) => s.id === selectedSlotId)) {
            setSelectedSlotId(null);
          }
        }
      } catch (e: unknown) {
        if (!ignore) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!ignore) {
          setHydrating(false);
          if (doSpinner) setLoading(false);
        }
      }
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(t);
    };
    // NOTE: do NOT depend on selectedSlotId to avoid flicker when picking a time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMinutes]);

  // -------- Preselect a provided slot once (if still valid) --------
  const preselectedOnce = useRef(false);
  useEffect(() => {
    if (preselectedOnce.current || !initialSlotId || !slots.length) return;
    const hit = slots.find((s) => s.id === initialSlotId);
    if (!hit) return;
    const dt = new Date(hit.startTime);
    const m = new Date(dt);
    m.setDate(1);
    m.setHours(0, 0, 0, 0);
    setMonth(m);
    setSelectedDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
    setSelectedSlotId(hit.id);
    preselectedOnce.current = true;
  }, [initialSlotId, slots]);

  // -------- Build per-day starts (FREE, next 14 days) --------
  const startsByDay = useMemo(() => {
    const map = new Map<string, { id: string; local: Date }[]>();
    const tomorrow = addDays(startOfDay(new Date()), 1);
    const end = addDays(tomorrow, 14);
    end.setHours(23, 59, 59, 999);
    for (const s of slots) {
      if (s.status !== SlotStatus.free) continue;
      const dt = new Date(s.startTime);
      if (dt < tomorrow || dt > end) continue;
      const key = dayKeyLocal(dt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ id: s.id, local: dt });
    }
    for (const arr of map.values()) arr.sort((a, b) => a.local.getTime() - b.local.getTime());
    return map;
  }, [slots]);

  const displayableStartCountByDay = useMemo(() => {
    const out = new Map<string, number>();
    for (const [k, arr] of startsByDay.entries()) {
      const displayables = arr.filter(({ local }) => local.getMinutes() % DISPLAY_STEP_MIN === 0);
      if (displayables.length > 0) out.set(k, displayables.length);
    }
    return out;
  }, [startsByDay]);

  const displayableStartsForSelected = useMemo(() => {
    if (!selectedDate) return [];
    const all = startsByDay.get(dayKeyLocal(selectedDate)) ?? [];
    return all.filter(({ local }) => local.getMinutes() % DISPLAY_STEP_MIN === 0);
  }, [selectedDate, startsByDay]);

  // -------- Continue to checkout --------
  async function submitBooking() {
    if (!selectedSlotId) return;
    setDErr(null);
    setPending(true);
    try {
      const { holdKey: k } = await holdSlot(selectedSlotId, holdKey || undefined);
      setHoldKey(k);
      if (typeof window !== "undefined") sessionStorage.setItem(`hold:${selectedSlotId}`, k);

      const blocks = liveBlocks ?? 0;
      const baseOnly = Math.max(30, liveMinutes - blocks * 45);
      const preset = getPreset(baseOnly, followups ?? 0, blocks);

      const url = new URL("/checkout", window.location.origin);
      url.searchParams.set("slotId", selectedSlotId);
      url.searchParams.set("sessionType", sessionType);
      url.searchParams.set("liveMinutes", String(liveMinutes));
      url.searchParams.set("followups", String(followups ?? 0));
      url.searchParams.set("preset", preset);
      url.searchParams.set("holdKey", k);
      if (blocks) url.searchParams.set("liveBlocks", String(blocks));

      const selectedLocal =
        displayableStartsForSelected.find(({ id }) => id === selectedSlotId)?.local ??
        (() => {
          const s = slots.find((x) => x.id === selectedSlotId);
          return s ? new Date(s.startTime) : null;
        })();

      if (selectedLocal && !isNaN(selectedLocal.getTime())) {
        url.searchParams.set("startTime", selectedLocal.toISOString());
      }

      goingToCheckout.current = true;
      router.push(url.toString());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDErr(msg || "Could not hold the slot");
    } finally {
      setPending(false);
    }
  }

  // -------- Release hold if user closes --------
  useEffect(() => {
    return () => {
      if (goingToCheckout.current) return;
      if (
        selectedSlotId &&
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/checkout")
      ) {
        releaseHold(selectedSlotId, holdKey || undefined);
      }
    };
  }, [selectedSlotId, holdKey]);

  const handleExitComplete = () => {
    if (!isOpen) onClose?.();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/10 supports-[backdrop-filter]:backdrop-blur-[2px]"
          variants={overlay}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <motion.div
            className="w-[92vw] max-w-[1200px] h-[88vh] rounded-2xl overflow-hidden
                       flex flex-col shadow-[0_20px_80px_-20px_rgba(0,0,0,.6)]
                       ring-1 ring-[rgba(146,180,255,.18)]
                       bg-[rgba(11,18,32,.55)]
                       supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150"
            variants={shell}
          >
            {/* header */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <div className="text-white/85">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">Schedule</div>
                <div className="text-xl font-semibold">{sessionType}</div>
              </div>
              <div />
            </div>

            {/* body */}
            <div className="px-6 pb-4 flex-1 min-h-0">
              <div
                className="h-full rounded-2xl ring-1 ring-[rgba(146,180,255,.20)]
                           bg-[rgba(12,22,44,.72)]
                           [background-image:linear-gradient(180deg,rgba(99,102,241,.12),transparent)]
                           supports-[backdrop-filter]:backdrop-blur-md
                           supports-[backdrop-filter]:backdrop-saturate-150
                           supports-[backdrop-filter]:backdrop-contrast-125"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1px_1.4fr] h-full">
                  <div className="min-h-0 p-4">
                    <CalendarGrid
                      month={month}
                      onMonthChange={setMonth}
                      selectedDate={selectedDate}
                      onSelectDate={(d) => {
                        setSelectedDate(d);
                        setSelectedSlotId(null);
                      }}
                      validStartCountByDay={displayableStartCountByDay}
                      loading={loading && slots.length === 0} // 👈 only show if truly empty
                      error={error}
                    />
                  </div>

                  {/* divider */}
                  <div className="hidden md:block bg-[rgba(146,180,255,.24)]" />

                  <div className="min-h-0 p-4">
                    <TimeSlotsList
                      slots={displayableStartsForSelected}
                      selectedSlotId={selectedSlotId}
                      onSelectSlot={setSelectedSlotId}
                      showTimezoneNote
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="px-6 py-4 border-t border-[rgba(146,180,255,.18)] flex items-center justify-between gap-3">
              {dErr && <div className="text-rose-400 text-sm">{dErr}</div>}
              <div className="ml-auto flex gap-2">
                <button
                  className="h-9 px-4 rounded-xl bg-[rgba(16,24,40,.70)] hover:bg-[rgba(20,28,48,.85)]
                             ring-1 ring-[rgba(146,180,255,.18)] text-white
                             supports-[backdrop-filter]:backdrop-blur-md"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="h-9 px-4 rounded-xl bg-[#fc8803] hover:bg-[#f8a81a]
                             shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]
                             disabled:opacity-40 text-[#0A0A0A] font-semibold"
                  disabled={!selectedSlotId || pending}
                  onClick={submitBooking}
                >
                  {pending ? "Opening checkout…" : "Continue to payment"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

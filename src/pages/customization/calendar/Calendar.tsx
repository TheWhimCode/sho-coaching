// src/pages/customization/schedule/Calendar.tsx (or your actual path)
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
  prefetchedSlots?: Slot[];
  liveBlocks?: number;
};

const overlay: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] } },
  exit:   { opacity: 0, transition: { duration: 0.12, ease: [0.2, 0.8, 0.2, 1] } },
};

const shell: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] } },
  exit:   { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] } },
};

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default function Calendar({
  sessionType, liveMinutes, followups = 0, onClose, initialSlotId = null, prefetchedSlots, liveBlocks = 0,
}: Props) {
  const router = useRouter();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const DISPLAY_STEP_MIN = 30; // Only show :00/:30 in UI

  const [slots, setSlots] = useState<Slot[]>([]); // raw slots (15-min granularity)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [pending, setPending] = useState(false);
  const [holdKey, setHoldKey] = useState<string | null>(null);
  const [dErr, setDErr] = useState<string | null>(null);

  const goingToCheckout = useRef(false);

  // local open state to allow exit animation
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let ignore = false;
    const tomorrow = addDays(startOfDay(new Date()), 1);
    const end = addDays(tomorrow, 14);
    end.setHours(23, 59, 59, 999);
    (async () => {
      setLoading(true); setError(null);
      try {
        const data = prefetchedSlots?.length ? prefetchedSlots : await fetchSlots(tomorrow, end, liveMinutes);
        if (!ignore) setSlots(data);
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load availability");
      }
      finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [liveMinutes, prefetchedSlots]);

  // Preselect if initialSlotId provided
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

  // Map of all raw starts (15-min) grouped by day
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

  // ✅ Only count/display slots aligned to DISPLAY_STEP_MIN for CalendarGrid
  const displayableStartCountByDay = useMemo(() => {
    const out = new Map<string, number>();
    for (const [k, arr] of startsByDay.entries()) {
      const displayables = arr.filter(({ local }) => local.getMinutes() % DISPLAY_STEP_MIN === 0);
      if (displayables.length > 0) out.set(k, displayables.length);
    }
    return out;
  }, [startsByDay, DISPLAY_STEP_MIN]);

  // ✅ For TimeSlotsList: also only show aligned slots
  const displayableStartsForSelected = useMemo(() => {
    if (!selectedDate) return [];
    const all = startsByDay.get(dayKeyLocal(selectedDate)) ?? [];
    return all.filter(({ local }) => local.getMinutes() % DISPLAY_STEP_MIN === 0);
  }, [selectedDate, startsByDay]);

  async function submitBooking() {
    if (!selectedSlotId) return;
    setDErr(null); setPending(true);
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

      // 🔹 ADD the selected start time so checkout can display it
      // Prefer the 'displayable' list (aligned to :00/:30); fall back to raw slot by id.
      const selectedLocal =
        displayableStartsForSelected.find(({ id }) => id === selectedSlotId)?.local
        ?? (() => {
             const s = slots.find((x) => x.id === selectedSlotId);
             return s ? new Date(s.startTime) : null;
           })();

      if (selectedLocal && !isNaN(selectedLocal.getTime())) {
        url.searchParams.set("startTime", selectedLocal.toISOString());
      }

      goingToCheckout.current = true;
      router.push(url.toString());
    } catch (e: any) {
      setDErr(e?.message || "Could not hold the slot");
    } finally { setPending(false); }
  }

  useEffect(() => {
    return () => {
      if (goingToCheckout.current) return;
      if (selectedSlotId && typeof window !== "undefined" && !window.location.pathname.startsWith("/checkout")) {
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
                      onSelectDate={(d) => { setSelectedDate(d); setSelectedSlotId(null); }}
                      validStartCountByDay={displayableStartCountByDay} // ✅ use displayable
                      loading={loading}
                      error={error}
                    />
                  </div>

                  {/* divider */}
                  <div className="hidden md:block bg-[rgba(146,180,255,.24)]" />

                  <div className="min-h-0 p-4">
                    <TimeSlotsList
                      slots={displayableStartsForSelected} // ✅ use displayable
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

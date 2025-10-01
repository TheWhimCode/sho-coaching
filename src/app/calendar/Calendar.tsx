// src/app/calendar/Calendar.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { SlotStatus } from "@prisma/client";

import { fetchSlots } from "@/utils/api";
import type { Slot } from "@/utils/api";
import { holdSlot, releaseHold } from "@/utils/holds";
import { getPreset } from "@/lib/sessions/preset";

import CalendarGrid from "./components/CalendarGrid";
import TimeSlotsList from "./components/TimeSlotsList";
import WheelPicker from "./components/WheelPicker";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import OutlineCTA from "@/app/_components/small/buttons/OutlineCTA";
import { ArrowLeft } from "lucide-react";

type Props = {
  sessionType: string;
  liveMinutes: number;   // base minutes (30..120)
  followups?: number;
  onClose?: () => void;
  initialSlotId?: string | null;
  /** seed with already-fetched availability (kept up to date by parent) */
  prefetchedSlots?: Slot[];
  liveBlocks?: number;   // 0..2 (each 45m)
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

  // total session minutes (base + in-game)
  const blocks = liveBlocks ?? 0;
  const totalMinutes = liveMinutes + blocks * 45;

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const DISPLAY_STEP_MIN = 30;
  const LEAD_HOURS = 18;

  const [mobileStep, setMobileStep] = useState<"day" | "time">("day");

  function roundUpToStep(d: Date, stepMin: number) {
    const m = d.getMinutes();
    const up = Math.ceil(m / stepMin) * stepMin;
    d.setMinutes(up === 60 ? 0 : up, 0, 0);
    if (up === 60) d.setHours(d.getHours() + 1);
    return d;
  }

  function startBoundaryNowPlusLead() {
    const s = new Date(Date.now() + LEAD_HOURS * 60 * 60 * 1000);
    return roundUpToStep(s, DISPLAY_STEP_MIN);
  }

  const [slots, setSlots] = useState<Slot[]>(() => prefetchedSlots ?? []);
  const [loading, setLoading] = useState<boolean>(() => !(prefetchedSlots?.length));
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [pending, setPending] = useState(false);
  const [holdKey, setHoldKey] = useState<string | null>(null);
  const [dErr, setDErr] = useState<string | null>(null);

  const goingToCheckout = useRef(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!prefetchedSlots) return;
    setSlots(prefetchedSlots);
    setLoading(false);
    if (selectedSlotId && !prefetchedSlots.some((s) => s.id === selectedSlotId)) {
      setSelectedSlotId(null);
    }
  }, [prefetchedSlots, selectedSlotId]);

  useEffect(() => {
    let ignore = false;
    const startBoundary = startBoundaryNowPlusLead();
    const end = addDays(startOfDay(startBoundary), 14);
    end.setHours(23, 59, 59, 999);

    const doSpinner = slots.length === 0;

    (async () => {
      if (doSpinner) setLoading(true);
      setHydrating(true); setError(null);
      try {
        // Use totalMinutes so returned starts already guarantee a full chain
        const data = await fetchSlots(startBoundary, end, totalMinutes);
        if (!ignore) {
          setSlots(data);
          if (selectedSlotId && !data.some((s) => s.id === selectedSlotId)) {
            setSelectedSlotId(null);
          }
        }
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!ignore) { setHydrating(false); if (doSpinner) setLoading(false); }
      }
    })();

    return () => { ignore = true; };
  }, [totalMinutes]); // recompute availability when session length changes

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

  const startsByDay = useMemo(() => {
    const map = new Map<string, { id: string; local: Date }[]>();
    const startBoundary = startBoundaryNowPlusLead();
    const end = addDays(startOfDay(startBoundary), 14);
    end.setHours(23, 59, 59, 999);

    for (const s of slots) {
      if (s.status !== SlotStatus.free) continue;
      const dt = new Date(s.startTime);
      if (dt < startBoundary || dt > end) continue;
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

  async function submitBooking() {
    if (!selectedSlotId) return;
    setDErr(null);
    setPending(true);
    try {
      // Hold the full chain for the total (base + in-game) minutes
      const { holdKey: k, slotIds } = await holdSlot(
        selectedSlotId,
        totalMinutes,
        holdKey || undefined
      );
      setHoldKey(k);
      if (typeof window !== "undefined") sessionStorage.setItem(`hold:${selectedSlotId}`, k);

      const baseOnly = Math.max(30, liveMinutes); // liveMinutes prop is base-only
      const preset = getPreset(baseOnly, followups ?? 0, blocks);

      const url = new URL("/checkout", window.location.origin);
      url.searchParams.set("slotId", selectedSlotId);
      url.searchParams.set("sessionType", sessionType);
      url.searchParams.set("liveMinutes", String(liveMinutes));
      url.searchParams.set("followups", String(followups ?? 0));
      url.searchParams.set("preset", preset);
      url.searchParams.set("holdKey", k);
      if (blocks) url.searchParams.set("liveBlocks", String(blocks));
      if (slotIds?.length) url.searchParams.set("slotIds", slotIds.join(","));

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

  // Release the entire chain by holdKey if the overlay closes without checkout
  useEffect(() => {
    return () => {
      if (goingToCheckout.current) return;
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/checkout")) {
        releaseHold(holdKey || undefined);
      }
    };
  }, [holdKey]);

  const handleExitComplete = () => {
    if (!isOpen) onClose?.();
  };

  const selectedDateLabel =
    selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a day";

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center
                     bg-black/10 supports-[backdrop-filter]:backdrop-blur-[2px]"
          variants={overlay}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {/* mobile-only extra dark overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            className="relative z-10 w-[92vw] max-w-[1200px] h-[88vh] rounded-2xl overflow-hidden
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
                  {/* LEFT COLUMN */}
                  <div className="min-h-0 p-4 h-full">
                    {/* DESKTOP */}
                    <div className="hidden md:block">
                      <CalendarGrid
                        month={month}
                        onMonthChange={setMonth}
                        selectedDate={selectedDate}
                        onSelectDate={(d) => {
                          setSelectedDate(d);
                          setSelectedSlotId(null);
                        }}
                        validStartCountByDay={displayableStartCountByDay}
                        loading={loading && slots.length === 0}
                        error={error}
                      />
                    </div>

                    {/* MOBILE */}
                    <div className="md:hidden flex flex-col h-full">
                      {mobileStep === "day" && (
                        <div className="flex-1 min-h-0">
                          <CalendarGrid
                            month={month}
                            onMonthChange={setMonth}
                            selectedDate={selectedDate}
                            onSelectDate={(d) => {
                              setSelectedDate(d);
                              setSelectedSlotId(null);
                              setMobileStep("time");
                            }}
                            validStartCountByDay={displayableStartCountByDay}
                            loading={loading && slots.length === 0}
                            error={error}
                          />
                        </div>
                      )}

                      {mobileStep === "time" && (
                        <div className="flex-1 min-h-0 flex flex-col">
                          {/* header row */}
                          <div className="relative mb-2 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setMobileStep("day")}
                              className="absolute left-0 inline-flex items-center justify-center h-9 w-9 rounded-xl
                                         ring-1 ring-[rgba(146,180,255,.22)]
                                         bg-[rgba(16,24,40,.50)] hover:bg-[rgba(20,28,48,.70)]
                                         text-white/90"
                              aria-label="Back to day selection"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="text-white/85 text-sm font-medium">
                              {selectedDateLabel}
                            </div>
                          </div>

                          {/* Wheel */}
                          <div className="flex-1 flex items-center justify-center">
                            <WheelPicker
                              slots={displayableStartsForSelected}
                              selectedSlotId={selectedSlotId}
                              onSelectSlot={setSelectedSlotId}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* divider (desktop) */}
                  <div className="hidden md:block bg-[rgba(146,180,255,.24)]" />

                  {/* RIGHT COLUMN */}
                  <div className="min-h-0 p-4 hidden md:block">
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
                <OutlineCTA
                  className="h-9 px-4 text-white supports-[backdrop-filter]:backdrop-blur-md
                             bg-[rgba(16,24,40,.70)] hover:bg-[rgba(20,28,48,.85)] ring-1 ring-[var(--color-divider)] rounded-xl"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </OutlineCTA>
                <PrimaryCTA
                  withHalo={false}
                  className="h-9 px-4 text-base"
                  disabled={!selectedSlotId || pending}
                  onClick={submitBooking}
                >
                  {pending ? "Opening checkout…" : "Continue to payment"}
                </PrimaryCTA>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

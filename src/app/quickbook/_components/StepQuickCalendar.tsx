// src/app/quickbook/_components/StepQuickCalendar.tsx
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import CalendarGrid from "@/app/calendar/components/CalendarGrid";
import TimeSlotsList from "@/app/calendar/components/TimeSlotsList";
import WheelPicker from "@/app/calendar/components/mobile/WheelPicker";
import DayPicker from "@/app/calendar/components/mobile/DayPicker";

import { fetchSlots } from "@/utils/api";
import type { Slot } from "@/utils/api";

import type { DiscordIdentity, QuickbookConfig } from "./types";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return isDesktop;
}

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function normalizeRiotTag(v: string) {
  return v.trim().replace(/\s*#\s*/g, "#");
}

type FooterState = {
  primaryLabel: string;
  primaryDisabled: boolean;
  onPrimary: () => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  onSecondary?: () => void;
};

type Props = {
  config: QuickbookConfig;
  prefetchedSlots?: Slot[] | null;
  prefetchError?: string | null;

  riotTag: string;
  notes: string;
  discordIdentity: DiscordIdentity;

  onBack: () => void;
  onSuccess: (startISO: string) => void;

  setFooterState: (s: FooterState | null) => void;
};

export default function StepQuickCalendar({
  config,
  prefetchedSlots,
  prefetchError,
  riotTag,
  notes,
  discordIdentity,
  onBack,
  onSuccess,
  setFooterState,
}: Props) {
  const isDesktop = useIsDesktop();

  const blocks = config.liveBlocks ?? 0;
  const totalMinutes = config.liveMinutes + blocks * 45;

  const [month, setMonth] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [mobileStep, setMobileStep] = React.useState<"day" | "time">("day");
  const [mobileDir, setMobileDir] = React.useState<1 | -1>(1);
  const [wheelVisible, setWheelVisible] = React.useState(false);

  function goStep(next: "day" | "time", dir: 1 | -1) {
    setMobileDir(dir);
    setMobileStep(next);
    if (next === "day") setWheelVisible(false);
  }

  const [slots, setSlots] = React.useState<Slot[]>(() => prefetchedSlots ?? []);
  const [loading, setLoading] = React.useState(() => !(prefetchedSlots?.length));
  const [error, setError] = React.useState<string | null>(prefetchError ?? null);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = React.useState<string | null>(null);

  const [pending, setPending] = React.useState(false);

  // Apply prefetched slots if they arrive after mount
  React.useEffect(() => {
    if (!prefetchedSlots?.length) return;
    setSlots(prefetchedSlots);
    setLoading(false);
  }, [prefetchedSlots]);

  React.useEffect(() => {
    if (!prefetchError) return;
    setError(prefetchError);
  }, [prefetchError]);

  // Fetch slots only if not prefetched
  React.useEffect(() => {
    if (prefetchedSlots?.length) return;

    let ignore = false;

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 14);
    end.setUTCHours(23, 59, 59, 999);

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSlots(start, end, totalMinutes);
        if (!ignore) setSlots(data);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [totalMinutes, prefetchedSlots]);

  const normalizedSlots = React.useMemo(
    () =>
      slots.map((s) => ({
        ...s,
        startTime: new Date((s as any).startTime ?? (s as any).startISO),
      })),
    [slots]
  );

  const startsByDay = React.useMemo(() => {
    const map = new Map<string, { id: string; start: Date }[]>();

    for (const s of normalizedSlots) {
      const d = s.startTime;
      if (d.getUTCMinutes() % 30 !== 0) continue;

      const key = dayKeyLocal(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ id: s.id, start: d });
    }

    for (const arr of map.values()) {
      arr.sort((a, b) => a.start.getTime() - b.start.getTime());
    }

    return map;
  }, [normalizedSlots]);

  const displayableStartCountByDay = React.useMemo(() => {
    const out = new Map<string, number>();
    for (const [k, arr] of startsByDay.entries()) {
      if (arr.length > 0) out.set(k, arr.length);
    }
    return out;
  }, [startsByDay]);

  const displayableDayKeys = React.useMemo(
    () => new Set(displayableStartCountByDay.keys()),
    [displayableStartCountByDay]
  );

  const displayableStartsForSelected = React.useMemo(() => {
    if (!selectedDate) return [];
    const key = dayKeyLocal(selectedDate);
    return (startsByDay.get(key) ?? []).map(({ id, start }) => ({
      id,
      local: start,
    }));
  }, [selectedDate, startsByDay]);

  async function confirmTime() {
    if (!selectedSlotId || pending) return;
    setPending(true);

    try {
      const res = await fetch("/api/quickbook/create-and-finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlotId,
          sessionType: config.sessionType,
          liveMinutes: config.liveMinutes,
          followups: config.followups ?? 0,
          liveBlocks: blocks,

          riotTag: normalizeRiotTag(riotTag),
          discordId: discordIdentity.id,
          discordName: discordIdentity.username ?? null,
          notes: notes?.trim() ? notes.trim() : null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not quickbook");

      // ✅ pass selected start time to success screen
      const apiStartISO =
        data?.startISO || data?.booking?.startISO || data?.booking?.startTime || null;

      let startISO: string | null = apiStartISO;

      if (!startISO) {
        const match = normalizedSlots.find((s) => s.id === selectedSlotId);
        if (match?.startTime) startISO = match.startTime.toISOString();
      }

      onSuccess(startISO ?? new Date().toISOString());
    } finally {
      setPending(false);
    }
  }

  // ✅ Publish footer behavior to the parent (handles mobile sub-steps)
  React.useEffect(() => {
    const isMobile = !isDesktop;

    if (isMobile && mobileStep === "day") {
      setFooterState({
        primaryLabel: "Confirm date",
        primaryDisabled: !selectedDate || pending,
        onPrimary: () => goStep("time", 1),
        secondaryLabel: "Back",
        secondaryDisabled: pending,
        onSecondary: onBack,
      });
      return;
    }

    setFooterState({
      primaryLabel: pending ? "Booking…" : "Confirm time",
      primaryDisabled: !selectedSlotId || pending,
      onPrimary: () => confirmTime(),
      secondaryLabel: "Back",
      secondaryDisabled: pending,
      onSecondary: () => {
        if (!isDesktop && mobileStep === "time") {
          goStep("day", -1);
          return;
        }
        onBack();
      },
    });

    return () => setFooterState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, mobileStep, selectedDate, selectedSlotId, pending]);

  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "Select a day";

  const fadeEase = [0.2, 0.8, 0.2, 1] as const;

  return (
    <div className="h-full min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1px_1.4fr] h-full min-h-0">
        {/* LEFT */}
        <div className="min-h-0 h-full p-4">
          <div className="hidden md:block h-full">
            <CalendarGrid
              month={month}
              onMonthChange={setMonth}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setSelectedSlotId(null);
              }}
              validStartCountByDay={displayableStartCountByDay}
              displayableDayKeys={displayableDayKeys}
              loading={loading && slots.length === 0}
              error={error}
            />
          </div>

          {/* Mobile flow */}
          <div className="md:hidden flex flex-col h-full min-h-0">
            <AnimatePresence custom={mobileDir} mode="wait" initial={false}>
              {mobileStep === "day" ? (
                <motion.div
                  key="day"
                  custom={mobileDir}
                  initial={{ x: mobileDir * 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: mobileDir * -40, opacity: 0 }}
                  transition={{ duration: 0.22, ease: fadeEase }}
                  className="flex-1 min-h-0 -m-4"
                >
                  <DayPicker
                    month={month}
                    onMonthChange={setMonth}
                    selectedDate={selectedDate}
                    onSelectDate={(d) => {
                      setSelectedDate(d);
                      setSelectedSlotId(null);
                    }}
                    validStartCountByDay={displayableStartCountByDay}
                    displayableDayKeys={displayableDayKeys}
                    loading={loading && slots.length === 0}
                    error={error}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="time"
                  custom={mobileDir}
                  initial={{ x: mobileDir * 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: mobileDir * -40, opacity: 0 }}
                  transition={{ duration: 0.22, ease: fadeEase }}
                  className="flex-1 min-h-0 flex flex-col relative"
                  onAnimationComplete={() => setWheelVisible(true)}
                >
                  <div className="mb-3">
                    <div className="relative h-7 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => goStep("day", -1)}
                        className="absolute left-0 inline-flex items-center gap-.5 text-sm font-medium text-white/80 hover:text-white"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                      <div className="text-sm text-white/80">{selectedDateLabel}</div>
                    </div>
                    <div className="mt-2 border-t border-white/10" />
                  </div>

                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <WheelPicker
                      key={mobileStep === "time" ? "wheelpicker" : "none"}
                      slots={displayableStartsForSelected}
                      selectedSlotId={selectedSlotId}
                      onSelectSlot={setSelectedSlotId}
                      showTimezoneNote={wheelVisible}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block bg-[rgba(146,180,255,.24)]" />

        {/* RIGHT */}
        <div className="min-h-0 hidden md:block p-4">
          <TimeSlotsList
            slots={displayableStartsForSelected}
            selectedSlotId={selectedSlotId}
            onSelectSlot={setSelectedSlotId}
            showTimezoneNote
          />
        </div>
      </div>
    </div>
  );
}
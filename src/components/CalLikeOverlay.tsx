// components/CalLikeOverlay.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays, addMonths, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, isToday, startOfDay, startOfMonth, startOfWeek
} from "date-fns";
import { SlotStatus } from "@prisma/client";

import { fetchSlots } from "@/utils/api";
import type { Slot } from "@/utils/api";
import { holdSlot, releaseHold } from "@/utils/holds";
import { getPreset } from "@/lib/sessions/preset";

type Props = {
  sessionType: string;
  liveMinutes: number;          // unified minutes (base + 45*liveBlocks)
  followups?: number;
  onClose?: () => void;
  initialSlotId?: string | null;
  prefetchedSlots?: Slot[];
  liveBlocks?: number;          // number of 45m blocks
};

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default function CalLikeOverlay({
  sessionType,
  liveMinutes,
  followups = 0,
  onClose,
  initialSlotId = null,
  prefetchedSlots,
  liveBlocks = 0,
}: Props) {
  const router = useRouter();

  // visible month (purely visual; not used for fetching limits)
  const [month, setMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const DISPLAY_STEP_MIN = 30; // Only show :00 and :30

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [discord, setDiscord] = useState("");
  const [dErr, setDErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [holdKey, setHoldKey] = useState<string | null>(null);

  const discordOk =
    /^@?[a-z0-9._-]{2,32}$/i.test(discord.trim()) ||
    /^.{2,32}#\d{4}$/.test(discord.trim()) ||
    !discord.trim();

  // Fetch strictly: tomorrow -> tomorrow+14 (end of day). Not month-bound.
  useEffect(() => {
    let ignore = false;

    const tomorrow = addDays(startOfDay(new Date()), 1);
    const end = addDays(tomorrow, 14);
    end.setHours(23, 59, 59, 999);

    (async () => {
      setLoading(true); setError(null);
      try {
        const data = prefetchedSlots?.length
          ? prefetchedSlots
          : await fetchSlots(tomorrow, end, liveMinutes);
        if (!ignore) setSlots(data);
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load availability");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [liveMinutes, prefetchedSlots]);

  // Preselect passed slot
  const preselectedOnce = useRef(false);
  useEffect(() => {
    if (preselectedOnce.current || !initialSlotId || !slots.length) return;
    const hit = slots.find((s) => s.id === initialSlotId);
    if (!hit) return;
    const dt = new Date(hit.startTime);
    const m = new Date(dt); m.setDate(1); m.setHours(0,0,0,0);
    setMonth(m);
    setSelectedDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
    setSelectedSlotId(hit.id);
    preselectedOnce.current = true;
  }, [initialSlotId, slots]);

  // Group starts by day; clamp to same [tomorrow, end] window for UI too
  const startsByDay = useMemo(() => {
    const map = new Map<string, { id: string; local: Date }[]>();
    const tomorrow = addDays(startOfDay(new Date()), 1);
    const end = addDays(tomorrow, 14); end.setHours(23,59,59,999);

    for (const s of slots) {
      if (s.status !== SlotStatus.free) continue;      // ← only free
      const dt = new Date(s.startTime);
      if (dt < tomorrow || dt > end) continue;
      const key = dayKeyLocal(dt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ id: s.id, local: dt });
    }
    for (const arr of map.values())
      arr.sort((a, b) => a.local.getTime() - b.local.getTime());
    return map;
  }, [slots]);

  const validStartCountByDay = useMemo(() => {
    const out = new Map<string, number>();
    for (const [k, arr] of startsByDay.entries()) out.set(k, arr.length);
    return out;
  }, [startsByDay]);

  const validStartsForSelected = useMemo(() => {
    if (!selectedDate) return [];
    const all = startsByDay.get(dayKeyLocal(selectedDate)) ?? [];
    return all.filter(({ local }) => local.getMinutes() % DISPLAY_STEP_MIN === 0);
  }, [selectedDate, startsByDay]);

  async function submitBooking() {
    if (!selectedSlotId) return;
    if (!discordOk) { setDErr(""); return; }
    setDErr(null); setPending(true);
    try {
      const { holdKey: k } = await holdSlot(selectedSlotId, holdKey || undefined);
      setHoldKey(k);
      sessionStorage.setItem(`hold:${selectedSlotId}`, k);

      // derive base-only minutes so preset is consistent with the rest of the app
      const blocks = liveBlocks ?? 0;
      const baseOnly = Math.max(30, liveMinutes - blocks * 45);
      const preset = getPreset(baseOnly, followups ?? 0, blocks);

      const url = new URL("/checkout", window.location.origin);
      url.searchParams.set("slotId", selectedSlotId);
      url.searchParams.set("sessionType", sessionType);
      url.searchParams.set("liveMinutes", String(liveMinutes)); // unified
      url.searchParams.set("followups", String(followups ?? 0));
      url.searchParams.set("discord", discord.trim());
      url.searchParams.set("preset", preset);
      url.searchParams.set("holdKey", k);
      if (blocks) url.searchParams.set("liveBlocks", String(blocks));
console.log("[CalLikeOverlay] submit", {
  liveMinutes, liveBlocksProp: liveBlocks, blocks,
  url: url.toString()
});
      router.push(url.toString());
    } catch (e: any) {
      setDErr(e?.message || "Could not hold the slot");
    } finally {
      setPending(false);
    }
  }

  // release hold on unmount if not going to /checkout
  useEffect(() => {
    return () => {
      if (selectedSlotId && typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/checkout")) {
        releaseHold(selectedSlotId, holdKey || undefined);
      }
    };
  }, [selectedSlotId, holdKey]);

  // --- UI ---
  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm grid place-items-center">
      <div className="w-[92vw] max-w-[1200px] h-[88vh] rounded-2xl overflow-hidden ring-1 ring-white/10 bg-neutral-950 shadow-2xl flex flex-col">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="text-white/85">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">Schedule</div>
            <div className="text-xl font-semibold">{sessionType}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-xs text-white/50">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
            <input
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="Discord username (optional)"
              className="w-[260px] rounded-lg bg-neutral-900 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-white/20 text-white"
            />
          </div>
        </div>

        <div className="px-6 pb-4 flex-1 min-h-0">
          <div className="h-full grid grid-cols-1 md:grid-cols-[1.1fr_1.4fr] gap-6">
            <div className="relative rounded-2xl ring-1 ring-white/10 bg-white/[0.02] p-4">
              <div
                className="pointer-events-none absolute -inset-px rounded-2xl blur-xl opacity-50"
                style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.16))" }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setMonth((m) => addMonths(m, -1))}
                    className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 ring-1 ring-white/20 text-white/90"
                  >
                    ←
                  </button>
                  <div className="text-white font-semibold">{format(month, "MMMM yyyy")}</div>
                  <button
                    onClick={() => setMonth((m) => addMonths(m, 1))}
                    className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 ring-1 ring-white/20 text-white/90"
                  >
                    →
                  </button>
                </div>

                {loading ? (
                  <div className="h-[300px] grid place-items-center text-white/60">Loading…</div>
                ) : error ? (
                  <div className="h-[300px] grid place-items-center text-rose-400">{error}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-7 text-center text-[11px] text-white/60 mb-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
                        const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
                        const days: Date[] = [];
                        const cur = new Date(start);
                        while (cur <= end) {
                          days.push(new Date(cur));
                          cur.setDate(cur.getDate() + 1);
                        }
                        return days;
                      })().map((d) => {
                        const key = dayKeyLocal(d);
                        const hasAvail = (validStartCountByDay.get(key) ?? 0) > 0;
                        const selected = !!selectedDate && isSameDay(d, selectedDate);
                        const outside = !isSameMonth(d, month);
                        const today = isToday(d);

                        // clamp: only allow tomorrow -> +14
                        const tomorrow = addDays(startOfDay(new Date()), 1);
                        const endWindow = addDays(tomorrow, 14);
                        endWindow.setHours(23, 59, 59, 999);
                        const inWindow = d >= tomorrow && d <= endWindow;

                        return (
                          <button
                            key={key}
                            disabled={!hasAvail || !inWindow}
                            onClick={() => { setSelectedDate(d); setSelectedSlotId(null); }}
                            className={[
                              "aspect-square rounded-lg text-sm ring-1 ring-white/10 transition-all",
                              outside ? "opacity-45" : "",
                              hasAvail && inWindow
                                ? "bg-white/[0.03] hover:bg-white/[0.08]"
                                : "bg-white/[0.02] cursor-not-allowed",
                              selected ? "ring-2 ring-cyan-400/70 bg-cyan-400/10" : "",
                            ].join(" ")}
                          >
                            <div className="flex h-full w-full items-center justify-center relative">
                              <span className="text-white/90">{format(d, "d")}</span>
                              {today && (
                                <span className="absolute inset-0 rounded-lg ring-1 ring-cyan-300 pointer-events-none" />
                              )}
                              {hasAvail && inWindow && !selected && (
                                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="relative rounded-2xl ring-1 ring-white/10 bg-white/[0.02] p-4 flex flex-col">
              <div className="text-white/80 font-medium mb-3">
                {selectedDate ? (
                  <>
                    Available times on{" "}
                    <span className="text-white">{format(selectedDate, "EEE, MMM d")}</span>
                  </>
                ) : (
                  "Select a day to see times"
                )}
              </div>

              <div className="relative flex-1 min-h-0 overflow-auto rounded-xl ring-1 ring-white/10 bg-neutral-950/60">
                {!selectedDate ? (
                  <div className="h-full grid place-items-center text-white/50 text-sm">
                    Pick a day on the left
                  </div>
                ) : validStartsForSelected.length === 0 ? (
                  <div className="h-full grid place-items-center text-white/60 text-sm">
                    No times available for this day.
                  </div>
                ) : (
                  <ul className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {validStartsForSelected.map(({ id, local }) => {
                      const isActive = selectedSlotId === id;
                      const label = local.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                      return (
                        <li key={id}>
                          <button
                            onClick={() => setSelectedSlotId(id)}
                            className={[
                              "w-full px-3 py-2 rounded-lg text-sm ring-1 transition",
                              isActive
                                ? "ring-cyan-400/70 bg-cyan-400/15 text-white"
                                : "ring-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white/90",
                            ].join(" ")}
                          >
                            {label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-3 text-[12px] text-white/50">
                Times are shown in your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
          {dErr && <div className="text-rose-400 text-sm">{dErr}</div>}
          <div className="ml-auto flex gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 ring-1 ring-white/15 text-white"
              onClick={async () => { if (selectedSlotId) await releaseHold(selectedSlotId, holdKey || undefined); onClose?.(); }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white"
              disabled={!selectedSlotId || pending || !discordOk}
              onClick={submitBooking}
            >
              {pending ? "Opening checkout…" : "Continue to payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { addDays, format, isSameDay, isToday } from "date-fns";
import { useMemo } from "react";

type Props = {
  month: Date | string | number | null | undefined; // kept for API compatibility; ignored here
  onMonthChange: (m: Date) => void; // kept for API compatibility; ignored here
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  validStartCountByDay: Map<string, number>;
  displayableDayKeys?: Set<string>;
  loading: boolean;
  error: string | null;
};

function toValidDate(v: unknown, fallback = new Date()) {
  const d =
    v instanceof Date ? v :
    typeof v === "string" ? new Date(v) :
    typeof v === "number" ? new Date(v) :
    new Date(NaN);
  return Number.isNaN(d.getTime()) ? fallback : d;
}
function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default function CalendarGridMobile({
  month, // eslint-disable-line @typescript-eslint/no-unused-vars
  onMonthChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  selectedDate,
  onSelectDate,
  validStartCountByDay,
  displayableDayKeys,
  loading,
  error,
}: Props) {
  // Start from "tomorrow at 00:00", then show 14 consecutive days
  const days = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);

    const list: Date[] = [];
    for (let i = 0; i < 14; i++) list.push(addDays(start, i));
    return list;
  }, [toValidDate(month)]); // recompute on month change for parity

  const left = days.slice(0, 7);
  const right = days.slice(7, 14);

  return (
    <div className="text-white h-full">
      {loading ? (
        <div className="h-[300px] grid place-items-center text-white/60">Loading…</div>
      ) : error ? (
        <div className="h-[300px] grid place-items-center text-rose-400">{error}</div>
      ) : (
        // Two columns: first 7 days LEFT, second 7 days RIGHT
        <div className="grid grid-cols-2 gap-3 h-full">
          {[left, right].map((col, idx) => (
            <div key={idx} className="grid grid-rows-7 gap-3 h-full">
              {col.map((d) => {
                const key = dayKeyLocal(d);

                // Availability logic mirrors desktop:
                const hasAvailDisplayable = displayableDayKeys?.has(key) ?? false;
                const hasAvailLegacy = (validStartCountByDay.get(key) ?? 0) > 0;
                const hasAvail = displayableDayKeys ? hasAvailDisplayable : hasAvailLegacy;

                const selected = !!selectedDate && isSameDay(d, selectedDate);
                const today = isToday(d); // typically false since we start at tomorrow

                const base =
                  "w-full h-full rounded-2xl text-base transition-all relative overflow-hidden flex items-center justify-between px-4";
                const enabled =
                  "bg-[#0d1b34] hover:bg-[#15284a] text-white/90 ring-1 ring-[rgba(146,180,255,.18)]";
                const selectedCls =
                  "bg-[#0d1b34] text-white selected-glow ring-1 ring-[rgba(146,180,255,.35)]";
                const disabled = "bg-[#0b1220] opacity-50 cursor-not-allowed";

                return (
                  <button
                    key={key}
                    disabled={!hasAvail}
                    onClick={() => onSelectDate(d)}
                    className={[base, selected ? selectedCls : hasAvail ? enabled : disabled].join(" ")}
                  >
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[12px] text-white/65">{format(d, "EEE")}</span>
                      <span className="text-[16px] font-semibold">{format(d, "d MMM")}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {today && (
                        <span className="text-[11px] text-[var(--color-lightblue)]">Today</span>
                      )}
                      {hasAvail && (
                        <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-orange)]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

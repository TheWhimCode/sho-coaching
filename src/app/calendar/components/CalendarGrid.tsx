"use client";

import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
  month: Date | string | number | null | undefined; // widened: SSR may pass a string/number
  onMonthChange: (m: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  /** Raw count of *any* valid starts (e.g., 15-min slots). */
  validStartCountByDay: Map<string, number>;
  /** Days that have at least one *displayable* start (e.g., 30-min). If provided, this is authoritative. */
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

export default function CalendarGrid({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  validStartCountByDay,
  displayableDayKeys,
  loading,
  error,
}: Props) {
  // ✅ Ensure we always work with a valid Date at runtime
  const safeMonth = toValidDate(month);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(safeMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(safeMonth), { weekStartsOn: 1 });
    const arr: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [safeMonth]);

  return (
    <div className="text-white">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onMonthChange(addMonths(safeMonth, -1))}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#0d1b34] hover:bg-[#12264a] ring-1 ring-[rgba(146,180,255,.22)] text-white/90"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="font-semibold">{format(safeMonth, "MMMM yyyy")}</div>
        <button
          onClick={() => onMonthChange(addMonths(safeMonth, 1))}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#0d1b34] hover:bg-[#12264a] ring-1 ring-[rgba(146,180,255,.22)] text-white/90"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="h-[300px] grid place-items-center text-white/60">
          Loading…
        </div>
      ) : error ? (
        <div className="h-[300px] grid place-items-center text-rose-400">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 text-center text-[11px] text-white/60 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = dayKeyLocal(d);

              // If displayableDayKeys is provided, only days with a displayable start are "available".
              const hasAvailDisplayable = displayableDayKeys?.has(key) ?? false;
              const hasAvailLegacy = (validStartCountByDay.get(key) ?? 0) > 0;
              const hasAvail = displayableDayKeys
                ? hasAvailDisplayable
                : hasAvailLegacy;

              const selected = !!selectedDate && isSameDay(d, selectedDate);
              const outside = !isSameMonth(d, safeMonth);
              const today = isToday(d);

              // booking window: tomorrow through +14 days (inclusive)
              const tmr = new Date();
              tmr.setDate(tmr.getDate() + 1);
              tmr.setHours(0, 0, 0, 0);
              const end = new Date(tmr);
              end.setDate(end.getDate() + 14);
              end.setHours(23, 59, 59, 999);
              const inWindow = d >= tmr && d <= end;

              const base =
                "aspect-square rounded-xl text-sm transition-all ring-1 ring-[rgba(146,180,255,.18)] relative overflow-hidden";
              const enabled = "bg-[#0d1b34] hover:bg-[#15284a] text-white/90";
              const selectedCls = "shadow-[0_0_8px_2px_#fc8803]";
              const disabled = "bg-[#0b1220] opacity-45 cursor-not-allowed";
              const outsideCls = outside ? "opacity-35" : "";

              return (
                <button
                  key={key}
                  disabled={!hasAvail || !inWindow}
                  onClick={() => onSelectDate(d)}
                  className={[
                    base,
                    outsideCls,
                    hasAvail && inWindow ? enabled : disabled,
                    selected ? selectedCls : "",
                  ].join(" ")}
                >
                  <div className="flex h-full w-full items-center justify-center relative">
                    <span className="text-white">{format(d, "d")}</span>

                    {today && (
                      <span className="absolute top-0.5 inset-x-0 text-[9px] text-[#8FB8E6] font-medium">
                        Today
                      </span>
                    )}

                    {hasAvail && inWindow && (
                      <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#fc8803]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

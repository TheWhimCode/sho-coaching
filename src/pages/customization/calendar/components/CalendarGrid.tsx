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
  month: Date;
  onMonthChange: (m: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  validStartCountByDay: Map<string, number>;
  loading: boolean;
  error: string | null;
};

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
  loading,
  error,
}: Props) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const arr: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [month]);

  return (
    <div className="text-white">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#0d1b34] hover:bg-[#12264a] ring-1 ring-[rgba(146,180,255,.22)] text-white/90"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="font-semibold">{format(month, "MMMM yyyy")}</div>
        <button
          onClick={() => onMonthChange(addMonths(month, 1))}
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
              const hasAvail = (validStartCountByDay.get(key) ?? 0) > 0;
              const selected = !!selectedDate && isSameDay(d, selectedDate);
              const outside = !isSameMonth(d, month);
              const today = isToday(d);

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
              const selectedCls =
                "shadow-[0_0_8px_2px_#fc8803]"; // orange glow only
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

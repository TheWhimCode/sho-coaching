"use client";

import { addDays, format, isSameDay, isToday } from "date-fns";
import { useMemo } from "react";

type Props = {
  month: Date | string | number | null | undefined;
  onMonthChange: (m: Date) => void;
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



export default function DayPicker({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  validStartCountByDay,
  displayableDayKeys,
  loading,
  error,
}: Props) {
  // UI-only: render the next 14 calendar days passed from parent context
  const days = useMemo(() => {
    const base = toValidDate(month);
    const list: Date[] = [];
    for (let i = 0; i < 14; i++) list.push(addDays(base, i));
    return list;
  }, [month]);

  const left = days.slice(0, 7);
  const right = days.slice(7, 14);

  if (loading) {
    return (
      <div className="h-[300px] grid place-items-center text-white/60">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] grid place-items-center text-rose-400">
        {error}
      </div>
    );
  }

  return (
    <div
      className="text-white h-full rounded-2xl ring-1 ring-[rgba(146,180,255,.15)]
                 grid grid-cols-2 isolate"
      style={{
        margin: "calc(var(--pad, 0px) * -1)",
        background: "transparent",
      }}
    >
      {[left, right].map((col, colIdx) => (
        <div key={colIdx} className="grid grid-rows-7 h-full">
          {col.map((d, rowIdx) => {
const key = dayKeyLocal(d);
            const hasAvail = displayableDayKeys?.has(key) ?? false;

            const selected = !!selectedDate && isSameDay(d, selectedDate);
            const today = isToday(d);

            const isLeftCol = colIdx === 0;
            const isRightCol = colIdx === 1;
            const isTopRow = rowIdx === 0;
            const isBottomRow = rowIdx === 6;

            const outerBorderFix =
              `${isLeftCol ? " border-l-0" : ""}` +
              `${isRightCol ? " border-r-0" : ""}` +
              `${isTopRow ? " border-t-0" : ""}` +
              `${isBottomRow ? " border-b-0" : ""}`;

            const cornerRounding =
              `${isLeftCol && isTopRow ? " rounded-tl-2xl" : ""}` +
              `${isRightCol && isTopRow ? " rounded-tr-2xl" : ""}` +
              `${isLeftCol && isBottomRow ? " rounded-bl-2xl" : ""}` +
              `${isRightCol && isBottomRow ? " rounded-br-2xl" : ""}`;

            const base =
              "w-full h-full text-base transition-all flex items-center justify-between px-4 " +
              "border border-[rgba(146,180,255,.12)] bg-transparent";
            const enabled = "hover:bg-[#15284a] text-white/90";
            const selectedCls =
              "text-white selected-glow ring-1 ring-[rgba(146,180,255,.35)] relative z-[1]";
            const disabled = "opacity-40 cursor-not-allowed";

            return (
              <button
                key={key}
                disabled={!hasAvail}
                onClick={() => onSelectDate(d)}
                className={[
                  base,
                  outerBorderFix,
                  cornerRounding,
                  selected ? selectedCls : hasAvail ? enabled : disabled,
                ].join(" ")}
              >
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[12px] text-white/65">
                    {format(d, "EEE")}
                  </span>
                  <span className="text-[16px] font-semibold">
                    {format(d, "d MMM")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {today && (
                    <span className="text-[11px] text-[var(--color-lightblue)]">
                      Today
                    </span>
                  )}
                  {hasAvail && (
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full bg-[var(--color-orange)]"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

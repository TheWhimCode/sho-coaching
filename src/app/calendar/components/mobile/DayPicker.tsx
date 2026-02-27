"use client";

import { addDays, format, isSameDay, isToday, differenceInCalendarDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";

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
    v instanceof Date
      ? v
      : typeof v === "string"
        ? new Date(v)
        : typeof v === "number"
          ? new Date(v)
          : new Date(NaN);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

// Parse "YYYY-MM-DD" into a local Date at midnight.
// This matches how dayKeyLocal() is produced and avoids UTC drift.
function parseDayKeyLocal(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

function computeAnchor(month: Props["month"], displayableDayKeys?: Set<string>) {
  const keys = displayableDayKeys ? Array.from(displayableDayKeys) : [];
  keys.sort(); // YYYY-MM-DD lexicographic sort == chronological sort

  const first = keys[0];
  if (first) {
    const d = parseDayKeyLocal(first);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return toValidDate(month);
}

function inWindow(anchor: Date, d: Date) {
  const diff = differenceInCalendarDays(d, anchor);
  return diff >= 0 && diff < 14;
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
  // Keep a stable "anchor" for the 14-day window.
  // It should not change when selecting a day (otherwise the selected day jumps to the top).
  const [anchor, setAnchor] = useState<Date>(() => computeAnchor(month, displayableDayKeys));

  // When month or availability changes, recompute the anchor.
  // (If you don't want month to affect anything, remove `month` from deps.)
  useEffect(() => {
    setAnchor(computeAnchor(month, displayableDayKeys));
  }, [month, displayableDayKeys]);

  // Optional: if parent sets a selectedDate that is outside the current window,
  // shift anchor to keep it visible. (Remove this block if you never want shifting.)
  useEffect(() => {
    if (!selectedDate) return;
    if (Number.isNaN(anchor.getTime())) return;
    if (!inWindow(anchor, selectedDate)) {
      setAnchor(selectedDate);
    }
  }, [selectedDate, anchor]);

  // UI-only: render the next 14 calendar days starting from anchor
  const days = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < 14; i++) list.push(addDays(anchor, i));
    return list;
  }, [anchor]);

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

            const baseCls =
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
                  baseCls,
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
"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";

export type CalendarSlot = {
  startISO: string;   // slot start in ISO string
  durationMin: number;
  taken?: boolean;
};

type Props = {
  weekStart: Date;                      // first visible day
  hours?: { start: number; end: number }; // 24h, e.g. {start:10,end:22}
  stepMin?: number;                     // slot granularity, default 60
  takenSlots?: string[];                // ISO list to mark as taken
  selectedISO?: string | null;          // ISO of selected slot
  onSelect: (iso: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function formatDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function toISO(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)+":00.000Z";
}

export default function CalendarGrid({
  weekStart,
  hours = { start: 12, end: 22 },
  stepMin = 60,
  takenSlots = [],
  selectedISO,
  onSelect,
  onPrevWeek,
  onNextWeek,
}: Props) {
  // build visible matrix
  const matrix = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const rows = Array.from(
      { length: Math.ceil((hours.end - hours.start) * 60 / stepMin) },
      (_, r) => hours.start * 60 + r * stepMin
    );
    return { days, rows };
  }, [weekStart, hours.start, hours.end, stepMin]);

  const isTaken = (iso: string) => takenSlots.includes(iso);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with week nav */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onPrevWeek}
                className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 ring-1 ring-white/15">
          ← Prev
        </button>
        <div className="text-sm text-white/70">
          {formatDayLabel(matrix.days[0])} — {formatDayLabel(matrix.days[6])}
        </div>
        <button onClick={onNextWeek}
                className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 ring-1 ring-white/15">
          Next →
        </button>
      </div>

      {/* Grid */}
      <div className="relative flex-1 rounded-xl ring-1 ring-white/15 overflow-hidden">
<div className="grid h-full"
       style={{
         gridTemplateColumns: `110px repeat(7, minmax(140px, 1fr))`,
         gridTemplateRows: `36px repeat(${matrix.rows.length},)`
       }}>
          {/* Top-left empty */}
          <div className="bg-white/5" />

          {/* Day headers */}
          {matrix.days.map((d, i) => (
            <div key={i}
                 className="bg-white/5 text-center text-xs md:text-sm font-medium
                            ring-1 ring-white/10 flex items-center justify-center">
              {formatDayLabel(d)}
            </div>
          ))}

          {/* Hour labels + slots */}
          {matrix.rows.map((minFromMidnight, r) => {
            const hh = Math.floor(minFromMidnight / 60);
            const label = `${hh.toString().padStart(2, "0")}:00`;

            return (
              <>
                {/* row label */}
                <div key={`label-${r}`}
                     className="bg-white/5 text-xs md:text-sm text-white/70
                                ring-1 ring-white/10 flex items-center justify-center">
                  {label}
                </div>

                {/* row cells for each day */}
                {matrix.days.map((day, c) => {
                  const slotDate = new Date(day);
                  slotDate.setHours(0, 0, 0, 0);
                  slotDate.setMinutes(minFromMidnight);
                  const iso = toISO(slotDate);

                  const taken = isTaken(iso);
                  const selected = selectedISO === iso;

                  return (
                    <button
                      key={`cell-${r}-${c}`}
                      disabled={taken}
                      onClick={() => onSelect(iso)}
                      className={[
                        "ring-1 ring-white/10 text-xs md:text-sm",
                        "hover:bg-white/10 transition-colors",
                        taken ? "bg-white/[0.04] text-white/35 cursor-not-allowed" : "bg-white/[0.02]",
                        selected && "bg-emerald-500/25 outline outline-2 outline-emerald-400/60"
                      ].filter(Boolean).join(" ")}
                    />
                  );
                })}
              </>
            );
          })}
        </div>

        {/* subtle moving scanlines (optional) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_2px] opacity-30"
          animate={{ backgroundPositionY: [0, 2] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
      </div>
    </div>
  );
}

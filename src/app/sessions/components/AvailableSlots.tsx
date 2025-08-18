export type Slot = { id: string; startISO: string; durationMin: number; isTaken: boolean };

function dayDiffLocal(a: Date, b: Date) {
  const da = new Date(a); da.setHours(0,0,0,0);
  const db = new Date(b); db.setHours(0,0,0,0);
  return Math.round((da.getTime() - db.getTime()) / 86_400_000);
}

function niceDayLabel(dt: Date) {
  const now = new Date();
  const diff = dayDiffLocal(dt, now); // positive if in the future same day boundary

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff >= 2 && diff <= 6) {
    return dt.toLocaleDateString([], { weekday: "long" }); // e.g., "Friday"
  }
  // 7+ days away: full date
  return dt.toLocaleDateString([], { dateStyle: "medium" }); // e.g., "Sep 4, 2025"
}

export default function AvailableSlots({
  slots,
  onPick,
}: {
  slots: Slot[];
  onPick?: (id: string) => void;
}) {
  return (
    <div className="mt-1 grid grid-cols-1 gap-2">
      {slots.map((s) => {
        const dt = new Date(s.startISO);
        const day = niceDayLabel(dt);
        const time = dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        return (
          <button
            key={s.id}
            disabled={s.isTaken}
            onClick={() => onPick?.(s.id)}
            className="rounded-xl px-3 py-2 text-sm border border-white/10 hover:border-white/30 disabled:opacity-40 text-left"
            title={dt.toLocaleString()}
          >
            <span className="font-medium">{day}</span>
            <span className="mx-1 text-white/40">•</span>
            <span>{time}</span>
          </button>
        );
      })}
    </div>
  );
}

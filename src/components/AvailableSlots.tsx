import { SlotStatus } from "@prisma/client";

export type Slot = {
  id: string;
  startISO: string;
  durationMin: number;
  status: SlotStatus;           // free | blocked | taken
  label?: string;               // optional
};

function dayDiffLocal(a: Date, b: Date) {
  const da = new Date(a); da.setHours(0,0,0,0);
  const db = new Date(b); db.setHours(0,0,0,0);
  return Math.round((da.getTime() - db.getTime()) / 86_400_000);
}

function niceDayLabel(dt: Date) {
  const now = new Date();
  const diff = dayDiffLocal(dt, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff >= 2 && diff <= 6) return dt.toLocaleDateString([], { weekday: "long" });
  return dt.toLocaleDateString([], { dateStyle: "medium" });
}

export default function AvailableSlots({
  slots,
  onPick,
}: {
  slots: Slot[];
  onPick?: (id: string) => void;
}) {
  return (
    <div className=" grid grid-cols-1 gap-2">
      {slots
        // ✅ only keep slots that are free and aligned to 30-min grid
        .filter(
          (s) =>
            s.status === SlotStatus.free &&
            [0, 30].includes(new Date(s.startISO).getMinutes())
        )
        .map((s) => {
          const dt = new Date(s.startISO);
          const day = niceDayLabel(dt);
          const time = dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          return (
            <button
              key={s.id}
              onClick={() => onPick?.(s.id)}
              className="h-10 w-full rounded-xl px-3 text-sm ring-1 ring-white/10 
                         hover:ring-white/30 text-left transition-colors"
              title={dt.toLocaleString()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{day}</span>
                  <span className="mx-1 text-white/40">•</span>
                  <span>{time}</span>
                </div>
                {s.label && <span className="text-xs text-white/60">{s.label}</span>}
              </div>
            </button>
          );
        })}
    </div>
  );
}

"use client";

type Slot = { id: string; local: Date | string | number };

type Props = {
  slots?: Slot[];                         // ← may be undefined at build
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  showTimezoneNote?: boolean;
  emptyMessage?: string;
};

function toDate(v: Date | string | number) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default function TimeSlotsList({
  slots,
  selectedSlotId,
  onSelectSlot,
  showTimezoneNote = false,
  emptyMessage = "Select a day first.",
}: Props) {
  const safeSlots = (slots ?? []).map((s) => ({ ...s, local: toDate(s.local) }));

  return (
    <div className="text-white flex flex-col h-full">
      <div className="relative flex-1 min-h-0 overflow-auto">
        {safeSlots.length === 0 ? (
          <div className="h-full grid place-items-center text-white/60 text-sm px-3 text-center">
            {emptyMessage}
          </div>
        ) : (
          <ul className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {safeSlots.map(({ id, local }) => {
              const isActive = selectedSlotId === id;
              const label = local.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
              return (
                <li key={id}>
                  <button
                    onClick={() => onSelectSlot(id)}
                    className={[
                      "w-full px-3.5 py-3 rounded-xl text-sm transition ring-1 supports-[backdrop-filter]:backdrop-blur-md",
                      isActive
                        ? "ring-[rgba(120,160,255,.55)] bg-[#0d1b34] text-white shadow-[0_0_6px_rgba(56,124,255,.35)]"
                        : "ring-[rgba(146,180,255,.18)] bg-[#0d1b34] hover:bg-[#15284a] text-white/90",
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

      {showTimezoneNote && (
        <div className="mt-3 text-[12px] text-[#8FB8E6]">
          Times are shown in your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import TypingText from "@/app/_components/animations/TypingText";

type Slot = { id: string; local: Date | string | number };

type Props = {
  slots?: Slot[];
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  showTimezoneNote?: boolean;
  emptyMessage?: string;
  typingSpeedMs?: number;
  revealDelayMs?: number;
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
  typingSpeedMs = 22,
  revealDelayMs = 500,
}: Props) {
  const safeSlots = useMemo(
    () => (slots ?? []).map((s) => ({ ...s, local: toDate(s.local) })),
    [slots]
  );

  const hasSlots = safeSlots.length > 0;

  const timezoneText = useMemo(() => {
    const tz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "";
    return `Times are shown in your timezone: ${tz}`;
  }, []);

  return (
    <div className="text-white flex flex-col h-full">
      {/* bleed container to prevent clipping */}
      <div className="relative flex-1 min-h-0 overflow-auto -m-2 p-2">
        {!hasSlots ? (
          <div className="h-full grid place-items-center text-white/60 text-sm px-3 text-center">
            {emptyMessage}
          </div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {safeSlots.map(({ id, local }) => {
              const isActive = selectedSlotId === id;
              const label = local.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <li key={id}>
                  <button
                    onClick={() => onSelectSlot(id)}
                    className={[
                      "w-full px-3.5 py-4 rounded-xl text-sm transition ring-1 supports-[backdrop-filter]:backdrop-blur-md leading-none",
                      isActive
                        ? "bg-[#0d1b34] text-white ring-[var(--color-lightblue)] shadow-[0_0_10px_1px_var(--color-lightblue)]"
                        : "bg-[#0d1b34] hover:bg-[#15284a] text-white/90 ring-[rgba(146,180,255,.18)]",
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

      {showTimezoneNote && hasSlots && (
        <div className="mt-3 text-[12px] text-[var(--color-lightblue)] leading-none">
          <TypingText
            text={timezoneText}
            speed={typingSpeedMs}
            delay={revealDelayMs}
            color="var(--color-lightblue)"
          />
        </div>
      )}
    </div>
  );
}

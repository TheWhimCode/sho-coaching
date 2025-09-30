// components/HeroSection/RightBooking.tsx
"use client";

import { motion } from "framer-motion";
import AvailableSlots, { Slot as UiSlot } from "@/components/AvailableSlots";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import SlotSkeletons from "@/components/SlotSkeletons";

type Props = {
  liveMinutes: number;
  loading: boolean;
  slots: UiSlot[]; // should already include label/durationMin/status
  onOpenCalendar?: (opts: { slotId?: string; liveMinutes: number }) => void;
  onCustomize?: () => void;
};

export default function RightBookingPanel({
  liveMinutes,
  loading,
  slots,
  onOpenCalendar,
  onCustomize,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="self-start md:justify-self-end w-full max-w-sm"
    >
      {/* Let children control spacing explicitly */}
      <GlassPanel className="p-4 md:p-5 flex flex-col">
        {/* CTA + Customize: match AvailableSlots button spacing (gap-2) */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute -inset-1 rounded-xl blur-md opacity-30 -z-10 bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]" />
            <button
              onClick={() => onOpenCalendar?.({ liveMinutes })}
              className="relative z-10 w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]"
            >
              Choose Time
            </button>
          </div>

          {onCustomize && (
            <button
              onClick={onCustomize}
              className="w-full rounded-xl px-5 py-3 text-base font-medium bg-white/10 hover:bg-white/15 ring-1 ring-white/15 transition"
            >
              Customize
            </button>
          )}
        </div>

        {/* Spacer equal to panel padding (p-5 = 20px) ONLY here */}
        {(onCustomize ?? false) && <div className="h-4 md:h-5" />}

        {/* Header + slots/skeletons share the same grid to keep spacing identical */}
        <div className="grid grid-cols-1 gap-2">
          {/* Header moved here (remove it from AvailableSlots) */}
          <div className="whitespace-pre tabular-nums text-xs leading-none">
            <span style={{ color: "var(--color-lightblue)" }}>
              Next available times — in your timezone
            </span>
          </div>

          {loading ? (
            // Your SlotSkeletons adds mt-1; cancel it so spacing matches exactly.
            <div>
              <SlotSkeletons count={3} />
            </div>
          ) : slots.length ? (
            <AvailableSlots
              slots={slots}
              onPick={(id) => onOpenCalendar?.({ slotId: id, liveMinutes })}
            />
          ) : (
            <div className="text-xs text-white/60">
              No times found in the next 2 weeks.
            </div>
          )}
        </div>

        {/* Same padding-sized spacer between AvailableSlots and footer */}
        <div className="h-4 md:h-5" />

        {/* Footer untouched */}
        <p className="text-xs text-white/60">Secure checkout (Stripe)</p>
      </GlassPanel>
    </motion.div>
  );
}

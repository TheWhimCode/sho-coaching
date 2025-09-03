// components/HeroSection/RightBooking.tsx
"use client";

import { motion } from "framer-motion";
import AvailableSlots, { Slot as UiSlot } from "@/components/AvailableSlots";

type Props = {
  liveMinutes: number;
  loading: boolean;
  slots: UiSlot[]; // should already include label/durationMin/status
  onOpenCalendar?: (opts: { slotId?: string; liveMinutes: number }) => void;
  onCustomize?: () => void;
};

// Single shimmer row (self-contained sweep)
function ShimmerRow() {
  return (
    <div
      className="relative h-10 rounded-lg ring-1 ring-white/12 bg-white/[0.05] overflow-hidden"
      aria-busy="true"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          // NOTE: correct gradient syntax (no "="), and use mix-blend for visibility
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          mixBlendMode: "overlay",
        }}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}

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
      <div className="rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-[1px] bg-[#0B1220]/10 ring-1 ring-[rgba(146,180,255,.18)]">
        {/* CTA */}
        <div className="relative">
          <span className="pointer-events-none absolute -inset-1 rounded-xl blur-md opacity-30 -z-10 bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]" />
          <button
            onClick={() => onOpenCalendar?.({ liveMinutes })}
            className="relative z-10 w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]"
          >
            Book now
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

        {/* Next available */}
        <div className="mt-1 text-xs text-[#8FB8E6]">Next available</div>

        {loading ? (
          <div className="space-y-2">
            <ShimmerRow />
            <ShimmerRow />
            <ShimmerRow />
          </div>
        ) : slots.length ? (
          <AvailableSlots
            slots={slots}
            onPick={(id) => onOpenCalendar?.({ slotId: id, liveMinutes })}
          />
        ) : (
          <div className="mt-2 text-xs text-white/60">
            No times found in the next 2 weeks.
          </div>
        )}

        <p className="text-xs text-white/70 mt-1">
          Secure checkout (Stripe).
        </p>
      </div>
    </motion.div>
  );
}

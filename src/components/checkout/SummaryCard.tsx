"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Breakdown } from "./buildBreakdown";

type Props = {
  baseMinutes: number;
  liveBlocks: number;
  followups: number;
  breakdown: Breakdown;
  isOpen: boolean;
  onConfirm: () => void;
  /** optional: when present, shows a Back button inside the header row */
  onBack?: () => void;
};

export default function SummaryCard({
  baseMinutes,
  liveBlocks,
  followups,
  breakdown: b,
  isOpen,
  onConfirm,
  onBack,
}: Props) {
  const inGameMinutes = liveBlocks * 45;

  return (
    <div className="h-full rounded-xl p-3 ring-1 ring-white/12 bg-white/[.04] flex flex-col">
      {/* Header row: back (left) + centered title + divider (tightened spacing) */}
      <div className="mb-2">
        <div className="relative h-7 flex items-center justify-center">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-0 text-sm text-white/80 hover:text-white"
            >
              ← Back
            </button>
          )}
          <div className="text-sm text-white/80">Order summary</div>
        </div>
        <div className="mt-1 border-t border-white/10" />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="overflow-hidden flex-1 flex flex-col"
          >
            {/* top lines */}
            <dl className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-white/80">{baseMinutes} min Coaching base</dt>
                <dd className="text-white/90">€{b.minutesEUR.toFixed(0)}</dd>
              </div>

              {liveBlocks > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-white/80">{inGameMinutes} min In-game coaching</dt>
                  <dd className="text-white/90">€{b.inGameEUR.toFixed(0)}</dd>
                </div>
              )}

              {followups > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-white/80">{followups}× Follow-up</dt>
                  <dd className="text-white/90">€{b.followupsEUR.toFixed(0)}</dd>
                </div>
              )}
            </dl>

            {/* bottom group pinned to the bottom */}
            <div className="mt-auto space-y-3">
              <div className="pt-3 border-t border-white/10 flex items-center justify-between font-semibold">
                <span className="text-white">Total</span>
                <span className="text-white">€{b.total.toFixed(0)}</span>
              </div>

              <button
                onClick={onConfirm}
                className="relative w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                           bg-[#fc8803] hover:bg-[#f8a81a] transition
                           shadow-[0_10px_28px_rgba(245,158,11,.35)]
                           ring-1 ring-[rgba(255,190,80,.55)]"
              >
                Confirm & continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

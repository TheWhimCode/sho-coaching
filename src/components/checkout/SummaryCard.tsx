"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Breakdown } from "./types";

type Props = {
  minutes: number;
  liveBlocks: number;
  followups: number;
  breakdown: Breakdown;
  isOpen: boolean;
  onConfirm: () => void;
};

export default function SummaryCard({
  minutes, liveBlocks, followups, breakdown, isOpen, onConfirm,
}: Props) {
  return (
    <div className="rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]">
      <div className="text-sm text-white/80 mb-2">Order summary</div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <dl className="text-sm space-y-1">
              <Row label={`${minutes} min session`} value={e(breakdown.baseEUR)} />
              {breakdown.extraEUR !== 0 && (
                <Row
                  label={breakdown.extraLabel}
                  value={e(breakdown.extraEUR)}
                />
              )}
              {followups > 0 && (
                <Row label={`${followups}× Follow-up`} value={e(breakdown.followupsEUR)} />
              )}
            </dl>

            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[15px] font-semibold">
              <span className="text-white/80">Total</span>
              <span className="text-white">{e(breakdown.total)}</span>
            </div>

            <button
              className="mt-4 w-full rounded-xl px-4 py-2 font-semibold bg-white/15 hover:bg-white/20 ring-1 ring-white/20 transition"
              onClick={onConfirm}
            >
              Confirm & continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-white/70">{label}</dt>
      <dd className="text-white/90">{value}</dd>
    </div>
  );
}

const e = (n: number) => `€${n}`;

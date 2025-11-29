"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  decreaseDuration,
  increaseDuration,
  incrementLiveBlock,
  decrementLiveBlock,
  incrementFollowups,
  decrementFollowups,
} from "./customizationOptions";
import { Cfg } from "@/engine/session/config";
import { CaretDown } from "@phosphor-icons/react";

export default function CustomizationSection({
  cfg,
  onChange,
  squareBtn,
  expanded,
  onExpandToggle,
}: {
  cfg: Cfg;
  onChange: (c: Cfg) => void;
  squareBtn: string;
  expanded: boolean;
  onExpandToggle: () => void;
}) {
  return (
    <div
      className={[
        "relative rounded-xl px-4 py-5 w-full transition overflow-hidden",

        // Softer border + invisible substrate to fix washed-out ring
        "ring-1 ring-white/8 shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]",

      ].join(" ")}
    >
      {/* CLICK OVERLAY — full area clickable only when collapsed */}
      {!expanded && (
        <button
          className="absolute inset-0 w-full h-full z-10 cursor-pointer bg-transparent"
          onClick={onExpandToggle}
        />
      )}

      {/* HEADER (not clickable; overlay handles clicks) */}
      <div className="flex items-center justify-between w-full text-left select-none text-base font-semibold pointer-events-none">
        <span>Add/remove time</span>

        <span className="flex items-center gap-2">
          {expanded ? (
            <span className="text-sm opacity-80">{`${cfg.liveMin} min`}</span>
          ) : (
            <CaretDown size={20} weight="bold" />
          )}
        </span>
      </div>

      {/* EXPANDING CONTENT */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="extra"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.45,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{ overflow: "hidden" }}
            className="mt-0 relative z-0"
          >
            <Row
              label="Add/remove time"
              labelClass="sr-only"
              value=""
              btnDec={() => onChange(decreaseDuration(cfg))}
              btnInc={() => onChange(increaseDuration(cfg))}
              disableDec={cfg.liveMin <= 30 && cfg.liveBlocks === 0}
              disableInc={cfg.liveMin + cfg.liveBlocks * 45 >= 120}
              squareBtn={squareBtn}
              decLabel="−15"
              incLabel="+15"
            />

            <Row
              label="In-game coaching"
              value={`${cfg.liveBlocks} × 45 min`}
              btnDec={() => onChange(decrementLiveBlock(cfg))}
              btnInc={() => onChange(incrementLiveBlock(cfg))}
              disableDec={cfg.liveBlocks === 0}
              disableInc={
                cfg.liveMin + (cfg.liveBlocks + 1) * 45 > 120 ||
                cfg.liveBlocks >= 2
              }
              squareBtn={squareBtn}
              decLabel="−45"
              incLabel="+45"
            />

            <Row
              label="Follow-up recordings"
              value={`${cfg.followups} × 15 min`}
              btnDec={() => onChange(decrementFollowups(cfg))}
              btnInc={() => onChange(incrementFollowups(cfg))}
              disableDec={cfg.followups === 0}
              disableInc={cfg.followups >= 2}
              squareBtn={squareBtn}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  label,
  labelClass = "",
  value,
  btnInc,
  btnDec,
  disableInc,
  disableDec,
  squareBtn,
  decLabel = "−",
  incLabel = "+",
}: any) {
  return (
    <section className="mb-3 last:mb-2">
      <div className="flex items-center justify-between">
        <span className={`text-[15px] md:text-[16px] font-semibold ${labelClass}`}>
          {label}
        </span>
        <span className="text-sm opacity-80">{value}</span>
      </div>

      <div className="mt-2 flex gap-2">
        <button className={squareBtn} disabled={disableDec} onClick={btnDec}>
          {decLabel}
        </button>
        <button className={squareBtn} disabled={disableInc} onClick={btnInc}>
          {incLabel}
        </button>
      </div>
    </section>
  );
}

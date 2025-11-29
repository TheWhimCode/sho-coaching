// BundleButton with orange glow class

"use client";

import { Cfg } from "@/engine/session/config";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  cfg: Cfg;
  isMobile?: boolean;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
};

export default function BundleButton({
  cfg,
  isMobile = false,
  expanded,
  onExpandChange,
}: Props) {
  const isActive = cfg.productType === "bundle";
  const toggle = () => onExpandChange(!expanded);

  return (
    <motion.button
      type="button"
      animate={expanded ? { scale: 1.025 } : { scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={toggle}
      className={[
        "relative w-full text-left rounded-xl transition overflow-hidden",
        "px-4 py-3",
        "bg-transparent hover:bg-transparent",

        isMobile
          ? "ring-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]"
          : "ring-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,.35)]",

        // Use global orange glow class
        isActive ? "orange-glow" : "ring-white/12",
      ].join(" ")}
    >
      {/* HEADER */}
      <div className="relative flex items-center overflow-hidden">
        <div className="grow">
          <div className="font-semibold text-[17px]">Bootcamp Bundle</div>
          <div className="text-[13px] opacity-90">60 min × 4</div>
        </div>

        <div className="text-lg font-semibold whitespace-nowrap flex items-center gap-1">
          <span className="bg-gradient-to-br from-[#3EA8FF] to-[#FFA033]
            bg-clip-text text-transparent font-bold text-[20px]
            drop-shadow-[0_0_16px_rgba(255,200,120,1)]
            drop-shadow-[0_0_40px_rgba(255,170,70,1)]"
          >
            €110
          </span>
          <span className="opacity-60 text-[12px] line-through">€160</span>
        </div>
      </div>

      {/* EXPANDED SECTION */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="bundle-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2 pb-1 overflow-hidden">
              <Row label="Session 1" price="€35" level={1} />
              <Row label="Session 2" price="€30" level={2} />
              <Row label="Session 3" price="€25" level={3} />
              <Row label="Session 4" price="€20" level={4} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* Opacity + saturation ramp */
function Row({
  label,
  price,
  level,
}: {
  label: string;
  price: string;
  level: 1 | 2 | 3 | 4;
}) {
  const size =
    level === 1
      ? "text-[14px]"
      : level === 2
      ? "text-[15px]"
      : level === 3
      ? "text-[16px]"
      : "text-[17px]";

  const opacity =
    level === 1
      ? "opacity-40"
      : level === 2
      ? "opacity-60"
      : level === 3
      ? "opacity-80"
      : "opacity-100";

  const saturation =
    level === 1
      ? "saturate-50"
      : level === 2
      ? "saturate-75"
      : level === 3
      ? "saturate-100"
      : "saturate-150";

  const glow =
    level === 4
      ? "drop-shadow-[0_0_3px_rgba(255,180,70,.3)] drop-shadow-[0_0_6px_rgba(255,150,40,.25)]"
      : "";

  return (
    <div className="flex items-center justify-between font-bold overflow-hidden">
      <span
        className={`bg-gradient-to-br from-[#3EA8FF] to-[#FFA033] bg-clip-text text-transparent ${size} ${opacity} ${saturation} ${glow}`}
      >
        {label}
      </span>

      <span
        className={`bg-gradient-to-br from-[#3EA8FF] to-[#FFA033] bg-clip-text text-transparent ${size} ${opacity} ${saturation} ${glow}`}
      >
        {price}
      </span>
    </div>
  );
}

// SessionGlowingBlock.tsx
"use client";
import { ReactNode, useState, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  // MAIN block
  isMain?: boolean;
  label: string;                 // "VOD review" or "Bonus time"
  minutes?: number;              // MAIN: total minutes (base + extras)
  price?: number;                // MAIN: base price ONLY (fixed)
  extraMinutes?: number;         // MAIN: for the tiny hint ("includes +X min")

  // ADD-ON block
  bonusPrice?: number;           // ADD-ON: shows "+€X" only

  className?: string;
  endSlot?: ReactNode;
  infoText?: string;
  style?: CSSProperties;         // allow height scaling
};

export default function SessionGlowingBlock({
  isMain = false,
  label,
  minutes,
  price,
  extraMinutes = 0,
  bonusPrice,
  className = "",
  endSlot,
  infoText = "This is your session. Feel free to customize it.",
  style,
  
}: Props) {
  const [showTip, setShowTip] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: isMain ? 1.02 : 1.01 }}
          animate={{
      filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"],
    }}
    transition={{
      duration: 0.15,
      repeat: Infinity,
      repeatDelay: 3 + Math.random() * 3, // random-ish delay
    }}
      className={`relative rounded-2xl p-[2px] bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 ${className}`}
      style={style}
      
    >
      <div className="relative rounded-2xl bg-black/60 backdrop-blur p-5 ring-1 ring-white/10 text-center">
        {/* ? tooltip trigger */}
        <div
          className="absolute right-3 top-3 flex items-center gap-2"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          {endSlot}
          <button
            aria-label="Info"
            className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/15 ring-1 ring-white/10 text-white/90 text-sm font-semibold grid place-items-center"
            onFocus={() => setShowTip(true)}
            onBlur={() => setShowTip(false)}
          >
            ?
          </button>

          {/* tooltip: top-right, small, connected */}
          <AnimatePresence>
            {showTip && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 bottom-[calc(100%+8px)] z-20"
              >
                <div className="relative">
                  <div className="absolute -bottom-1.5 right-3 h-3 w-3 rotate-45 bg-neutral-900/95 ring-1 ring-white/10" />
                  <div className="ml-8 max-w-[240px] rounded-lg bg-neutral-900/95 ring-1 ring-white/10 px-3 py-2 text-xs text-white/85 text-left shadow-lg">
                    {infoText}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONTENT */}
        {isMain ? (
          <>
            {/* Big total minutes (base + extras) */}
            <div className="text-4xl md:text-5xl font-extrabold leading-none">
              {minutes} min
            </div>
            {/* Label + FIXED base price */}
            <p className="mt-1 text-sm text-white/80">
              {label} • €{price}
            </p>
          </>
        ) : (
          <>
            {/* Add-on shows NO time; only label + +price */}
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs text-white/75">+€{bonusPrice}</div>
          </>
        )}
      </div>

      {/* outer glow */}
      <div className="pointer-events-none absolute -inset-3 rounded-3xl blur-2xl bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-violet-500/20" />
    </motion.div>
  );
}

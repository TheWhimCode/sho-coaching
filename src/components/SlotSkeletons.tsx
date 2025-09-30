"use client";
import { motion } from "framer-motion";

export default function SlotSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative h-10 w-full rounded-xl px-3 ring-1 ring-white/10 bg-white/5 overflow-hidden"
        >
          <div className="flex items-center justify-between h-full">
            <div className="w-28 h-3 rounded bg-white/10" />
            <div className="w-12 h-3 rounded bg-white/10" />
          </div>

          {/* shimmer sweep */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              mixBlendMode: "overlay",
            }}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
          />
        </div>
      ))}
    </div>
  );
}

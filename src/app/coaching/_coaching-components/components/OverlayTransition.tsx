// src/app/_components/TransitionOverlay.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

export default function TransitionOverlay({
  active,
  onComplete,
  duration = 0.7,
}: {
  active: boolean;
  onComplete?: () => void;
  duration?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const completedRef = useRef(false);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
    if (active) completedRef.current = false; // reset per run
  }, [active]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleComplete = useMemo(
    () => () => {
      if (!activeRef.current || completedRef.current) return;
      completedRef.current = true;
      onComplete?.();
    },
    [onComplete]
  );

  if (!mounted) return null;

  const R = 60; // rounded top radius

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          key="transition-overlay"
          // solid, opaque curtain that slides up
          initial={{ y: "100%", opacity: 1, borderTopLeftRadius: R, borderTopRightRadius: R }}
          animate={{
            y: 0,
            borderTopLeftRadius: [R, R, 0],
            borderTopRightRadius: [R, R, 0],
          }}
          // no exit → instant cut on cancel/back
          transition={{
            y: { duration, ease: [0.22, 1, 0.36, 1] },
            borderTopLeftRadius: { duration, times: [0, 0.85, 1] },
            borderTopRightRadius: { duration, times: [0, 0.85, 1] },
          }}
          onAnimationComplete={handleComplete}
          className="fixed inset-0 z-[100000] bg-black"
          style={{
            willChange: "transform, border-radius",
            overflow: "hidden",
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
          aria-hidden
        >
          {/* Subtle, wide glow across the top third.
              - Very low alpha; visible but gentle.
              - Linear base + three soft domes (L/C/R) to spread it across width.
              - Attached to the moving top; slight drift + fade near the end. */}
          <motion.div
            className="pointer-events-none absolute left-0 right-0 top-0 z-10"
            style={{
              height: "34vh", // ~top third
              background: `
                /* base vertical ramp (subtle) */
                linear-gradient(
                  to bottom,
                  rgba(210,225,255,0.12) 0%,
                  rgba(210,225,255,0.045) 28%,
                  rgba(210,225,255,0.00) 80%
                ),
                /* three soft domes */
                radial-gradient(
                  140% 120% at 15% 0%,
                  rgba(210,230,255,0.07) 12%,
                  rgba(210,230,255,0.00) 60%
                ),
                radial-gradient(
                  140% 120% at 50% 0%,
                  rgba(210,230,255,0.09) 12%,
                  rgba(210,230,255,0.00) 60%
                ),
                radial-gradient(
                  140% 120% at 85% 0%,
                  rgba(210,230,255,0.07) 12%,
                  rgba(210,230,255,0.00) 60%
                )
              `,
              mixBlendMode: "screen", // ensures visibility on black but stays subtle
              filter: "blur(10px)",   // soft, wide falloff
              borderTopLeftRadius: R,
              borderTopRightRadius: R,
            }}
            initial={{ y: 12, opacity: 0.18 }}
            animate={{
              y: -6,
              opacity: [0.18, 0.1, 0.0], // fades as motion slows
              borderTopLeftRadius: [R, 0],
              borderTopRightRadius: [R, 0],
            }}
            transition={{
              duration,
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration, times: [0.35, 0.75, 1] },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

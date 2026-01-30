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
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    activeRef.current = active;
    if (active) {
      completedRef.current = false;
    } else {
      // Clear any pending navigation when overlay closes
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    }
  }, [active]);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Clean up on popstate
  useEffect(() => {
    const handlePopState = () => {
      activeRef.current = false;
      completedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Clean up on bfcache restoration
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        activeRef.current = false;
        completedRef.current = false;
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleComplete = useMemo(
    () => () => {
      if (!activeRef.current || completedRef.current) return;
      completedRef.current = true;
      
      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      
      // Wait longer to ensure animation is fully done and DOM is stable
      navigationTimeoutRef.current = setTimeout(() => {
        if (activeRef.current && onComplete) {
          onComplete();
        }
      }, 150);
    },
    [onComplete]
  );

  if (!mounted) return null;

  const R = 60;

  return createPortal(
    <AnimatePresence mode="wait">
      {active && (
        <motion.div
          key="transition-overlay"
          initial={{ y: "100%", opacity: 1, borderTopLeftRadius: R, borderTopRightRadius: R }}
          animate={{
            y: 0,
            borderTopLeftRadius: [R, R, 0],
            borderTopRightRadius: [R, R, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            y: { duration, ease: [0.22, 1, 0.36, 1] },
            borderTopLeftRadius: { duration, times: [0, 0.85, 1] },
            borderTopRightRadius: { duration, times: [0, 0.85, 1] },
            opacity: { duration: 0.2 },
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
          <motion.div
            className="pointer-events-none absolute left-0 right-0 top-0 z-10"
            style={{
              height: "120vh",
              background: `
                linear-gradient(
                  to bottom,
                  rgba(210,225,255,0.12) 0%,
                  rgba(210,225,255,0.045) 28%,
                  rgba(210,225,255,0.00) 80%
                )
              `,
              mixBlendMode: "screen",
              filter: "blur(10px)",
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              willChange: "transform, opacity",
            }}
            initial={{ y: "0vh", opacity: 0.18 }}
            animate={{
              y: ["-1vh", "-1vh", "0vh"],
              opacity: [0.18, 0.14, 0.0],
            }}
            transition={{
              duration,
              ease: [0.22, 1, 0.36, 1],
              y: { duration, times: [0.0, 0.7, 1.0] },
              opacity: { duration, times: [0.35, 0.7, 1.0] },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
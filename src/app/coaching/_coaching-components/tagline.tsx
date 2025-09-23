"use client";

import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Active = "top" | "bottom";

export default function Tagline() {
  const topControls = useAnimation();
  const bottomControls = useAnimation();

  const topRef = useRef<HTMLHeadingElement | null>(null);
  const bottomRef = useRef<HTMLHeadingElement | null>(null);

  // Top needs its own inView so it stays 0.2 when offscreen (coming from below).
  const topInView = useInView(topRef, { margin: "0px 0px -5% 0px" });
  // Bottom drives which line is lit; its threshold matches your earlier intent.
  const bottomInView = useInView(bottomRef, { margin: "0px 0px -45% 0px" });

  const [active, setActive] = useState<Active>("bottom");
  const lastScrollY = useRef<number>(0);

  // Initialize scroll position
  useEffect(() => {
    lastScrollY.current = window.scrollY || 0;
  }, []);

  // Initial paint: decide active and set opacities without animation (prevents flashes).
  useLayoutEffect(() => {
    const initialActive: Active = bottomInView ? "bottom" : "top";
    setActive(initialActive);

    topControls.set({ opacity: topInView ? (initialActive === "top" ? 1 : 0.2) : 0.2 });
    bottomControls.set({ opacity: initialActive === "bottom" ? 1 : 0.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update which line is active based on bottom's threshold + scroll direction.
  useEffect(() => {
    const currentY = window.scrollY || 0;
    const scrollingDown = currentY > lastScrollY.current;
    lastScrollY.current = currentY;

    if (bottomInView) {
      setActive("bottom"); // entering view -> bottom lit
    } else if (!scrollingDown) {
      setActive("top"); // only hand back to top when crossing upward
    }
  }, [bottomInView]);

  // Animate when active changes or when top enters/leaves view.
  useEffect(() => {
    topControls.start({
      opacity: topInView ? (active === "top" ? 1 : 0.2) : 0.2,
      transition: { duration: 0.6, ease: "easeOut" },
    });
    bottomControls.start({
      opacity: active === "bottom" ? 1 : 0.2,
      transition: { duration: 0.6, ease: "easeOut" },
    });
  }, [active, topInView, topControls, bottomControls]);

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[50vh] text-center">
      <motion.h2
        ref={topRef}
        animate={topControls}
        className="text-4xl md:text-6xl font-bold text-white"
      >
        Everyone wants to rank up.
      </motion.h2>

      <motion.h2
        ref={bottomRef}
        animate={bottomControls}
        className="mt-4 text-4xl md:text-6xl font-bold text-white"
      >
        Few actually know how.
      </motion.h2>
    </section>
  );
}

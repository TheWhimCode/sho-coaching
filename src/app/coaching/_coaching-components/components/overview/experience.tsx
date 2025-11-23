"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import ExperienceYears2 from "./ExperienceYears2";
import ReviewsCard from "./400-reviews";
import EkkoSilhouette from "./EkkoSilhouette";

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

export default function Experience() {
  // ✅ single trigger for the whole section
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 1 });

  return (
    <section
      aria-labelledby="no-wasted-games-title"
      className="relative w-full overflow-visible"
    >
      <GridPattern />

      {/* ✅ all animation timing controlled from this ref */}
      <div
        ref={sectionRef}
        className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-12 md:gap-8"
      >
        {/* LEFT COLUMN */}
        <div className="col-span-1 md:col-span-8 flex flex-col gap-8">

          {/* Text block (delay 0.8) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col justify-center mb-4"
          >
            <h2
              id="no-wasted-games-title"
              className="relative z-50 font-extrabold leading-tight tracking-tight text-white
                         text-3xl md:text-3xl lg:text-4xl"
              style={{ textShadow: HEAVY_TEXT_SHADOW }}
            >
              No more wasted games.
            </h2>
            <p
              className="relative z-50 mt-4 max-w-[68ch] text-base sm:text-lg md:text-xl leading-relaxed text-fg-muted/90"
              style={{ textShadow: HEAVY_TEXT_SHADOW }}
            >
              Many players drown in tips, guides, and random advice from Twitch or Youtube.
              I cut through the noise and set focus on the skills that actually
              make you climb.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid items-stretch grid-cols-1 gap-6 md:grid-cols-[1fr_1px_1fr]">

            {/* ExperienceYears2 (delay 1.1) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="md:col-[1]"
            >
              <ExperienceYears2 className="py-8" />
            </motion.div>

            {/* Mobile divider */}
            <div
              aria-hidden
              className="md:hidden h-px w-full"
              style={{ background: "var(--color-divider)", opacity: 0.6 }}
            />

            {/* ReviewsCard (delay 1.4) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="md:col-[3]"
            >
              <ReviewsCard
                rating={4.9}
                scaleMax={5}
                subtitle="Based on 500+ reviews"
                className="py-8"
              />
            </motion.div>

          </div>
        </div>

        {/* RIGHT COLUMN — Ekko (delay 0.0) */}
        <motion.div
          className="col-span-1 md:col-span-4"
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.0, ease: "easeOut" }}
        >
          <div className="relative h-full min-h-[22rem] w-full overflow-visible">
            <div className="absolute inset-3 overflow-visible">
              <EkkoSilhouette />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

/** Decorative background dots */
function GridPattern() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
    >
      <defs>
        <pattern id="dotPattern" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotPattern)" />
    </svg>
  );
}

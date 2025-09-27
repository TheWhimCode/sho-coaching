"use client";

import React from "react";
import { motion } from "framer-motion";
import ExperienceYears from "./ExperienceYears";
import ReviewsCard from "./400-reviews";

/** Riot DDragon */
const FALLBACK_PATCH = "15.19.1";

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

export default function Experience() {
  const [patch, setPatch] = React.useState<string>(FALLBACK_PATCH);

  React.useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/realms/euw.json")
      .then((r) => r.json())
      .then((data) => {
        const v = data?.n?.champion;
        if (typeof v === "string" && v.length > 0) setPatch(v);
      })
      .catch(() => {});
  }, []);

  return (
    <section
      aria-labelledby="no-wasted-games-title"
      className="relative w-full overflow-hidden"
    >
      <GridPattern />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-12 md:gap-8">
        {/* LEFT COLUMN: text + stats */}
        <div className="col-span-1 md:col-span-8 flex flex-col gap-10">
          {/* Row 1: statement */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-center pb-16"
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

          {/* Row 2: stat cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* EXPERIENCE */}
            <ExperienceYears patch={patch} />

            {/* REVIEWS (now extracted) */}
            <ReviewsCard rating={4.9} scaleMax={5} subtitle="Based on 500+ reviews" />
          </div>
        </div>

        {/* RIGHT COLUMN: Ekko placeholder */}
        <div className="col-span-1 md:col-span-4">
          <div className="ekko-placeholder h-full min-h-[22rem] w-full rounded-2xl border border-dashed border-[var(--color-divider)]/50 flex items-center justify-center text-fg-muted/50">
            Ekko silhouette here
          </div>
        </div>
      </div>
    </section>
  );
}

/** Decorative, extremely light grid pattern */
function GridPattern() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
    >
      <defs>
        <pattern id="smallGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#smallGrid)" />
    </svg>
  );
}

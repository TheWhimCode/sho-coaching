"use client";

import React from "react";
import { motion } from "framer-motion";

/** Riot DDragon */
const FALLBACK_PATCH = "15.19.1";
const champSquareUrl = (k: string, v: string = FALLBACK_PATCH) =>
  `https://ddragon.leagueoflegends.com/cdn/${v}/img/champion/${k}.png`;

/** Rows */
const ROW1 = ["Ahri","Akali","Annie","Ashe","Braum","Caitlyn","Darius","Diana","DrMundo","Ekko"];
const ROW2 = ["Ezreal","Fiora","Garen","Irelia","Janna","Jax","Jinx","Kaisa","Katarina","LeeSin"];
const ROW3 = ["Leona","Lux","Malphite","MasterYi","MissFortune","Nami","Nasus","Orianna","Riven","Yasuo"];
const ROW4 = ["Renekton","Sejuani","Sylas","Thresh","Vayne","Zed","Zyra","Sona","Veigar","Volibear"];

/** Sizing */
const ICON_SIZE = 36;
const GAP = 8;
const ROWS = 4;

/** Marquee speed (pixels per second). Lower = slower. */
const SPEED_PPS = 5.0;

type ExperienceYearsProps = {
  patch?: string;
  title?: string;
  subtitle?: string;
  className?: string;
};

export default function ExperienceYears({
  patch = FALLBACK_PATCH,
  title = "5+ Years",
  subtitle = "SoloQ coaching experience",
  className = "",
}: ExperienceYearsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl border border-[var(--color-divider)]/60 bg-black/40 ${className} flex items-center`}
    >
      {/* Moving rows (z-0) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-0 right-0 mx-auto flex flex-col items-center"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            gap: GAP,
            height: ROWS * ICON_SIZE + (ROWS - 1) * GAP,
          }}
        >
          <Row id="row-top"    dir="left"  champs={ROW1} patch={patch} />
          <Row id="row-1"      dir="right" champs={ROW2} patch={patch} />
          <Row id="row-2"      dir="left"  champs={ROW3} patch={patch} />
          <Row id="row-bottom" dir="right" champs={ROW4} patch={patch} />
        </div>
      </div>

      {/* Dim + blur the busy background slightly */}
      <div className="pointer-events-none absolute inset-0 z-[5] bg-black/60 backdrop-blur-[2px]" />

      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[6]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Text (z-10) */}
      <div className="relative z-10 px-8 md:px-10">
        <div className="text-3xl md:text-4xl font-extrabold text-white">
          {title}
        </div>
        <div className="mt-1 text-base md:text-lg text-fg-muted/85">
          {subtitle}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------- Row marquee ------------------------------ */

function Row({
  id,
  dir,
  champs,
  patch,
}: {
  id: string;
  dir: "left" | "right";
  champs: string[];
  patch: string;
}) {
  const SHIFT = champs.length * (ICON_SIZE + GAP);
  const duration = SHIFT / SPEED_PPS;

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: "100%",
        height: ICON_SIZE,
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <motion.div
        className="flex items-center"
        style={{ gap: GAP }}
        animate={{ x: dir === "left" ? [0, -SHIFT] : [-SHIFT, 0] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {[...champs, ...champs].map((champ, i) => (
          <div
            key={`${id}-${champ}-${i}`}
            className="flex-shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--color-divider)]/40 bg-black/80"
            style={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              filter: "saturate(0.8) brightness(0.9)",
            }}
          >
            <img
              src={champSquareUrl(champ, patch)}
              alt=""
              loading="lazy"
              decoding="async"
              className="block h-full w-full object-cover opacity-90"
              draggable={false}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

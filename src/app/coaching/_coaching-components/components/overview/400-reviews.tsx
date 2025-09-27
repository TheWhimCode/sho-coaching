"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

type ReviewsCardProps = {
  rating?: number;
  scaleMax?: number;
  subtitle?: string;
  className?: string;
  minHeight?: number;
};

export default function ReviewsCard({
  rating = 4.9,
  scaleMax = 5,
  subtitle = "Based on 500+ reviews",
  className = "",
  minHeight = 168, // keep in sync with ExperienceYears
}: ReviewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl border border-[var(--color-divider)]/60 backdrop-blur p-8 md:p-10 ${className}`}
      style={{
        minHeight,
        background: "var(--color-panel)", // ✅ use the same bg as overview tiles
      }}
    >
      {/* subtle texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl z-0"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      />

      {/* content */}
      <div className="relative z-10 flex h-full flex-col justify-center">
        <div className="flex items-center gap-2 font-extrabold tracking-tight text-white text-3xl md:text-4xl">
          {rating.toFixed(1)} / {scaleMax}
          <span className="relative inline-flex translate-y-[2px] translate-x-[2px]">
            {/* halo behind star */}
            <span
              aria-hidden
              className="absolute -inset-1 rounded-full blur-md opacity-40
                         bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.35),_transparent_70%)]"
            />
            <Star
              className="relative text-[#fc8803]"
              style={{
                height: "1em",
                width: "1em",
                filter: "drop-shadow(0 6px 12px rgba(245,158,11,0.35))",
              }}
              strokeWidth={2}
              fill="currentColor"
            />
          </span>
        </div>
        <div className="mt-1 text-sm md:text-base text-fg-muted/85">
          {subtitle}
        </div>
      </div>
    </motion.div>
  );
}

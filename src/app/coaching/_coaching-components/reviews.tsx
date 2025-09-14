"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

type Review = { name: string; text: string; rating?: number };
type Props = { reviews?: Array<Review | string>; speedSec?: number };

const DEFAULT_REVIEWS: Review[] = [
  { name: "Lena",  text: "The session was eye-opening. Sho identified habits I didn’t notice and gave me 3 simple priorities to focus on. I felt improvement the next day and finally understand where my time is best spent." },
  { name: "Marco", text: "Super clear, no fluff. He spotted macro mistakes fast and explained the why behind every change. Notes after the call kept me accountable and I climbed steadily the following week." },
  { name: "Ari",   text: "Exactly what I needed: targeted fixes and a calm, professional vibe. Hearing my thought process challenged in real time helped me break autopilot and play with intention again." },
  { name: "Jonas", text: "I’ve tried coaching before—this was different. Structured, practical, and honest. The roadmap gave me certainty and the follow-up made sure I actually applied the changes." },
];

function normalize(reviews?: Array<Review | string>): Review[] {
  if (!reviews || reviews.length === 0) return DEFAULT_REVIEWS;
  return reviews.map((r) => (typeof r === "string" ? { name: "Player", text: r } : r));
}

export default function ReviewsMarquee({ reviews, speedSec = 70 }: Props) {
  const items = normalize(reviews);

  const Card = ({ r }: { r: Review }) => (
    <article className="w-[240px] sm:w-[280px] rounded-xl bg-white/[.03] border border-white/5 p-4">
      <div className="flex items-center gap-2 pb-1.5 mb-2.5 border-b border-white/5">
        <span className="font-semibold text-white/85 truncate text-sm">{r.name}</span>
        <span className="sr-only">Rating: {r.rating ?? 5} out of 5</span>
        <div className="flex items-center gap-0.5 text-[#fc8803] opacity-90" aria-hidden>
          {Array.from({ length: r.rating ?? 5 }).map((_, j) => (
            <Star key={j} className="h-3.5 w-3.5" fill="currentColor" />
          ))}
        </div>
      </div>
      <p className="text-white/70 text-[13px] leading-5">{r.text}</p>
    </article>
  );

  return (
    <div className="overflow-hidden relative w-full py-10">
      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0B0F1A] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0B0F1A] to-transparent z-10 pointer-events-none" />

      {/* Invisible sizer to preserve height */}
      <div className="invisible">
        <div className="flex gap-5">
          {items.map((r, i) => (
            <Card key={`Sizer-${r.name}-${i}`} r={r} />
          ))}
        </div>
      </div>

      {/* Two synchronized strips; seam matches gap via pl-5 on B only */}
      <div className="absolute inset-0 flex items-center">
        {/* Strip A */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 flex gap-5 will-change-transform"
          initial={{ x: "0%" }}
          animate={{ x: ["0%", "-100%"] }}
          transition={{ duration: speedSec, ease: "linear", repeat: Infinity }}
        >
          {items.map((r, i) => (
            <Card key={`A-${r.name}-${i}`} r={r} />
          ))}
        </motion.div>

        {/* Strip B */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 flex gap-5 pl-5 will-change-transform"
          initial={{ x: "100%" }}
          animate={{ x: ["100%", "0%"] }}
          transition={{ duration: speedSec, ease: "linear", repeat: Infinity }}
          aria-hidden
        >
          {items.map((r, i) => (
            <Card key={`B-${r.name}-${i}`} r={r} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

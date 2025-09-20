// components/overview/Overview2.tsx
"use client";

import React from "react";
import {
  Bolt,
  ShieldCheck,
  Clock3,
  Target,
  BrainCircuit,
  ThumbsUp,
} from "lucide-react";

type Item = {
  id: string;
  title: string;
  body: string;
  badge?: string;
  // optional custom icon component
  icon?: React.ReactNode;
};

const DEFAULT_ITEMS: Item[] = [
  {
    id: "benefit-1",
    title: "Visual learning",
    body: "See clean execution with short clips, not long lectures.",
    icon: <BrainCircuit className="h-5 w-5" />,
  },
  {
    id: "benefit-2",
    title: "Clear next steps",
    body: "Leave with 2–3 exact habits to practice in your next games.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    id: "benefit-3",
    title: "Fast turnarounds",
    body: "Most requests are delivered in days—no waiting weeks.",
    icon: <Clock3 className="h-5 w-5" />,
    badge: "Available now",
  },
  {
    id: "benefit-4",
    title: "Tailored to you",
    body: "Advice is specific to your role, champ pool, and rank.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    id: "benefit-5",
    title: "Momentum via follow-ups",
    body: "15-minute progress reviews to keep improving.",
    icon: <Bolt className="h-5 w-5" />,
  },
  {
    id: "benefit-6",
    title: "Friendly & honest",
    body: "Direct feedback, supportive tone, zero fluff.",
    icon: <ThumbsUp className="h-5 w-5" />,
  },
];

export default function Overview2({
  eyebrow = "Benefits",
  heading = "Web coaching that helps you improve faster",
  items = DEFAULT_ITEMS,
  className = "",
}: {
  eyebrow?: string;
  heading?: string;
  items?: Item[];
  className?: string;
}) {
  return (
    <section className={`w-full ${className}`}>
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] tracking-[0.22em] text-white/55 uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl md:text-[44px] leading-tight font-bold">
            {heading}
          </h2>
        </div>

        {/* Grid container (matches your brand panels) */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Gradient border with perfect corners */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              padding: 1,
              borderRadius: "1rem",
              background:
                "linear-gradient(180deg, rgba(160,200,255,.22), rgba(86,140,220,.18))",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              mask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              maskComposite: "exclude",
            }}
            aria-hidden
          />

          {/* Panel surface */}
          <div
            className="relative rounded-2xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(22,36,70,.65), rgba(16,30,62,.65))",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.05), 0 10px 28px rgba(0,0,0,.35)",
            }}
          >
            {/* Texture overlay (brand-consistent) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                backgroundImage: "url('/images/coaching/texture3.jpg')",
                backgroundRepeat: "repeat",
                backgroundSize: "auto",
                mixBlendMode: "overlay",
                opacity: 0.16,
                filter: "contrast(1.08) brightness(1.03)",
              }}
            />

            {/* Inner grid with separators */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {items.slice(0, 6).map((item, i) => (
                <Cell key={item.id} item={item} isTopRow={i < 3} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Single cell */
function Cell({ item, isTopRow }: { item: Item; isTopRow: boolean }) {
  return (
    <div className="relative p-5 sm:p-6 md:p-7">
      {/* Corner dots (subtle, optional) */}
      <div className="absolute left-3 top-3 h-1 w-1 rounded-full bg-white/15" />
      <div className="absolute right-3 top-3 h-1 w-1 rounded-full bg-white/15" />
      <div className="absolute left-3 bottom-3 h-1 w-1 rounded-full bg-white/15" />
      <div className="absolute right-3 bottom-3 h-1 w-1 rounded-full bg-white/15" />

      {/* Badge (top-right) */}
      {item.badge ? (
        <span className="absolute right-3 -top-3 z-10 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide bg-amber-500 text-black shadow">
          {item.badge}
        </span>
      ) : null}

      {/* Icon pill */}
      <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        {item.icon ?? <Bolt className="h-5 w-5 opacity-90" />}
      </div>

      {/* Titles/Copy */}
      <h3 className="text-lg md:text-xl font-semibold">{item.title}</h3>
      <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-white/70">
        {item.body}
      </p>

      {/* Top-row faint divider accent (like the reference) */}
      {isTopRow ? (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-3 w-px bg-white/15" />
      ) : null}
    </div>
  );
}

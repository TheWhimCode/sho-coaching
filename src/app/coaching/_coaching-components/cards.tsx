// coaching/_coaching-components/PresetCards.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Scroll, Lightning, PuzzlePiece, Signature } from "@phosphor-icons/react";
import type { Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";

type PresetSlug = "vod" | "signature" | "instant";

type Item = {
  slug: PresetSlug;
  title: string;
  subtitle: string;
  duration: string;
  badge?: string;
  image: string;
};

const DEFAULT_ITEMS: Item[] = [
  {
    slug: "vod",
    title: "VOD Review",
    subtitle: "In-depth gameplay analysis",
    duration: "60 min",
    badge: "Most informative",
    image: "/videos/vod-review-poster-start.png",
  },
  {
    slug: "signature",
    title: "Signature Session",
    subtitle: "Deep dive + tailored roadmap",
    duration: "45 min + Follow-up",
    badge: "Best overall",
    image: "/videos/signature-poster.jpg",
  },
  {
    slug: "instant",
    title: "Instant Insight",
    subtitle: "Key answers on a budget",
    duration: "30 min",
    badge: "Fastest feedback",
    image: "/videos/quick-20-poster.jpg",
  },
];

function SessionIcon({ preset }: { preset: Preset }) {
  const { ring, glow } = colorsByPreset[preset] ?? colorsByPreset.custom;
  const size = 26; // match SessionBlock
  const glowStyle = { filter: `drop-shadow(0 0 8px ${glow})` } as React.CSSProperties;

  if (preset === "vod") return <Scroll size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
  if (preset === "instant") return <Lightning size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
  if (preset === "signature") return <Signature size={size} weight="bold" color={ring} style={glowStyle} aria-hidden />;
  return <PuzzlePiece size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
}

// Allow className so we can control which corners are rounded
function GlowRing({ preset, className = "" }: { preset: Preset; className?: string }) {
  const c = colorsByPreset[preset] ?? colorsByPreset.custom;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 24px -10px ${c.glow}`,
      }}
    />
  );
}

function Card({ item }: { item: Item }) {
  return (
    <div className="relative group">
      <Link href={`/coaching/${item.slug}`} className="block focus:outline-none h-full">
        <article
          className="flex flex-col h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[.03] backdrop-blur-md
                     transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
        >
          {/* Media — round ONLY the top corners */}
          <div className="relative w-full h-52 md:h-64 overflow-hidden rounded-t-3xl">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {item.badge && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/85 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> {item.badge}
              </span>
            )}
          </div>

          {/* Content — round ONLY the bottom corners; straight edge on top (opaque) */}
          <div className="relative z-10 flex flex-col flex-1 p-7 rounded-b-3xl bg-[#0B0F1A]">
            <GlowRing preset={item.slug as Preset} className="rounded-b-3xl" />

            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-2xl font-semibold tracking-tight text-white">{item.title}</h3>
              <SessionIcon preset={item.slug as Preset} />
            </div>

            <p className="text-white/70 mb-16">{item.subtitle}</p>

            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>{item.duration}</span>
              <span className="ml-auto text-xs uppercase tracking-wide text-white/50 group-hover:text-white/70 transition-colors">
                View details →
              </span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

export default function PresetCards({
  items = DEFAULT_ITEMS,
  className = "",
  containerClassName = "max-w-6xl px-6",
}: {
  items?: Item[];
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section className={`w-full ${className}`}>
      <div className={`mx-auto w-full ${containerClassName}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <Card key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

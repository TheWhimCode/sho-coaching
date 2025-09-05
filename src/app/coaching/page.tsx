"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";

// ---- Color Presets ---- (subtle)
const PRESET_COLORS = {
  instant:   { ring: "#f6e9b3", glow: "rgba(248,211,75,.18)" },
  signature: { ring: "#f6b1b1", glow: "rgba(248,113,113,.18)" },
  vod:       { ring: "#a6c8ff", glow: "rgba(105,168,255,.18)" },
  custom:    { ring: "#d9d9d9", glow: "rgba(255,255,255,0.1)" },
} as const;

type PresetKey = keyof typeof PRESET_COLORS;

// ---- Product Cards Config ----
const PRESETS: Array<{
  slug: "vod" | "signature" | "instant";
  title: string;
  subtitle: string;
  duration: string;
  badge?: string;
}> = [
  {
    slug: "vod",
    title: "VOD Review",
    subtitle: "In-depth gameplay analysis",
    duration: "60 min",
    badge: "Most informative",
  },
  {
    slug: "signature",
    title: "Signature Session",
    subtitle: "Deep dive + tailored roadmap",
    duration: "90 min",
    badge: "Best overall",
  },
  {
    slug: "instant",
    title: "Instant Insight",
    subtitle: "Rapid-fire fixes & priorities",
    duration: "20 min",
    badge: "Fastest feedback",
  },
];

// ---- Card media ----
const CARD_MEDIA: Record<Exclude<PresetKey, "custom">, string> = {
  vod: "/videos/vod-review-poster-start.png",
  signature: "/videos/signature-poster.jpg",
  instant: "/videos/quick-20-poster.jpg",
};

const cx = (...cls: Array<string | false | null | undefined>) =>
  cls.filter(Boolean).join(" ");

function GlowRing({ preset }: { preset: PresetKey }) {
  const c = PRESET_COLORS[preset];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[24px]"
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 24px -10px ${c.glow}`,
      }}
    />
  );
}

function Card({ p, index }: { p: (typeof PRESETS)[number]; index: number }) {
  const img = CARD_MEDIA[p.slug as keyof typeof CARD_MEDIA];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative group"
    >
      <Link href={`/coaching/${p.slug}`} className="block focus:outline-none h-full">
        <article
          className={cx(
            "flex flex-col h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[.03] backdrop-blur-md",
            "transition-all duration-300 cursor-pointer",
            "hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
          )}
        >
          {/* Tall image top */}
          <div className="relative w-full aspect-[3/4] overflow-hidden">
            <Image
              src={img}
              alt={p.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {p.badge && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/85 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> {p.badge}
              </span>
            )}
          </div>

          {/* Info bottom */}
          <div className="relative flex flex-col flex-1 p-7">
            <GlowRing preset={p.slug as PresetKey} />
            <h3 className="text-2xl font-semibold tracking-tight text-white mb-1">
              {p.title}
            </h3>
            <p className="text-white/70 flex-1">{p.subtitle}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
              <Clock className="h-4 w-4" />
              <span>{p.duration}</span>
              <span className="ml-auto text-xs uppercase tracking-wide text-white/50 group-hover:text-white/70 transition-colors">
                View details →
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

export default function ProductsLanding() {
  return (
    <main className="relative min-h-screen bg-[#0B0F1A] text-white">
      {/* Brand backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 10% 10%, rgba(80,110,255,0.15), transparent 60%)," +
              "radial-gradient(800px 400px at 90% 20%, rgba(249,205,93,0.08), transparent 60%)," +
              "radial-gradient(900px 500px at 50% 100%, rgba(180,120,255,0.08), transparent 60%)",
            filter: "saturate(105%) blur(0.3px)",
          }}
        />
        <div className="absolute inset-0 bg-[url('/stars-noise.png')] opacity-[0.1] mix-blend-screen" />
      </div>

      {/* HERO */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-28 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent"
        >
          Elevate Your Play
        </motion.h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-white/70">
          High-signal coaching in three premium formats.
        </p>
      </section>

      {/* PRODUCT CARDS */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {PRESETS.map((p, i) => (
            <Card key={p.slug} p={p} index={i} />
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* SECTION: Tracks / Preset Emphasis */}
      <section id="tracks" className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <header className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">Tracks by preset</h2>
          <p className="mt-2 text-white/70">The same page, three emphases.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {PRESETS.map((p) => (
            <div
              key={p.slug}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div
                className="absolute -inset-32 opacity-40"
                style={{
                  background: `radial-gradient(500px 220px at 10% 0%, ${
                    PRESET_COLORS[p.slug as PresetKey].glow
                  }, transparent 60%)`,
                }}
              />
              <div className="relative z-10">
                <div className="text-sm text-white/60">{p.duration}</div>
                <h3 className="mt-1 text-2xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-white/70">{p.subtitle}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/80">
                  <li>Focus A • Placeholder</li>
                  <li>Focus B • Placeholder</li>
                  <li>Focus C • Placeholder</li>
                </ul>
                <Link
                  href={`/coaching/${p.slug}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-black"
                  style={{ backgroundColor: PRESET_COLORS[p.slug as PresetKey].ring }}
                >
                  Choose preset
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA with presets */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <header className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">Pick your preset</h2>
          <p className="mt-2 text-white/70">
            All roads lead to the same checkout; the preset tunes the flow.
          </p>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((p, i) => (
            <Card key={`footer-${p.slug}`} p={p} index={i} />
          ))}
        </div>
      </section>
    </main>
  );
}

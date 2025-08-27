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
  href: string;
}> = [
  {
    slug: "vod",
    title: "VOD Review",
    subtitle: "In-depth gameplay analysis",
    duration: "60 min",
    badge: "Most informative",
    href: "/product?preset=vod",
  },
  {
    slug: "signature",
    title: "Signature Session",
    subtitle: "Deep dive + tailored roadmap",
    duration: "90 min",
    badge: "Best overall",
    href: "/product?preset=signature",
  },
  {
    slug: "instant",
    title: "Instant Insight",
    subtitle: "Rapid-fire fixes & priorities",
    duration: "20 min",
    badge: "Fastest feedback",
    href: "/product?preset=instant",
  },
];

// ---- Card media ----
const CARD_MEDIA: Record<Exclude<PresetKey, "custom">, string> = {
  vod: "/videos/vod-review-poster-start.png",
  signature: "/videos/signature-poster.jpg",
  instant: "/videos/quick-20-poster.jpg",
};

const cx = (...cls: Array<string | false | null | undefined>) => cls.filter(Boolean).join(" ");

function GlowRing({ preset }: { preset: PresetKey }) {
  const c = PRESET_COLORS[preset];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[24px]"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 24px -10px ${c.glow}` }}
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
      <Link href={p.href} className="block focus:outline-none h-full">
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
            <h3 className="text-2xl font-semibold tracking-tight text-white mb-1">{p.title}</h3>
            <p className="text-white/70 flex-1">{p.subtitle}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
              <Clock className="h-4 w-4" />
              <span>{p.duration}</span>
              <span className="ml-auto text-xs uppercase tracking-wide text-white/50 group-hover:text-white/70 transition-colors">View details →</span>
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
          High‑signal coaching in three premium formats.
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

      {/* SECTION: How it works (3-step) */}
      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <header className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">How it works</h2>
          <p className="mt-2 text-white/70">Clear, repeatable system that adapts to your preset.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {["Record / Submit","Live Breakdown","Action Plan"].map((label, i) => (
            <div key={label} className="relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
                {i+1}
              </div>
              <h3 className="text-lg font-semibold">{label}</h3>
              <p className="mt-2 text-sm text-white/70">Placeholder copy — swap with specifics for your flow.</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Feature Split (media left, bullets right) */}
      <section id="deep-dive" className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image src="/videos/signature-poster.jpg" alt="Session preview" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold">Deeper than a highlight reel</h2>
            <p className="mt-3 text-white/70">Frame-by-frame analysis, decision trees, and principle-first coaching.
            </p>
            <ul className="mt-6 grid gap-3">
              {[
                "Macro pathing & tempo reads",
                "Fight selection & spike timing",
                "Draft heuristics & role clarity",
                "Habits, reviews, and drills",
              ].map((x) => (
                <li key={x} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* BAND: Key Stats / Outcomes */}
      <section className="relative py-14">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500/10 via-amber-400/10 to-violet-500/10" />
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:grid-cols-3">
            {[{k:"avg MMR gain",v:"+140"},{k:"first-month VODs",v:"12+"},{k:"retention",v:"92%"}].map(({k,v})=> (
              <div key={k} className="text-center">
                <div className="text-4xl font-semibold">{v}</div>
                <div className="mt-1 text-sm text-white/70">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: Tracks / Preset Emphasis (cards look different) */}
      <section id="tracks" className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <header className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">Tracks by preset</h2>
          <p className="mt-2 text-white/70">The same page, three emphases.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {PRESETS.map((p)=> (
            <div key={p.slug} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="absolute -inset-32 opacity-40" style={{background:`radial-gradient(500px 220px at 10% 0%, ${PRESET_COLORS[p.slug as PresetKey].glow}, transparent 60%)`}}/>
              <div className="relative z-10">
                <div className="text-sm text-white/60">{p.duration}</div>
                <h3 className="mt-1 text-2xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-white/70">{p.subtitle}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/80">
                  <li>Focus A • Placeholder</li>
                  <li>Focus B • Placeholder</li>
                  <li>Focus C • Placeholder</li>
                </ul>
                <Link href={p.href} className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-black" style={{backgroundColor: PRESET_COLORS[p.slug as PresetKey].ring}}>Choose preset</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Timeline */}
      <section id="timeline" className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <header className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">Improvement arc</h2>
          <p className="mt-2 text-white/70">From audit to upgrades.</p>
        </header>
        <ol className="relative border-s border-white/10 pl-6 max-w-3xl mx-auto">
          {[
            {h:"Week 0 — Audit", d:"Profiling, goals, and baselines."},
            {h:"Week 1 — Fixes", d:"Quick wins and habit anchors."},
            {h:"Week 2 — Depth", d:"Concept stacks and scenario libraries."},
            {h:"Week 3+ — Iterate", d:"Feedback loop and targeted drills."},
          ].map(({h,d},i)=> (
            <li key={h} className="mb-8">
              <div className="absolute -left-2 mt-1 h-3.5 w-3.5 rounded-full bg-white/70" />
              <h3 className="text-lg font-semibold">{h}</h3>
              <p className="mt-1 text-sm text-white/70">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* SECTION: Comparison (table-ish) */}
      <section id="compare" className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <header className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">Which one should I pick?</h2>
          <p className="mt-2 text-white/70">Quick comparison to decide fast.</p>
        </header>
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <div className="grid grid-cols-4 bg-white/5 text-sm font-medium">
            <div className="p-4">Feature</div>
            <div className="p-4 text-center">Instant</div>
            <div className="p-4 text-center">VOD</div>
            <div className="p-4 text-center">Signature</div>
          </div>
          {[
            "Live session",
            "Full VOD breakdown",
            "Roadmap & drills",
            "Follow-up notes",
          ].map((row, i) => (
            <div key={row} className={cx("grid grid-cols-4 text-sm", i%2?"bg-white/[.04]":"bg-white/[.02]") }>
              <div className="p-4">{row}</div>
              <div className="p-4 text-center">—</div>
              <div className="p-4 text-center">—</div>
              <div className="p-4 text-center">—</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Testimonials */}
      <section id="testimonials" className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <header className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">What players say</h2>
          <p className="mt-2 text-white/70">Drop quotes, clips, or screenshots here.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({length:6}).map((_,i)=> (
            <figure key={i} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <blockquote className="text-white/85 text-sm">“Short praise snippet goes here. Keep it tight and scannable.”</blockquote>
              <figcaption className="mt-3 text-xs text-white/60">IGN • Rank • Server</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* SECTION: FAQ (native details/summary) */}
      <section id="faq" className="mx-auto w-full max-w-6xl px-6 pb-24">
        <header className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">FAQ</h2>
        </header>
        <div className="mx-auto max-w-3xl divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/5">
          {[
            {q:"How do I send my VOD?", a:"Upload to YouTube (unlisted) or Google Drive. Link it when booking."},
            {q:"Can we focus on champion X?", a:"Yes—bring 1–2 recent games. We’ll anchor concepts to your pool."},
            {q:"Refunds?", a:"Reschedule up to 24h before. Refunds case-by-case."},
          ].map(({q,a}) => (
            <details key={q} className="group">
              <summary className="cursor-pointer list-none p-5 text-sm font-medium hover:bg-white/[.04]">
                {q}
              </summary>
              <div className="px-5 pb-5 text-sm text-white/70">{a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER CTA with presets */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <header className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">Pick your preset</h2>
          <p className="mt-2 text-white/70">All roads lead to the same checkout; the preset tunes the flow.</p>
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

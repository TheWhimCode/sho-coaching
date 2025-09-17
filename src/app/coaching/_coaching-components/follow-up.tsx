"use client";

import React from "react";

export default function FollowUp({
  className = "",
  containerClassName = "max-w-6xl",
}: { className?: string; containerClassName?: string }) {
  return (
    <section className={`w-full ${className}`}>
      <div className={`mx-auto w-full ${containerClassName}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-14 md:gap-20 items-center">
          {/* Left: video placeholder */}
          <div className="md:col-span-6 order-last md:order-first">
            <div className="relative aspect-video rounded-2xl border border-white/10 bg-white/[.03] overflow-hidden">
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
                }}
              />
              <div className="absolute inset-0 grid place-items-center text-white/40 text-sm">
                Video placeholder: Follow-up animation
              </div>
            </div>
          </div>

          {/* Right: text content */}
          <div className="md:col-span-6 order-first md:order-last">
            <p className="text-xs tracking-widest text-white/50 uppercase">
              Add-on service
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold">
              Follow-ups (15-min progress review)
            </h2>
            <p className="mt-3 text-white/70 text-base md:text-lg max-w-xl">
              A concise, 15-minute progress review delivered days or months
              after your coaching — so improvement keeps compounding.
            </p>

            {/* Three pillars */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-center">
                <p className="text-sm font-medium text-white/90">You send</p>
                <p className="mt-1 text-xs text-white/60">
                  Clips or match links + notes
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-center">
                <p className="text-sm font-medium text-white/90">I review</p>
                <p className="mt-1 text-xs text-white/60">
                  Habits, decisions, sticking points
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-center">
                <p className="text-sm font-medium text-white/90">You get</p>
                <p className="mt-1 text-xs text-white/60">
                  Priorities for next 10–20 games
                </p>
              </div>
            </div>

            {/* Specs row */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50">
              <span>⏱ 48–72h turnaround</span>
              <span>🎬 ~15 min video</span>
              <span>📁 MP4 + timestamps</span>
              <span>🛒 Add-on only</span>
            </div>

            {/* CTA row */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="https://patreon.com/yourpatreon"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-black shadow-[0_0_30px_-8px_rgba(251,191,36,.6)]"
              >
                Watch an example
              </a>
              <a
                href="#book"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.03] px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[.06]"
              >
                Add to session
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

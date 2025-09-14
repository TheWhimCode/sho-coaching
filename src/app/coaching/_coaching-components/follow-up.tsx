// coaching/_coaching-components/follow-up.tsx
"use client";

import React from "react";

export default function FollowUp({
  className = "",
  containerClassName = "max-w-6xl px-6",
}: { className?: string; containerClassName?: string }) {
  return (
    <section className={`w-full ${className}`}>
      <div className={`mx-auto w-full ${containerClassName}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* Left: graphic (on md+ we put it first to alternate) */}
          <div className="md:col-span-6 order-last md:order-first">
            <div className="relative rounded-2xl border border-white/10 bg-white/[.03] p-6 md:p-8">
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                   style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }} />
              {/* “Follow-ups pack” graphic */}
              <div className="grid grid-cols-3 gap-3">
                {["#f6e9b3", "#a6c8ff", "#f6b1b1"].map((c, i) => (
                  <div key={i} className="aspect-[4/5] rounded-xl border border-white/10 bg-white/[.05] relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-10" style={{ backgroundColor: c, opacity: .2 }} />
                    <div className="absolute inset-x-0 top-12 space-y-2 px-3">
                      <div className="h-2 rounded bg-white/15" />
                      <div className="h-2 w-3/4 rounded bg-white/10" />
                      <div className="h-2 w-2/3 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-xs text-white/60">Examples: notes, checkpoints, quick clips.</div>
              <div className="absolute -left-6 -top-6 h-28 w-28 rounded-3xl -rotate-12 opacity-20"
                   style={{ background: "radial-gradient(closest-side, #a6c8ff, transparent)" }} />
            </div>
          </div>

          {/* Right: text */}
          <div className="md:col-span-6 order-first md:order-last">
            <h2 className="text-2xl md:text-3xl font-semibold">Follow-ups</h2>
            <p className="mt-3 text-white/70">
What exactly is a follow-up? Is it worth it?            </p>
            <ul className="mt-6 space-y-3 text-sm md:text-base">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                <div>
                  <span className="font-medium">What you get.</span>{" "}
                  Bullet notes, priority recap, and 1–2 focus clips or timestamps when useful.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                <div>
                  <span className="font-medium">Timing.</span>{" "}
                  Usually within 48–72 hours after the session once you’ve played a few games.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                <div>
                  <span className="font-medium">How to use it.</span>{" "}
                  Treat it as a checklist for your next 10–20 games; review it weekly.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                <div>
                  <span className="font-medium">Included?</span>{" "}
                  Included with Signature; add-on for Instant/VOD.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

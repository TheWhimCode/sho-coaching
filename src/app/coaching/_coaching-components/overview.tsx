// coaching/_coaching-components/overview.tsx
"use client";

import React from "react";

export default function Overview({
  className = "",
  containerClassName = "max-w-6xl px-6",
}: { className?: string; containerClassName?: string }) {
  return (
    <section className={`w-full ${className}`}>
      <div className={`mx-auto w-full ${containerClassName}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* Left: text */}
          <div className="md:col-span-6">
            <h2 className="text-2xl md:text-3xl font-semibold">What to expect</h2>
            <p className="mt-3 text-white/70">
              A clear, fast process that gets you concrete improvements right away.
            </p>
            <ul className="mt-6 space-y-3 text-sm md:text-base">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                <div>
                  <span className="font-medium">Booking & prep.</span>{" "}
                  Pick a slot and share rank, role, and 1–2 goals. I review your info before we meet.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                <div>
                  <span className="font-medium">Live session.</span>{" "}
                  We focus on high-impact fixes: decision rules, tempo, wave control, tracking, win-cons.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                <div>
                  <span className="font-medium">Action plan.</span>{" "}
                  You leave with 3–5 priorities you can apply in your next games.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                <div>
                  <span className="font-medium">Resources.</span>{" "}
                  Kept simple: rules of thumb, examples, and checkpoints to self-review.
                </div>
              </li>
            </ul>
          </div>

          {/* Right: graphic */}
          <div className="md:col-span-6">
            <div className="relative rounded-2xl border border-white/10 bg-white/[.03] p-6 md:p-8">
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                   style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }} />
              {/* Timeline graphic */}
              <div className="space-y-6">
                {[
                  { t: "Booking", c: "#a6c8ff" },
                  { t: "Session", c: "#f6b1b1" },
                  { t: "Action Plan", c: "#f6e9b3" },
                ].map((s, i) => (
                  <div key={s.t} className="flex items-center gap-4">
                    <div className="relative">
                      <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: s.c }} />
                      {i < 2 && <span className="absolute left-1.5 top-3 h-10 w-px bg-white/15" />}
                    </div>
                    <div className="flex-1 h-10 rounded-lg border border-white/10 bg-white/[.05] px-4 flex items-center text-sm">
                      {s.t}
                    </div>
                  </div>
                ))}
              </div>
              {/* Corner accent */}
              <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-3xl rotate-12 opacity-20"
                   style={{ background: "radial-gradient(closest-side, #f6e9b3, transparent)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

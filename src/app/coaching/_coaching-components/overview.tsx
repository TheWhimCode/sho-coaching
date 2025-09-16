import React from "react";
import CoachingTimeline from "@/app/coaching/_coaching-components/timeline"; // adjust path

export default function Overview({
  className = "",
  containerClassName = "max-w-7xl px-6",
}: { className?: string; containerClassName?: string }) {
  return (
    <section className={`relative w-full ${className}`}>
      <div className={`mx-auto w-full ${containerClassName}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
          {/* LEFT */}
          <div className="md:col-span-7 relative">
            {/* Header (larger + clearer hierarchy, ghost removed) */}
            <div className="relative">
              <h2 className="mt-0 text-[50px] md:text-[64px] leading-tight font-bold">
                What to <span className="text-[#fc8803]">expect</span>
              </h2>
              <p className="mt-3 text-white/60 text-sm md:text-base uppercase tracking-wide">
                Every session personalized. Every student unique.
              </p>
            </div>

            {/* Main paragraph (clean, adjusted spacing) */}
            <div className="mt-5 max-w-2xl">
              <p className="text-base md:text-lg text-white/80 leading-relaxed">
                Every player has different strengths, weaknesses, and goals — so no two
                sessions ever look the same. Each rank, role, and champion changes
                what matters most, so I shape the coaching around your current level of
                understanding.
              </p>
            </div>
          </div>

          {/* RIGHT — video */}
          <div className="md:col-span-5">
            <div className="relative rounded-2xl border border-white/10 bg-white/[.03] overflow-hidden">
              <div className="aspect-video w-full">
                {/* Replace with your <video> / player */}
                <div className="h-full w-full grid place-items-center text-white/40">
                  Video: Join → Live Coaching → 3 Priorities
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }}
              />
              <div className="absolute left-4 top-4 rounded-md bg-black/30 backdrop-blur px-2 py-1 text-[11px] text-white/80 border border-white/10">
                Preview
              </div>
            </div>
          </div>
        </div>

        {/* Full-width timeline */}
        <div className="mt-10 md:mt-12">
          <CoachingTimeline />
        </div>
      </div>
    </section>
  );
}

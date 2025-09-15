"use client";

import React from "react";

import Survey from "@/app/coaching/_coaching-components/survey";
import Reviews from "@/app/coaching/_coaching-components/reviews";
import CoachingExamples from "@/app/coaching/_coaching-components/examples";
import FollowUp from "@/app/coaching/_coaching-components/follow-up";
import Overview from "@/app/coaching/_coaching-components/overview";
import PresetCards from "@/app/coaching/_coaching-components/cards";

export default function Page() {
  return (
    // Very dark base blue behind everything (full-bleed)
    <main className="relative min-h-screen bg-[#070F1E] text-white">
      {/* Global stars/noise */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 10% 10%, rgba(80,110,255,0.18), transparent 60%)," +
              "radial-gradient(800px 400px at 90% 20%, rgba(245,158,11,0.10), transparent 60%)," +
              "radial-gradient(900px 500px at 50% 100%, rgba(56,189,248,0.10), transparent 60%)",
            filter: "saturate(110%) blur(0.25px)",
          }}
        />
        <div className="absolute inset-0 bg-[url('/stars-noise.png')] opacity-[0.10] mix-blend-screen" />
      </div>

      {/* 1) Product cards — full-width gradient band (extra space above/below) */}
      <section className="relative isolate pt-40 pb-24 md:pt-48 md:pb-28">
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(37,99,235,0.18) 0%, rgba(56,189,248,0.14) 50%, rgba(7,15,30,0) 100%)",
          }}
        />
        <div className="relative z-10">
          <PresetCards containerClassName="max-w-6xl px-6" />
        </div>
      </section>

      {/* 2) Examples — no band; shows page base (full width) */}
      <section className="relative isolate py-6">
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
          <CoachingExamples />
        </div>
      </section>

      {/* 3) Overview — full-width gradient band */}
      <section className="relative isolate pt-8 pb-24">
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(56,189,248,0.14) 0%, rgba(99,102,241,0.14) 55%, rgba(7,15,30,0) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <Overview className="py-0" />
        </div>
      </section>

      {/* 4) Reviews — no band; shows page base (full width) */}
      <section className="relative isolate py-12">
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <Reviews />
        </div>
      </section>

      {/* 5) Follow-up — cool blues only (no orange), full-width band */}
      <section className="relative isolate py-24">
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(37,99,235,0.16) 0%, rgba(56,189,248,0.12) 55%, rgba(7,15,30,0) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <FollowUp className="py-0" />
        </div>
      </section>

      {/* 6) Survey — full-bleed (no container) */}
      <section className="relative isolate py-16">
        <div className="relative z-10">
          <Survey className="my-6 w-full" />
        </div>
      </section>
    </main>
  );
}

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
    <main className="relative min-h-screen bg-[#0B0F1A] text-white">
      {/* Background stars/noise */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 10% 10%, rgba(80,110,255,0.15), transparent 60%)," +
              "radial-gradient(800px 400px at 90% 20%, rgba(249,205,93,0.08), transparent 60%)," +
              "radial-gradient(900px 500px at 50% 100%, rgba{180,120,255,0.08}, transparent 60%)",
            filter: "saturate(105%) blur(0.3px)",
          }}
        />
        <div className="absolute inset-0 bg-[url('/stars-noise.png')] opacity-[0.1] mix-blend-screen" />
      </div>

      {/* Product cards with blue background gradient */}
      <section className="relative isolate pt-16 pb-16">
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(59,130,246,0.16) 0%, rgba(37,99,235,0.12) 55%, rgba(11,15,26,0) 100%)",
          }}
        />
        <div className="relative z-10">
          <PresetCards containerClassName="max-w-6xl px-6" />
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-6xl px-6">
        <Reviews />
      </section>

      {/* Overview — full-width gradient background */}
      <section className="relative isolate py-24">
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(139,92,246,0.16) 0%, rgba(236,72,153,0.14) 55%, rgba(11,15,26,0) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <Overview className="py-0" />
        </div>
      </section>

      {/* Examples */}
      <section className="mx-auto max-w-6xl px-6">
        <CoachingExamples />
      </section>

      {/* FollowUp — full-width gradient background */}
      <section className="relative isolate py-24">
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,185,129,0.16) 0%, rgba(56,189,248,0.14) 55%, rgba(11,15,26,0) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <FollowUp className="py-0" />
        </div>
      </section>

      {/* Survey */}
      <section className="mx-auto max-w-6xl px-6">
        <Survey className="my-20" />
      </section>
    </main>
  );
}

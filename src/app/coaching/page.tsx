"use client";

import React, { useRef } from "react";

import Survey from "@/app/coaching/_coaching-components/survey";
import Reviews from "@/app/coaching/_coaching-components/reviews";
import CoachingExamples from "@/app/coaching/_coaching-components/examples";
import FollowUp from "@/app/coaching/_coaching-components/follow-up";
import Overview from "@/app/coaching/_coaching-components/overview";
import PresetCards from "@/app/coaching/_coaching-components/cards";

export default function Page() {
  const followupRef = useRef<HTMLElement | null>(null);

  const scrollToFollowup = () => {
    followupRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <main
      className="relative min-h-screen text-white"
      style={{
        background: `
          linear-gradient(
            180deg,
            #0A1730 0%,
            #0C1D3E 20%,
            #13254A 40%,
            #0C1D3E 60%,
            #08142C 80%,
            #0A1730 100%
          )
        `,
      }}
    >
      {/* Decorative overlays */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(900px 480px at 8% 6%, rgba(96,165,250,0.20), transparent 60%),
              radial-gradient(800px 420px at 92% 10%, rgba(56,189,248,0.16), transparent 60%),
              linear-gradient(90deg,
                rgba(173,216,255,0.10) 0%,
                transparent 18%,
                rgba(173,216,255,0.04) 50%,
                transparent 82%,
                rgba(173,216,255,0.10) 100%
              )
            `,
          }}
        />
      </div>

      {/* 1) Product cards + Examples */}
      <section className="relative isolate pt-40 pb-16 md:pt-48 md:pb-16 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl">
          <PresetCards
            containerClassName="max-w-6xl px-6"
            onFollowupInfo={scrollToFollowup}
          />
          <div className="border-t border-white/10 mx-2 my-16" />
          <div className="pl-6">
            <CoachingExamples />
          </div>
        </div>
      </section>

      {/* 2) Overview */}
      <section className="relative isolate pt-24 pb-24 md:pt-24 md:pb-24">
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(56,189,248,0.20) 0%, rgba(99,102,241,0.20) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <Overview className="py-0" />
        </div>
      </section>

      {/* 3) Reviews */}
      <section className="relative isolate">
        <div className="relative z-10 mx-auto max-w-6xl px-6 min-h-[220px] grid place-items-center">
          <Reviews />
        </div>
      </section>

      {/* 4) Follow-up */}
      <section
        ref={followupRef}
        className="relative isolate pt-24 pb-24 md:pt-24 md:pb-24"
      >
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(37,99,235,0.22) 0%, rgba(56,189,248,0.18) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <FollowUp className="py-0" />
        </div>
      </section>

      {/* 5) Survey */}
      <section className="relative isolate py-6">
        <div className="relative z-10">
          <Survey className="my-2 w-full" />
        </div>
      </section>
    </main>
  );
}

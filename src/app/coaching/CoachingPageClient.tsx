"use client";

import React from "react";
import Survey from "@/app/coaching/_coaching-components/survey";
import Reviews from "@/app/coaching/_coaching-components/reviews";
import CoachingExamples from "@/app/coaching/_coaching-components/examples";
import FollowUp from "@/app/coaching/_coaching-components/follow-up";
import Overview from "@/app/coaching/_coaching-components/overview";
import PresetCards from "@/app/coaching/_coaching-components/cards";
import NeedMoreInfo from "@/app/coaching/_coaching-components/components/NeedMoreInfo";
import FAQ from "@/app/coaching/_coaching-components/faq";

export default function CoachingPageClient() {
  const handleScrollToFollowup = React.useCallback(() => {
    const el = document.getElementById("followup");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <main
      className="relative min-h-screen text-white"
      style={{
        background:
          "linear-gradient(180deg,#0A1730 0%,#0C1D3E 20%,#13254A 40%,#0C1D3E 60%,#08142C 80%,#0A1730 100%)",
      }}
    >
      {/* global decorative sweep */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 480px at 8% 6%, rgba(96,165,250,.20), #0000 60%), radial-gradient(800px 420px at 92% 10%, rgba(56,189,248,.16), #0000 60%), linear-gradient(90deg, rgba(173,216,255,.10) 0%, #0000 18%, rgba(173,216,255,.04) 50%, #0000 82%, rgba(173,216,255,.10) 100%)",
          }}
        />
      </div>

      {/* 1) Product cards + Examples */}
      <section className="relative isolate pt-40 pb-16 md:pt-48 md:pb-16 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl">
          <PresetCards
            containerClassName="max-w-6xl px-6"
            onFollowupInfo={handleScrollToFollowup}
          />
          <div className="border-t border-white/10 mx-2 my-16" />
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[140vw] -z-10"
              style={{
                backgroundImage: "url('/images/coaching/grid.png')",
                backgroundRepeat: "repeat",
                backgroundPosition: "center 140px",
                backgroundSize: "auto",
                opacity: 0.25,
                imageRendering: "crisp-edges",
                maskImage:
                  "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              }}
            />
            <div className="relative z-10">
              <CoachingExamples />
            </div>
          </div>
        </div>
      </section>

      {/* 2) Reviews */}
      <section
        className="relative isolate overflow-hidden"
        style={{ backgroundColor: "#0C1D3E" }}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: "url('/images/coaching/texture.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
            mixBlendMode: "overlay",
            opacity: 0.35,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset 0 30px 12px -6px rgba(0,0,0,0.5), inset 0 -30px 12px -6px rgba(0,0,0,0.5), inset 30px 0 12px -6px rgba(0,0,0,0.5), inset -30px 0 12px -6px rgba(0,0,0,0.5)",
          }}
        />
        <div className="relative z-20 mx-auto max-w-7xl">
          <Reviews />
        </div>
      </section>

      {/* 3) Overview (kept above Follow-up) */}
      <section className="relative isolate pt-44 pb-28 md:pt-56 md:pb-36">
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px 400px at 15% 20%, rgba(56,189,248,.20), #0000 60%), radial-gradient(700px 420px at 85% 15%, rgba(99,102,241,.18), #0000 62%), linear-gradient(180deg, rgba(56,189,248,.10) 0%, rgba(99,102,241,.10) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-6xl px-6 mx-auto">
            <Overview className="py-0" />
          </div>
        </div>
      </section>

      {/* 4) FAQ (inserted between Overview and Follow-up) */}
<FAQ />   {/* ← no extra section wrapper with padding here */}


      {/* 5) Follow-up + Survey (kept as anchor target) */}
      <section
        id="followup"
        className="relative isolate pt-32 pb-32 md:pt-40 md:pb-40 overflow-hidden scroll-mt-24"
      >
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-6xl px-6 mx-auto">
            <FollowUp className="py-0" />
            <div className="border-t border-white/10 mx-2 my-16" />
            <Survey className="w-full" />
          </div>
        </div>
      </section>

      {/* Spacer */}
      <section className="relative isolate py-84">
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center opacity-40" />
      </section>

      {/* Simple callout */}
      <NeedMoreInfo label="Need more info?" accent="#8FB8E6" />
    </main>
  );
}

"use client";

import React from "react";
import Survey from "@/app/coaching/_coaching-components/survey";
import Reviews from "@/app/coaching/_coaching-components/reviews";
import CoachingExamples from "@/app/coaching/_coaching-components/examples";
import FollowUp from "@/app/coaching/_coaching-components/follow-up";
import Overview2 from "@/app/coaching/_coaching-components/overview2";
import PresetCards from "@/app/coaching/_coaching-components/cards";
import NeedMoreInfo from "@/app/coaching/_coaching-components/components/NeedMoreInfo";
import FAQ from "@/app/coaching/_coaching-components/faq";
import Clips from "@/app/coaching/_coaching-components/clips";
import PlaceholderSections from "@/app/coaching/_coaching-components/placeholder-sections";

export default function CoachingPageClient() {
  const handleScrollToFollowup = React.useCallback(() => {
    const el = document.getElementById("followup");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const pageBG =
    "linear-gradient(180deg,#050B18 0%,#081126 20%,#0A1730 40%,#081126 60%,#050B18 80%,#000 100%)";

  return (
    <main className="relative min-h-screen text-white" style={{ background: pageBG }}>
      {/* global decorative sweep */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 480px at 8% 6%, rgba(96,165,250,.12), #0000 60%), radial-gradient(800px 420px at 92% 10%, rgba(56,189,248,.10), #0000 60%), linear-gradient(90deg, rgba(173,216,255,.06) 0%, #0000 18%, rgba(173,216,255,.02) 50%, #0000 82%, rgba(173,216,255,.06) 100%)",
          }}
        />
      </div>

      {/* 1) Product cards + Examples */}
      <section className="relative isolate pt-20 pb-0 md:pt-48 md:pb-16 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl">
          <PresetCards
            containerClassName="max-w-6xl px-6"
            onFollowupInfo={handleScrollToFollowup}
          />
          <div className="border-t border-white/10 mx-2 my-16" />
          <div className="relative">
            {/* subtle grid just for the examples section */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[140vw] -z-10"
              style={{
                backgroundImage: "url('/images/coaching/grid.png')",
                backgroundRepeat: "repeat",
                backgroundPosition: "center 140px",
                backgroundSize: "auto",
                opacity: 0.15,
                imageRendering: "crisp-edges",
                maskImage:
                  "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              }}
            />
            <div className="relative z-10 mb-12 md:mb-0">
              <CoachingExamples />
            </div>
          </div>
        </div>
      </section>

      {/* 2) Reviews */}
      <section className="relative isolate overflow-hidden" style={{ backgroundColor: "#081126" }}>
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: "url('/images/coaching/texture.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
            mixBlendMode: "overlay",
            opacity: 0.25,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset 0 30px 12px -6px rgba(0,0,0,0.6), inset 0 -30px 12px -6px rgba(0,0,0,0.6), inset 30px 0 12px -6px rgba(0,0,0,0.6), inset -30px 0 12px -6px rgba(0,0,0,0.6)",
          }}
        />
        <div className="relative z-20 mx-auto max-w-7xl">
          <Reviews />
        </div>
      </section>

      {/* 3) Overview */}
      <section className="relative isolate pt-24 pb-24 md:pt-56 md:pb-56 overflow-hidden">
        {/* subtle left/right gradients behind the element */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background:
              `radial-gradient(1200px 650px at 36% 60%, color-mix(in srgb, var(--color-purple) 25%, transparent) 0%, transparent 75%),` +
              `radial-gradient(1200px 650px at 64% 60%, color-mix(in srgb, var(--color-lightblue) 20%, transparent) 0%, transparent 75%)`,
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-6xl px-6 mx-auto">
            <Overview2 />
          </div>
        </div>
      </section>


      {/* 3a) Motivational glow (now self-contained inside the component) */}
      <PlaceholderSections />

      {/* 3b) Clips */}
      <section className="relative isolate pt-12 pb-24 md:pt-20 md:pb-32 overflow-visible">
        <div className="relative z-10 mx-auto max-w-7xl overflow-visible">
          <div className="max-w-6xl px-6 mx-auto overflow-visible">
            <Clips className="py-0 hidden md:block" />
          </div>
        </div>
      </section>

      {/* 4) Follow-up + Survey */}
      <section
        id="followup"
        className="relative isolate pt-16 pb-16 md:pt-40 md:pb-40 overflow-hidden scroll-mt-24"
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
      <section className="relative isolate py-20 md:py-84">
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center opacity-40" />
      </section>

      {/* Hide these on mobile */}
      <div className="hidden md:block">
        <NeedMoreInfo label="Need more info?" accent="#8FB8E6" />
        <FAQ />
      </div>
    </main>
  );
}

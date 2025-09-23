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
import Tagline from "@/app/coaching/_coaching-components/tagline";
import ShowcaseCarousel from "@/app/coaching/_coaching-components/showcase-carousel";

// divider with logo
import DividerWithLogo from "@/app/_components/small/Divider-logo";

export default function CoachingPageClient() {
  const handleScrollToFollowup = React.useCallback(() => {
    const el = document.getElementById("followup");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

const pageBG = "var(--color-bg)";

  return (
    <main
      className="relative min-h-screen text-white overflow-x-clip"
      style={{ background: pageBG }}
    >
<section className="relative isolate pt-20 pb-0 md:pt-48 md:pb-16 overflow-hidden overflow-x-clip">
  <div className="relative z-10 mx-auto max-w-7xl">
    <PresetCards
      containerClassName="max-w-6xl px-6"
      onFollowupInfo={handleScrollToFollowup}
    />
    <DividerWithLogo className="mx-2 my-16" />
    <div className="relative">
      <div className="relative z-10 mb-12 md:mb-0">
        <CoachingExamples />
      </div>
    </div>
  </div>
</section>


      {/* 2) Reviews */}
      <section
        className="relative isolate overflow-hidden"
        style={{ backgroundColor: "#081126" }}
      >
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
      <section className="relative isolate pt-24 pb-36 md:pt-56 md:pb-[19rem] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none -z-10"
          style={{ boxShadow: "0 0 25px rgba(255,255,255,0.08)" }}
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-6xl px-6 mx-auto">
            <Overview2 />
          </div>
        </div>
      </section>

      {/* 3a) Tagline */}
      <section className="relative isolate">
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <Tagline />
        </div>
      </section>

      {/* 3b) Clips */}
      <section
        id="clips-section"
        className="relative isolate pt-36 pb-36 md:pt-[19rem] md:pb-[19rem] overflow-x-clip overflow-y-visible"
      >
        {/* animation CSS (transform-based; no layout overflow) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #clips-stripes {
                --stripe-thickness: 14rem;
                --stripe-gap: 1rem;
              }
              #clips-stripes .stripe {
                height: var(--stripe-thickness);
                transform: scaleX(0);
                transform-origin: left center;
                will-change: transform;
                transition: transform 900ms cubic-bezier(.22,.61,.36,1);
              }
              #clips-stripes .stripe--bottom { transition-delay: 0ms; }
              #clips-stripes .stripe--middle { transition-delay: 140ms; }
              #clips-stripes .stripe--top    { transition-delay: 280ms; }

              /* 20% shorter than previous */
              #clips-stripes.in-view .stripe--top    { transform: scaleX(0.72); }
              #clips-stripes.in-view .stripe--bottom { transform: scaleX(0.912); }
              #clips-stripes.in-view .stripe--middle { transform: scaleX(0.976); }

              @media (prefers-reduced-motion: reduce) {
                #clips-stripes .stripe { transition: none; transform: none; }
              }
            `,
          }}
        />

        {/* Sentinel at the vertical center of the Clips area */}
        <div
          id="clips-center-sentinel"
          aria-hidden
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px pointer-events-none opacity-0"
        />

        {/* stripes container (centered, clipped horizontally) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -z-10 left-0 right-0 bottom-[-30rem] md:bottom-[-38rem] h-[90rem] md:h-[110rem] overflow-x-clip overflow-y-visible"
        >
          <div
            id="clips-stripes"
            className="absolute left-1/2 -translate-x-1/2 bottom-0 w-screen max-w-[100vw] h-[140rem] rotate-[-32deg] origin-bottom-left"
          >
            {/* middle (longest visual) */}
            <div
              className="stripe stripe--middle absolute left-0 w-[100vw]"
              style={{
                bottom: "calc(var(--stripe-thickness) + var(--stripe-gap))",
                backgroundColor: "rgba(15, 30, 85, 0.40)",
              }}
            />
            {/* bottom */}
            <div
              className="stripe stripe--bottom absolute left-0 w-[100vw]"
              style={{
                bottom: "0",
                backgroundColor: "rgba(15, 30, 85, 0.40)",
              }}
            />
            {/* top */}
            <div
              className="stripe stripe--top absolute left-0 w-[100vw]"
              style={{
                bottom:
                  "calc((var(--stripe-thickness) + var(--stripe-gap)) * 2)",
                backgroundColor: "rgba(15, 30, 85, 0.40)",
              }}
            />
          </div>

          <div
            className="absolute inset-0"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0, black 15%, black 85%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, black 15%, black 85%, transparent 100%)",
            }}
          />
        </div>

        {/* Observer: triggers when the center sentinel is visible */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var sentinel = document.getElementById('clips-center-sentinel');
                var stripes = document.getElementById('clips-stripes');
                if (!sentinel || !stripes || window.__clipsObsCenterInit) return;
                window.__clipsObsCenterInit = true;

                var obs = new IntersectionObserver(function(entries){
                  for (var i=0;i<entries.length;i++){
                    if (entries[i].isIntersecting){
                      requestAnimationFrame(function(){
                        stripes.classList.add('in-view');
                      });
                      obs.disconnect();
                      break;
                    }
                  }
                }, {
                  threshold: 0,
                  root: null,
                  rootMargin: "0px"
                });

                obs.observe(sentinel);
              })();
            `,
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl overflow-visible">
          <div className="max-w-6xl px-6 mx-auto overflow-visible">
            <Clips className="py-0 hidden md:block" />
          </div>
        </div>
      </section>

      {/* 3c) Placeholder sections */}
      <PlaceholderSections />

      {/* Auto-scrolling showcase element */}
      <section className="relative isolate py-8 md:py-16">
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <ShowcaseCarousel />
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
            <DividerWithLogo className="mx-2 my-16" />
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

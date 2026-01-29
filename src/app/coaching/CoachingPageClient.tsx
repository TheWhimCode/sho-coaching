"use client";

import React from "react";
import Reviews from "@/app/coaching/_coaching-components/reviews";
import CoachingExamples from "@/app/coaching/_coaching-components/examples";
import FollowUp from "@/app/coaching/_coaching-components/follow-up";
import Overview from "@/app/coaching/_coaching-components/overview";
import PresetCards from "@/app/coaching/_coaching-components/cards";
import NeedMoreInfo from "@/app/coaching/_coaching-components/components/NeedMoreInfo";
import Clips from "@/app/coaching/_coaching-components/clips";
import ClipsMobile from "@/app/coaching/_coaching-components/clipsmobile";
import Tagline from "@/app/coaching/_coaching-components/tagline";
import DividerWithLogo from "@/app/_components/small/Divider-logo";
import GlassPanel from "@/app/_components/panels/GlassPanel";

export default function CoachingPageClient() {
  const handleScrollToFollowup = React.useCallback(() => {
    const el = document.getElementById("followup");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const pageBG = "var(--color-bg)";

  return (
    <>
      <div className="fixed inset-0 z-0" style={{ background: pageBG }} />

      <div className="relative z-10 text-white overflow-x-clip">
        <section className="relative isolate overflow-x-clip">
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="block-gap" />
            <PresetCards
              containerClassName="max-w-6xl px-6"
              onFollowupInfo={handleScrollToFollowup}
            />
            <div className="block-gap" />
            <DividerWithLogo className="mx-2" />
            <div className="block-gap" />
            <CoachingExamples />
            <div className="block-gap" />
          </div>
        </section>

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

        <section className="relative -mt-px">
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 -bottom-[50%] -z-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 22% 18%, rgba(0,130,255,0.22), transparent 58%), radial-gradient(circle at 78% 32%, rgba(255,100,30,0.18), transparent 58%)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-6xl px-6 pb-0">
            <GlassPanel className="!ring-0 border border-t-0 border-[rgba(146,180,255,.18)] !rounded-t-none p-4 md:p-10">
              <div className="max-w-6xl mx-auto">
                <Overview />
              </div>
            </GlassPanel>
          </div>
        </section>

        <section className="relative isolate py-24 md:py-36">
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <Tagline />
          </div>
        </section>

        <section id="clips-section" className="relative isolate">
          <div
            aria-hidden
            className="absolute -top-[120%] left-0 right-0 -bottom-[40%] -z-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 22% 70%, rgba(255,100,0,0.18), transparent 58%), radial-gradient(circle at 78% 80%, rgba(0,130,255,0.22), transparent 58%)",
            }}
          />

          <div className="relative z-10 mx-auto max-w-6xl px-6 pb-8 md:pb-0">
            <GlassPanel
              className="
                p-0 md:p-8
                !ring-0
                border border-[rgba(146,180,255,.18)]
              "
            >
              <div className="block-gap" />

              {/* MOBILE VERSION */}
              <div className="block md:hidden">
                <ClipsMobile
                  className="py-0"
                  containerClassName="max-w-5xl mx-auto px-4"
                />
              </div>

              {/* DESKTOP VERSION */}
              <div className="hidden md:block">
                <Clips
                  className="py-0"
                  containerClassName="max-w-5xl mx-auto px-4 md:px-0"
                />
              </div>

              <DividerWithLogo className="mx-2 my-16" />

              <section
                id="followup"
                className="relative isolate scroll-mt-24"
              >
                <div className="relative z-10 mx-auto max-w-7xl">
                  <div className="max-w-6xl px-6 mx-auto">
                    <FollowUp className="py-0" />
                  </div>
                </div>
              </section>

              <div className="block-gap" />
            </GlassPanel>
          </div>
        </section>

        <div className="hidden md:block">
          <NeedMoreInfo label="Need more info?" accent="#8FB8E6" />
        </div>
      </div>
    </>
  );
}
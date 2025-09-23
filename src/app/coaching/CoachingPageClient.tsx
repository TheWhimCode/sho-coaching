"use client";

import React, { useEffect, useRef } from "react";
import Survey from "@/app/coaching/_coaching-components/survey";
import Reviews from "@/app/coaching/_coaching-components/reviews";
import CoachingExamples from "@/app/coaching/_coaching-components/examples";
import FollowUp from "@/app/coaching/_coaching-components/follow-up";
import Overview from "@/app/coaching/_coaching-components/overview";
import PresetCards from "@/app/coaching/_coaching-components/cards";
import NeedMoreInfo from "@/app/coaching/_coaching-components/components/NeedMoreInfo";
import FAQ from "@/app/coaching/_coaching-components/faq";
import Clips from "@/app/coaching/_coaching-components/clips";
import PlaceholderSections from "@/app/coaching/_coaching-components/inspiration";
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
      {/* 1) Preset cards + examples */}
      <section className="relative isolate pt-20 pb-0 md:pt-48 md:pb-16 overflow-x-clip">
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

      {/* 3) Overview — smaller gradients, bottom oversize only */}
      <section className="relative isolate pt-24 pb-36 md:pt-56 md:pb-[19rem]">
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 -bottom-[50%] -z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 22% 18%, rgba(0,130,255,0.22), transparent 58%), radial-gradient(circle at 78% 32%, rgba(255,100,30,0.18), transparent 58%)",
            animation: "slow-pan 45s linear infinite",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-6xl px-6 mx-auto">
            <Overview />
          </div>
        </div>
      </section>

      {/* 3a) Tagline */}
      <section className="relative isolate">
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <Tagline />
        </div>
      </section>

      {/* 3b) Clips with particles */}
      <section
        id="clips-section"
        className="relative isolate pt-36 pb-36 md:pt-[19rem] md:pb-[19rem]"
      >
        <ParticleBackground />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-6xl px-6 mx-auto">
            <Clips className="py-0 hidden md:block" />
          </div>
        </div>
      </section>

      {/* 3c) Placeholder sections */}
      <PlaceholderSections />

      {/* 4) Showcase carousel */}
      <section className="relative isolate py-8 md:py-16">
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <ShowcaseCarousel />
        </div>
      </section>

      {/* 5) Follow-up + Survey */}
      <section
        id="followup"
        className="relative isolate pt-16 pb-16 md:pt-40 md:pb-40 scroll-mt-24"
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

      {/* Shared keyframes */}
      <style jsx>{`
        @keyframes slow-pan {
          0% {
            background-position: 0% 0%, 100% 100%;
          }
          50% {
            background-position: 40% 40%, 70% 55%;
          }
          100% {
            background-position: 0% 0%, 100% 100%;
          }
        }
      `}</style>
    </main>
  );
}

/** Particle background for Clips section */
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1.2 + Math.random() * 1.4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
      requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-0 right-0 top-0 -bottom-[50%] w-full h-[150%] -z-10 pointer-events-none"
    />
  );
}

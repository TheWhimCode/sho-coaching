"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { CLIPS, ClipData } from "@/lib/coaching/clips.data";
import ClipTiles from "@/app/coaching/_coaching-components/components/ClipTiles";
import GlassPanel from "@/app/_components/panels/GlassPanel";

type Props = {
  className?: string;
  containerClassName?: string;
  heading?: string;
  subheading?: string;
  clips?: ClipData[];
};

export default function Clips({
  className = "",
  containerClassName = "max-w-7xl",
  heading = "See what good looks like",
  subheading = "Understand what the game looks like when played right, not just what you're doing wrong.",
  clips,
}: Props) {
  // Strip subtitles
  const data = useMemo<ClipData[]>(
    () =>
      (clips && clips.length ? clips : CLIPS).map((c) => ({
        ...c,
        subtitle: undefined,
      })),
    [clips]
  );

  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let done = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (done || !entry.isIntersecting) return;

        // Start only once the TOP of the section has crossed the viewport's 50% line
        const rect = wrap.getBoundingClientRect();
        const mid = window.innerHeight * 0.5;
        if (rect.top > mid) return;

        const tiles = Array.from(
          wrap.querySelectorAll<HTMLElement>(".clip-tiles .group")
        );

        // Fisher–Yates shuffle to randomize blink order
        const shuffled = tiles.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Uniform stagger
        const BASE_S = 1.0;
        const STEP_S = 0.12;

        shuffled.forEach((el, idx) => {
          el.style.animation = `clipBlinkIn 0.38s ease forwards`;
          el.style.animationDelay = `${BASE_S + idx * STEP_S}s`;
        });

        done = true;
        io.disconnect();
      },
      {
        root: null,
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      }
    );

    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  return (
    <section
      className={`w-full ${className}`}
      aria-labelledby="clips-heading"
      ref={wrapRef}
    >
      <div className={`mx-auto w-full ${containerClassName}`}>
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2
            id="clips-heading"
            className="mt-0 text-[40px] md:text-[52px] leading-tight font-bold"
          >
            {heading}
          </h2>
          <p className="mt-3 text-base md:text-xl text-white/70 max-w-3xl mx-auto">
            {subheading}
          </p>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* One GlassPanel wrapping BOTH sides */}
        <GlassPanel className="relative p-5 md:p-8">
          {/* inner border glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.05), inset 0 0 20px rgba(0,0,0,.25)",
            }}
          />

          {/* full-height divider at 7/12 (between wider left and narrower right) */}
          <div
            aria-hidden
            className="hidden md:block pointer-events-none absolute inset-y-0 left-[58.333333%] w-px bg-white/10"
          />

          {/* content grid inside the panel */}
          <div className="relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
            {/* LEFT: tiles (wider) */}
            <ClipTiles
              data={data}
              cols={3}
              rows={2}
              gap="12px"
              className="md:col-span-7 rounded-xl overflow-hidden clip-tiles"
            />

            {/* RIGHT: explainer content (narrower) */}
            <div className="md:col-span-5">
              <p className="text-[10px] tracking-[0.22em] text-white/55 uppercase">
                Teaching tool
              </p>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold">
                Library of clips
              </h3>
              <p className="mt-3 text-white/75 text-base md:text-lg leading-relaxed max-w-[58ch]">
                League is a game of visualization. But imagining a play that
                you've never consciously seen before is extremely difficult.
                Even more challenging to adjust your play around it.
              </p>
              <p className="mt-3 text-white/75 text-base md:text-lg leading-relaxed max-w-[58ch]">
                That is why I've created a library of over 300 clips, to show
                you how a Challenger player would behave in your shoes.
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Blink-in CSS */}
      <style jsx>{`
        :global(.clip-tiles .group) {
          opacity: 0;
          visibility: hidden;
          will-change: opacity, transform;
        }
        @keyframes clipBlinkIn {
          0% {
            opacity: 1;
            visibility: visible;
          }
          20% {
            opacity: 0;
            visibility: visible;
          }
          100% {
            opacity: 1;
            visibility: visible;
          }
        }
      `}</style>
    </section>
  );
}

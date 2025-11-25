"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { CLIPS, ClipData } from "@/lib/coaching/clips.data";
import ClipTiles from "@/app/coaching/_coaching-components/components/ClipTiles";

type Props = {
  className?: string;
  containerClassName?: string;
  heading?: string;
  subheading?: string;
  clips?: ClipData[];
};

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

export default function ClipsMobile({
  className = "",
  containerClassName = "px-4",
  heading = "See what good looks like",
  subheading = "Understand what the game looks like when played right, not just what you're doing wrong.",
  clips,
}: Props) {
  const data = useMemo<ClipData[]>(
    () =>
      (clips && clips.length ? clips : CLIPS).map((c) => ({
        ...c,
        subtitle: undefined,
      })),
    [clips]
  );

  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Same blink animation logic
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let done = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (done || !entry.isIntersecting) return;

        const rect = wrap.getBoundingClientRect();
        const mid = window.innerHeight * 0.5;
        if (rect.top > mid) return;

        const tiles = Array.from(
          wrap.querySelectorAll<HTMLElement>(".clip-tiles .group")
        );

        const shuffled = tiles.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const BASE_S = 0.4;
        const STEP_S = 0.12;

        shuffled.forEach((el, idx) => {
          el.style.animation = `clipBlinkIn 0.38s ease forwards`;
          el.style.animationDelay = `${BASE_S + idx * STEP_S}s`;
        });

        done = true;
        io.disconnect();
      },
      { root: null, rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  return (
    <section
      className={`w-full ${className}`}
      aria-labelledby="clips-heading-mobile"
      ref={wrapRef}
    >
      <div className={`mx-auto w-full ${containerClassName}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <h2
            id="clips-heading-mobile"
            className="mt-0 text-[34px] leading-tight font-extrabold"
            style={{ textShadow: HEAVY_TEXT_SHADOW }}
          >
            {heading}
          </h2>

          <p
            className="mt-3 text-base text-white/70"
            style={{ textShadow: HEAVY_TEXT_SHADOW }}
          >
            {subheading}
          </p>

          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Tiles full width */}
        <ClipTiles
          data={data}
          cols={3}
          rows={2}
          gap="6px"
          className="rounded-xl overflow-hidden clip-tiles"
        />

        {/* Text below */}
        <div className="mt-10">
          <p className="text-[10px] tracking-[0.22em] text-white/55 uppercase">
            Teaching tool
          </p>

          <h3 className="mt-2 text-2xl font-semibold">Library of clips</h3>

          <p className="mt-3 text-white/75 text-base leading-relaxed">
            League is a game of visualization. But imagining a play that
            you've never consciously seen before is extremely difficult.
            Even more challenging to adjust your play around it.
          </p>

          <p className="mt-3 text-white/75 text-base leading-relaxed">
            That is why I've created a library of over 300 clips, to show
            you how a Challenger player would behave in your shoes.
          </p>
        </div>
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

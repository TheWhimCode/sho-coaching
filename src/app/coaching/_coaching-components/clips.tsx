"use client";

import React, { useMemo } from "react";
import { CLIPS, ClipData } from "@/lib/coaching/clips.data";
import ClipTiles from "@/app/coaching/_coaching-components/components/ClipTiles";

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
  const data = useMemo<ClipData[]>(
    () => (clips && clips.length ? clips : CLIPS),
    [clips]
  );

  return (
    <section className={`w-full ${className}`} aria-labelledby="clips-heading">
      <div className={`mx-auto w-full ${containerClassName} px-4 md:px-6`}>
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

        {/* GRID: tiles OUTSIDE wrapper; right panel IN wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* LEFT: tiles (no wrapper) */}
          <ClipTiles
            data={data}
            cols={3}
            rows={2}
            rings={2}
            gap="12px"
            className="md:col-span-6 rounded-2xl overflow-hidden"
          />

          {/* RIGHT: explainer panel (keeps the glassy wrapper) */}
          <div className="md:col-span-6">
            <div
              className="
                relative rounded-2xl p-5 md:p-8
                bg-[rgba(18,32,64,0.35)]
                border border-white/10
                ring-1 ring-inset ring-cyan-300/10
                backdrop-blur-sm
              "
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.05), inset 0 0 20px rgba(0,0,0,.25)",
                }}
              />
              <p className="text-[10px] tracking-[0.22em] text-white/55 uppercase">
                Teaching tool
              </p>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold">
                Library of clips
              </h3>
              <p className="mt-3 text-white/75 text-base md:text-lg leading-relaxed max-w-[58ch]">
                League is a game of visualization. But imagining a play that you've never consciously seen before is extremely
                difficult and it's even more challenging to adjust your gameplay around it.
              </p>
              <p className="mt-3 text-white/75 text-base md:text-lg leading-relaxed max-w-[58ch]">
                That is why I've created a library of over 300 clips, to show you how a
                Challenger player would behave in your shoes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

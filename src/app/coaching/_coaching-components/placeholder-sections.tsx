"use client";

import React from "react";

type SectionProps = { title: string; tagline?: string };

function GlowBackdrop({ reveal }: { reveal: boolean }) {
  const sideVW = 20;

  const glowBG = [
    "radial-gradient(1200px 700px at 12% 12%, rgba(56,189,248,0.75), #0000 65%)",
    "radial-gradient(1200px 700px at 88% 18%, rgba(139,92,246,0.62), #0000 65%)",
    "radial-gradient(1000px 600px at 18% 82%, rgba(6,182,212,0.64), #0000 65%)",
    "radial-gradient(1000px 600px at 82% 86%, rgba(236,72,153,0.52), #0000 65%)",
    "linear-gradient(180deg, rgba(56,189,248,0.30) 0%, rgba(139,92,246,0.28) 100%)",
    // OPAQUE base layer
    "linear-gradient(#05060a, #05060a)",
  ].join(", ");

  const baseFilter = "saturate(0.9) brightness(0.98) contrast(1)";
  const revealFilter = "saturate(1.35) brightness(1.1) contrast(1.06)";

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 will-change-[filter]"
        style={{
          background: glowBG,
          WebkitMaskImage: `linear-gradient(to right, transparent 0, transparent ${sideVW}vw, white ${sideVW}vw, white calc(100% - ${sideVW}vw), transparent calc(100% - ${sideVW}vw), transparent 100%)`,
          maskImage: `linear-gradient(to right, transparent 0, transparent ${sideVW}vw, white ${sideVW}vw, white calc(100% - ${sideVW}vw), transparent calc(100% - ${sideVW}vw), transparent 100%)`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          filter: reveal ? revealFilter : baseFilter,
          transition: "filter 1000ms ease-out",
        }}
      />

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-30 transition-opacity duration-[500ms] ease-out will-change-[opacity,filter] ${
          reveal ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: glowBG,
          WebkitMaskImage: `linear-gradient(to right, white 0, white ${sideVW}vw, transparent ${sideVW}vw, transparent 100%)`,
          maskImage: `linear-gradient(to right, white 0, white ${sideVW}vw, transparent ${sideVW}vw, transparent 100%)`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          filter: "saturate(1.35) brightness(1.1) contrast(1.06)",
          transition: "opacity 1000ms ease-out, filter 1000ms ease-out",
        }}
      />

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-30 transition-opacity duration-[500ms] ease-out will-change-[opacity,filter] ${
          reveal ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: glowBG,
          WebkitMaskImage: `linear-gradient(to right, transparent 0, transparent calc(100% - ${sideVW}vw), white calc(100% - ${sideVW}vw), white 100%)`,
          maskImage: `linear-gradient(to right, transparent 0, transparent calc(100% - ${sideVW}vw), white calc(100% - ${sideVW}vw), white 100%)`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          filter: "saturate(1.35) brightness(1.1) contrast(1.06)",
          transition: "opacity 1000ms ease-out, filter 1000ms ease-out",
        }}
      />
    </>
  );
}

function BigSection({ title, tagline }: SectionProps) {
  return (
    <section className="relative flex flex-col items-center text-center py-28 md:py-40 px-6">
      <div className="max-w-2xl w-full mx-auto">
        {/* AccentBar removed */}
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          {title}
        </h2>
        {tagline && (
          <p className="mt-3 md:mt-4 text-lg md:text-2xl text-white/80">
            {tagline}
          </p>
        )}
      </div>

      <div className="mt-8 w-full max-w-3xl aspect-[16/9] bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center text-white/50">
        Graphic Placeholder (16:9)
      </div>
    </section>
  );
}

export default function PlaceholderSections() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [revealSides, setRevealSides] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // Mirror logic: reveal after top hits top, hide after bottom rises above viewport bottom
      setRevealSides(rect.top <= 0 && rect.bottom >= vh);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative isolate overflow-hidden pt-28 md:pt-40 pb-28 md:pb-40"
    >
      <GlowBackdrop reveal={revealSides} />

      <BigSection
        title="Bring your goals within reach"
        tagline="Climbing isn’t about talent — it’s about discipline and reflection."
      />
      <BigSection
        title="Clarity when the game feels impossible"
        tagline="Don’t ask why you’re losing. Ask how you can win."
      />
      <BigSection
        title="No more uncertainty"
        tagline="Set clear goals that make a real difference in your matches."
      />
      <BigSection
        title="Every game is winnable"
        tagline="A Challenger player can have 100% winrate in low elo. So can you."
      />
    </section>
  );
}

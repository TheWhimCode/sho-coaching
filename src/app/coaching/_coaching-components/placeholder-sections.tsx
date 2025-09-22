"use client";

import React from "react";

type SectionProps = { title: string; tagline?: string };

// ---- Gradient / reveal owner ----
// (Unchanged: gradient background look stays intact)
function GlowBackdrop({ reveal }: { reveal: boolean }) {
  const sideVW = 20;

  const glowBG = [
    "radial-gradient(1200px 700px at 12% 12%, rgba(56,189,248,0.75), #0000 65%)",
    "radial-gradient(1200px 700px at 88% 18%, rgba(139,92,246,0.62), #0000 65%)",
    "radial-gradient(1000px 600px at 18% 82%, rgba(6,182,212,0.64), #0000 65%)",
    "radial-gradient(1000px 600px at 82% 86%, rgba(236,72,153,0.52), #0000 65%)",
    "linear-gradient(180deg, rgba(56,189,248,0.30) 0%, rgba(139,92,246,0.28) 100%)",
  ].join(", ");

  const baseFilter = "saturate(0.9) brightness(0.98) contrast(1)";
  const revealFilter = "saturate(1.35) brightness(1.1) contrast(1.06)";

  return (
    <>
      {/* Center band (always visible; vibrancy animates) */}
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

      {/* Left band (fades in) */}
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

      {/* Right band (fades in) */}
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

// Accent bar (brand styling)
function AccentBar() {
  return (
    <div className="h-[3px] w-14 rounded-full bg-gradient-to-r from-cyan-300/80 to-violet-400/60" />
  );
}

function BigSection({ title, tagline }: SectionProps) {
  return (
    <section className="relative flex flex-col items-center text-center py-[70vh] md:py-[90vh] px-6">
      <div className="max-w-2xl w-full mx-auto">
        <AccentBar />
        <h2 className="mt-6 text-3xl md:text-5xl font-bold tracking-tight">
          {title}
        </h2>
        {tagline && (
          <p className="mt-3 md:mt-4 text-lg md:text-2xl text-white/80">
            {tagline}
          </p>
        )}
      </div>

      {/* Placeholder for upcoming graphic */}
      <div className="mt-10 w-full max-w-3xl h-56 md:h-72 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-white/50">
        Graphic Placeholder
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
      const top = el.getBoundingClientRect().top;
      setRevealSides(top <= 0);
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
    <section ref={containerRef} className="relative isolate overflow-hidden">
      <GlowBackdrop reveal={revealSides} />

      <BigSection
        title="Clarity when the game feels impossible"
        tagline="Don’t ask why you’re losing — ask how you can win."
      />
      <BigSection
        title="Win the fight before it starts"
        tagline="Time your spikes, pick your battles, make the map play for you."
      />
      <BigSection
        title="Fix the 3 mistakes that matter"
        tagline="High-impact, easy-to-fix habits that unlock fast MMR gains."
      />
      <BigSection
        title="Practice that actually sticks"
        tagline="Simple drills you’ll repeat — not advice you’ll forget."
      />
    </section>
  );
}

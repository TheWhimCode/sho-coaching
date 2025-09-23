"use client";

import React from "react";

type SectionProps = { title: string; tagline?: string };

function GlowBackdrop({ reveal }: { reveal: boolean }) {
  const bgImage =
    "url('/images/coaching/Gradient.svg'), linear-gradient(#05060a, #05060a)";

  return (
    <>
      {/* Full-width gradient BEHIND the stripe (fades IN) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-40 transition-opacity duration-1000 ease-out"
        style={{
          background: bgImage,
          backgroundPosition: "center",
          backgroundSize: "cover",
          opacity: reveal ? 1 : 0,
        }}
      >
        {/* Darkening overlay */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Stripe gradient (clipped) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-30">
        <div className="h-full w-full mx-auto max-w-7xl">
          <div className="h-full w-full mx-auto max-w-6xl px-6">
            <div className="relative h-full w-full overflow-hidden rounded-2xl">
              {/* Gradient background, clipped by rounded container */}
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen"
                style={{
                  background: bgImage,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              >
                {/* Darkening overlay */}
                <div className="absolute inset-0 bg-black/20 rounded-2xl" />
              </div>
              {/* Border + inner shadow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-1000 ease-out"
                style={{
                  border: "1px solid var(--color-divider)",
                  boxShadow:
                    "inset 0 2px 6px rgba(0,0,0,.55), inset 0 0 40px rgba(0,0,0,.6)",
                  opacity: reveal ? 0 : 1,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function BigSection({ title, tagline }: SectionProps) {
  return (
    <section className="relative flex flex-col items-center text-center py-28 md:py-40 px-6">
      <div className="max-w-2xl w-full mx-auto">
        <h2
          className="text-3xl md:text-5xl font-bold tracking-tight"
          style={{
            textShadow:
              "0 1px 3px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)",
          }}
        >
          {title}
        </h2>
        {tagline && (
          <p
            className="mt-3 md:mt-4 text-lg md:text-2xl text-white/80"
            style={{
              textShadow:
                "0 1px 2px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
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
        tagline="A Challenger player can have up to 100% winrate in low elo. So can you."
      />
    </section>
  );
}

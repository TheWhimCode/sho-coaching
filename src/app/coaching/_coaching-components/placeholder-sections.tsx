"use client";

import React from "react";

type SectionProps = {
  title: string;
  tagline?: string;
};

function BigSection({ title, tagline }: SectionProps) {
  return (
    <section className="relative flex flex-col items-center justify-center text-center py-[72vh] md:py-[90vh]">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
        {title}
      </h2>
      {tagline && (
        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl">
          {tagline}
        </p>
      )}
      {/* Large placeholder element below tagline */}
      <div className="w-full max-w-3xl h-64 md:h-96 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-lg text-white/60">
        Large Element Placeholder
      </div>
    </section>
  );
}

export default function PlaceholderSections() {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onScroll = () => {
      const top = el.getBoundingClientRect().top;
      // Trigger fade when section reaches top of viewport
      setActive(top <= 0);
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
    <div ref={rootRef} className="relative isolate overflow-hidden">
      {/* Bright cosmic gradient with fading mask */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 transition-all ease-out"
        style={{
          transitionDuration: "2000ms",
          background: [
            "radial-gradient(1200px 700px at 12% 12%, rgba(56,189,248,0.75), #0000 65%)",
            "radial-gradient(1200px 700px at 88% 18%, rgba(139,92,246,0.65), #0000 65%)",
            "radial-gradient(1000px 600px at 18% 82%, rgba(6,182,212,0.65), #0000 65%)",
            "radial-gradient(1000px 600px at 82% 86%, rgba(236,72,153,0.55), #0000 65%)",
            "linear-gradient(180deg, rgba(56,189,248,0.40) 0%, rgba(139,92,246,0.40) 100%)",
          ].join(", "),
          opacity: 1,
          WebkitMaskImage: "linear-gradient(to right, black 100%, black 100%)",
          maskImage: "linear-gradient(to right, black 100%, black 100%)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          // fade the mask out by animating its opacity
          WebkitMaskComposite: "source-over",
          maskComposite: "intersect",
          transitionProperty: "opacity, -webkit-mask-image, mask-image",
          // opacity handles the fade-out feeling of the mask
          ["--mask-opacity" as any]: active ? 0 : 1,
          WebkitMask: active
            ? "none"
            : "linear-gradient(to right, transparent 0, transparent 20vw, black 20vw, black 80vw, transparent 80vw, transparent 100%)",
          mask: active
            ? "none"
            : "linear-gradient(to right, transparent 0, transparent 20vw, black 20vw, black 80vw, transparent 80vw, transparent 100%)",
        }}
      />

      {/* Three centered tagline + block sections */}
      <BigSection
        title="Section One"
        tagline="This is a bold tagline for the first section."
      />
      <BigSection
        title="Section Two"
        tagline="Another tagline to describe your idea."
      />
      <BigSection
        title="Section Three"
        tagline="A final tagline to inspire action."
      />
    </div>
  );
}

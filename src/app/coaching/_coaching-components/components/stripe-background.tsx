"use client";
import React from "react";

export default function AuroraBackdrop({ className = "" }: { className?: string }) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [p, setP] = React.useState(0); // 0..1 section progress
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([e]) => {
        // progress across viewport height
        const r = e.boundingClientRect;
        const vh = window.innerHeight;
        const start = Math.min(vh, Math.max(0, vh - r.top));
        const end = r.height + vh;
        const prog = Math.min(1, Math.max(0, start / end));
        setP(prog);
        setOn(e.isIntersecting);
      },
      { root: null, threshold: [0, 0.01, 0.5, 1] }
    );

    io.observe(el);
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = Math.min(vh, Math.max(0, vh - r.top));
      const end = r.height + vh;
      setP(Math.min(1, Math.max(0, start / end)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  // map progress -> transforms
  const band1 = {
    translateX: `${-20 + p * 10}%`,
    translateY: `${10 - p * 8}%`,
    rotate: -18 + p * 6,              // degrees
    scale: 1 + p * 0.08,
    opacity: 0.22 + p * 0.1,
  };
  const band2 = {
    translateX: `${10 - p * 8}%`,
    translateY: `${28 - p * 10}%`,
    rotate: -32 + p * 8,
    scale: 1.05 + p * 0.12,
    opacity: 0.16 + p * 0.09,
  };

  return (
    <div ref={wrapRef} className={`absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      {/* soft side fade so it never hard-cuts */}
      <div className="absolute inset-0 pointer-events-none" style={{
        maskImage: "linear-gradient(to right, transparent 0, black 12%, black 88%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0, black 12%, black 88%, transparent 100%)",
      }} />

      {/* band 1 (lightblue) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "140vw",
          height: "40rem",
          transform: `translate(${band1.translateX}, ${band1.translateY}) rotate(${band1.rotate}deg) scale(${band1.scale})`,
          background:
            "linear-gradient(90deg, rgba(96,165,250,0) 0%, rgba(96,165,250,0.6) 50%, rgba(96,165,250,0) 100%)",
          filter: "blur(28px)",
          opacity: band1.opacity,
          mixBlendMode: "screen",
        }}
      />

      {/* band 2 (teal) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "150vw",
          height: "36rem",
          transform: `translate(${band2.translateX}, ${band2.translateY}) rotate(${band2.rotate}deg) scale(${band2.scale})`,
          background:
            "linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(6,182,212,0.55) 50%, rgba(6,182,212,0) 100%)",
          filter: "blur(30px)",
          opacity: band2.opacity,
          mixBlendMode: "screen",
        }}
      />

      {/* optional: panel edge power-on (place above bands, under content) */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl mx-auto"
        style={{
          maxWidth: "72rem", padding: "0 1.5rem",
          opacity: on ? 1 - p * 0.9 : 0,
          transition: "opacity 700ms ease-out",
        }}
      >
        <div className="absolute inset-0 rounded-2xl" style={{
          border: "1px solid var(--color-divider)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.06), 0 0 24px rgba(96,165,250,.16)",
        }} />
      </div>
    </div>
  );
}

"use client";

import React, { useRef, useState, useEffect } from "react";
import CoachingTimeline from "@/app/coaching/_coaching-components/components/Timeline";

export default function Overview({
  className = "",
  containerClassName = "max-w-7xl",
}: { className?: string; containerClassName?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [duration, setDuration] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [hasAutoplayed, setHasAutoplayed] = useState(false);

  const FADE_DURATION = 1;
  const EPS = 0.12;

  const tryPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (v.readyState < 2) v.load();
    v.play().then(() => setHasAutoplayed(true)).catch(() => {});
  };

  // Fade handling
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      const d = isFinite(v.duration) ? v.duration : null;
      setDuration(d);
      setIsFading(false);
    };

    const tick = () => {
      const el = videoRef.current;
      if (!el) return;
      const d = duration ?? el.duration;
      if (d && d > 0) {
        const fadeStart = d - FADE_DURATION;
        if (!isFading && el.currentTime >= fadeStart - EPS) setIsFading(true);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const onPlay = () => {
      setIsFading(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const onPause = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const onEnded = () => {
      setIsFading(true);
      onPause();
    };
    const onSeeked = () => {
      const d = duration ?? v.duration;
      if (d && v.currentTime >= d - FADE_DURATION - EPS) setIsFading(true);
      else setIsFading(false);
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("seeked", onSeeked);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("seeked", onSeeked);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, isFading]);

  // Autoplay once in view
  useEffect(() => {
    const v = videoRef.current;
    const sec = sectionRef.current;
    if (!v || !sec || hasAutoplayed) return;

    const rect = sec.getBoundingClientRect();
    const inView =
      rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
    if (inView) requestAnimationFrame(tryPlay);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAutoplayed) {
            tryPlay();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(sec);

    const once = () => {
      if (!hasAutoplayed) tryPlay();
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("touchstart", once);
    };
    window.addEventListener("pointerdown", once, { passive: true });
    window.addEventListener("touchstart", once, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("touchstart", once);
    };
  }, [hasAutoplayed]);

  return (
    <section className={`relative w-full ${className}`} ref={sectionRef}>
      <div className={`mx-auto w-full ${containerClassName}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 md:items-center">
          {/* LEFT */}
          <div className="md:col-span-6 relative pl-0">
            <div className="relative">
              <h2 className="mt-0 text-[50px] md:text-[64px] leading-tight font-bold">
                What to <span className="text-[#fc8803]">expect</span>
              </h2>
              <p className="mt-3 text-white/70 text-sm md:text-base tracking-wide">
                Every session personalized. Every student unique.
              </p>
            </div>

            <div className="mt-5 max-w-2xl">
              <p className="text-base md:text-lg text-white/80 leading-relaxed">
                Every player has different strengths, weaknesses, and goals — so no two
                sessions ever look the same. Each rank, role, and champion changes what
                matters most, so I shape the coaching around your current level of
                understanding.
              </p>
            </div>
          </div>

          {/* RIGHT — video with angled cutout + strong inner shadow */}
          <div className="md:col-span-6 md:self-center pr-0">
            <div
              className="relative aspect-video overflow-hidden rounded-2xl"
              style={{
                clipPath:
                  "polygon(6% 0, 94% 0, 100% 15%, 100% 85%, 94% 100%, 6% 100%, 0 85%, 0 15%)",
              }}
            >
              {/* Video itself */}
              <video
                ref={videoRef}
                src="/videos/coaching/overview.mp4"
                autoPlay
                muted
                playsInline
                preload="metadata"
                tabIndex={-1}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[500ms] ease-out ${
                  isFading ? "opacity-0" : "opacity-100"
                }`}
                controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Inner shadow overlay (very strong) */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl z-10"
                style={{
                  background: `
                    radial-gradient(100% 140% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.95) 100%),
                    linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.9) 100%),
                    linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.9) 100%)
                  `,
                  boxShadow: `
                    inset 0 0 100px rgba(0,0,0,0.95),
                    inset 0 0 60px rgba(0,0,0,0.9)
                  `,
                  mixBlendMode: "multiply",
                }}
              />

              {/* fade replacement (only after video ends) */}
              <div
                className={`absolute inset-0 z-20 flex items-center justify-center bg-black/30 transition-opacity duration-700 ease-out ${
                  isFading ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <a
                  href="#process"
                  className="rounded-xl bg-[#fc8803] px-6 py-3 text-lg font-semibold text-black shadow-md hover:brightness-95 transition"
                >
                  See the process
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width timeline */}
        <div className="mt-12 md:mt-14">
          <CoachingTimeline />
        </div>
      </div>
    </section>
  );
}

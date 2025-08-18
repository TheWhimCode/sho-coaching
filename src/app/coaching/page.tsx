"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SessionCard from "../components/SessionCard";
import { ROTATE_MS, SLIDE_VARIANTS } from "../components/carousel/constants";
import { SESSIONS, POSTER_SRC, VIDEO_SRC, TINT_BY_SLUG, END_FRAME_SRC } from "../data/sessions";
import Image from "next/image";

const clampIndex = (i: number) => (i + SESSIONS.length) % SESSIONS.length;

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  // carousel state
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverCard, setHoverCard] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // overlay state
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showFinal, setShowFinal] = useState(false); // cross-fade to still before route
  const [hasPushed, setHasPushed] = useState(false); // avoid double route

  // tab/visibility
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(true);


// Prefetch the next session page when overlay opens
useEffect(() => {
  if (!openSlug) return;
  router.prefetch(`/sessions/${openSlug}`);
}, [openSlug, router]);

  // visibility/focus listeners
  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // auto-rotate
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const shouldRun = isVisible && isFocused && !isHovering && !openSlug;
    if (shouldRun) {
      intervalRef.current = setInterval(() => {
        setDirection(1);
        setIndex((i) => i + 1);
      }, ROTATE_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isVisible, isFocused, isHovering, openSlug]);

  // reset overlay flags, preload end-frame & ensure playback when opening
  useEffect(() => {
    if (!openSlug) return;

    setShowFinal(false);
    setHasPushed(false);

    // ✅ preload the dedicated end-frame so the fade has pixels (no black)
    const endSrc = END_FRAME_SRC[openSlug];
    if (endSrc) {
      const img = new window.Image();
      img.src = endSrc;
    }
    

    // ensure clip starts and plays
    const v = videoRef.current;
    try {
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    } catch {}
  }, [openSlug]);

  // close overlay instantly once the URL matches
  useEffect(() => {
    if (openSlug && pathname === `/sessions/${openSlug}`) setOpenSlug(null);
  }, [pathname, openSlug]);

  // keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setHasInteracted(true);
        go(-1);
      }
      if (e.key === "ArrowRight") {
        setHasInteracted(true);
        go(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // reveal the final still ~150ms before end (prevents black frame)
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || hasPushed || !openSlug) return;
    if (v.duration && v.currentTime >= v.duration - 0.15 && !showFinal) {
      setShowFinal(true);
    }
  };

  // once still is visible, push quickly so the next page is already mounting
  useEffect(() => {
    if (!showFinal || !openSlug || hasPushed) return;
    const id = setTimeout(() => {
      setHasPushed(true);
      router.push(`/sessions/${openSlug}`, { scroll: false });
    }, 120);
    return () => clearTimeout(id);
  }, [showFinal, openSlug, hasPushed, router]);

  const go = (dir: -1 | 1) => {
    setHasInteracted(true);
    setDirection(dir);
    setIndex((i) => i + dir);
  };

  const active = SESSIONS[clampIndex(index)];

  return (
    <main
      className="relative min-h-[100dvh] w-full overflow-hidden text-white"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Base image + animated tint */}
      <div className="absolute inset-0 -z-10 bg-[url('/bg/base.jpg')] bg-cover bg-center" />
      <motion.div
        className="absolute inset-0 -z-10 mix-blend-color"
        animate={{ backgroundColor: TINT_BY_SLUG[active.slug] }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ opacity: 0.9 }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/30" />

      <section className="mx-auto flex h-[100dvh] max-w-7xl flex-col items-center justify-center px-4">
        <motion.section
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto h-[100dvh] max-w-7xl flex items-center justify-center px-4"
        >
          <div className="relative flex w-full items-center justify-center overflow-hidden pt-12 pb-20">
            {/* Dots */}
            <div className="absolute top-6 z-30 flex items-center gap-2">
              {SESSIONS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setHasInteracted(true);
                    setDirection(i > clampIndex(index) ? 1 : -1);
                    setIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    clampIndex(index) === i
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Left arrow */}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Previous"
                onClick={() => go(-1)}
                className="group p-2 sm:p-3 text-white/70 hover:text-white transition"
              >
                <svg
                  viewBox="0 0 12 16"
                  className="h-10 sm:h-12 w-auto transition-transform group-hover:-translate-x-0.5"
                >
                  <polyline
                    points="9,1 3,8 9,15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Card */}
              <SessionCard
                session={active}
                poster={
                  hoverCard || openSlug === active.slug
                    ? POSTER_SRC[active.slug]
                    : undefined
                }
                variants={SLIDE_VARIANTS}
                direction={direction}
                onHover={setHoverCard}
                onClick={() => setOpenSlug(active.slug)}
                overlayOpacity={
                  hoverCard || openSlug === active.slug ? 0.6 : 1
                }
              />

              {/* Right arrow */}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Next"
                onClick={() => go(1)}
                className="group p-2 sm:p-3 text-white/70 hover:text-white transition"
              >
                <svg
                  viewBox="0 0 12 16"
                  className="h-10 sm:h-12 w-auto transition-transform group-hover:translate-x-0.5"
                >
                  <polyline
                    points="3,1 9,8 3,15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Helper text */}
            {!hasInteracted && (
              <motion.p
                className="absolute bottom-4 w-full text-center text-3xl md:text-4xl text-white/90 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Choose your preferred coaching session
              </motion.p>
            )}
          </div>
        </motion.section>

        {/* Overlay: video cross-fades to final still, then route */}
        <AnimatePresence>
          {openSlug && (
            <motion.div
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute inset-0 bg-black/60" />
              <motion.div
                layoutId={`card-${openSlug}`}
                className="absolute inset-0 overflow-hidden"
              >
                {/* ✅ use END_FRAME_SRC, not the hover poster */}
                <img
                  src={END_FRAME_SRC[openSlug]}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-200 ${
                    showFinal ? "opacity-100" : "opacity-0"
                  }`}
                  draggable={false}
                />
                {/* Video (over) */}
                <video
                  ref={videoRef}
                  src={VIDEO_SRC[openSlug]}
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-200 ${
                    showFinal ? "opacity-0" : "opacity-100"
                  }`}
                  muted
                  playsInline
                  preload="auto"
                  autoPlay
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setShowFinal(true)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

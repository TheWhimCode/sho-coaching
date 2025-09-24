"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export interface VideoPlayerProps {
  /** The only video we use now */
  analysisSrc: string;
  /** Optional poster; if absent in dev, we capture first frame */
  posterSrc?: string;
  title?: string;
  className?: string;
  /** Notify parent (carousel) to pause/resume while overlay is open */
  onAnalysisOpenChange?: (open: boolean) => void;
}

const SHELL_T = { duration: 0.38, ease: [0.2, 0.8, 0.2, 1] as const };
const CROSSFADE_D = 0.28;

// Dev-only cache for captured first frames
const devPosterCache = new Map<string, string>();

export default function VideoPlayer({
  analysisSrc,
  posterSrc,
  title = "video",
  className,
  onAnalysisOpenChange,
}: VideoPlayerProps) {
  const [mounted, setMounted] = React.useState(false);
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [overlayHost, setOverlayHost] = React.useState<HTMLElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const overlayVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const [effectivePoster, setEffectivePoster] = React.useState<string | undefined>(posterSrc);

  React.useEffect(() => {
    setMounted(true);
    const el = hostRef.current?.closest<HTMLElement>("[data-overlay-root]") ?? null;
    setOverlayHost(el);
  }, []);

  // Prefer provided poster; in dev, capture first frame if missing
  React.useEffect(() => {
    setEffectivePoster(posterSrc);

    if (posterSrc || typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "development") return;

    const cached = devPosterCache.get(analysisSrc);
    if (cached) {
      setEffectivePoster(cached);
      return;
    }

    let cancelled = false;
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");

    const cleanup = () => {
      video.src = "";
      video.removeAttribute("src");
      try { video.load(); } catch {}
    };

    (async () => {
      try {
        video.crossOrigin = "anonymous";
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        video.src = analysisSrc;

        await Promise.race([
          new Promise<void>((resolve) => video.addEventListener("loadeddata", () => resolve(), { once: true })),
          new Promise<void>((resolve) => setTimeout(() => resolve(), 800)), // quick fallback
        ]);

        if (cancelled) return;

        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/webp", 0.8);
          if (!cancelled && dataUrl) {
            devPosterCache.set(analysisSrc, dataUrl);
            setEffectivePoster((prev) => prev ?? dataUrl);
          }
        }
      } catch {
        // ignore
      } finally {
        cleanup();
      }
    })();

    return () => { cancelled = true; cleanup(); };
  }, [analysisSrc, posterSrc]);

  // Inform parent when open/close
  React.useEffect(() => {
    onAnalysisOpenChange?.(open);
  }, [open, onAnalysisOpenChange]);

  // When overlay opens, load & play quickly
  React.useEffect(() => {
    const v = overlayVideoRef.current;
    if (!open || !v) return;
    let cancelled = false;

    const start = async () => {
      try {
        v.load();
        await Promise.race([
          new Promise((res) => v.addEventListener("canplay", res as any, { once: true })),
          new Promise((res) => setTimeout(res, 250)),
        ]);
        if (!cancelled) await v.play().catch(() => {});
      } catch {}
    };

    start();
    return () => { cancelled = true; };
  }, [open]);

  return (
    <div ref={hostRef} className={cn("relative mx-auto w-full max-w-[560px]", className)}>
      {/* Poster-only inline shell (no autoplay teaser) */}
      <motion.div
        layoutId="analysis-shell"
        className="relative overflow-hidden group"
        style={{
          aspectRatio: "1 / 1",
          borderRadius: open ? 16 : "28%",
          transformOrigin: "center",
          willChange: "border-radius, transform, opacity",
        }}
        transition={SHELL_T}
      >
        {effectivePoster && (
          <img
            src={effectivePoster}
            alt={title || "poster"}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        )}

        {/* subtle color wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 25% 20%, rgba(0,130,255,.18), transparent 70%), radial-gradient(60% 60% at 80% 85%, rgba(255,120,40,.14), transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      </motion.div>

      {/* Use your existing Analyse button to open */}
      <div
        className={cn(
          "absolute bottom-6 md:bottom-7",
          "right-[-12px] md:right-[-16px]",
          "ml-4 md:ml-6 pr-3 md:pr-4"
        )}
      >
        <PrimaryCTA onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-xl">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 shrink-0">
            <path fill="currentColor" d="M12 2l2.4 5.8L20 9l-4.6 3.9L16.8 20 12 16.9 7.2 20l1.4-7.1L4 9l5.6-1.2L12 2z" />
          </svg>
          <span>Analyse</span>
        </PrimaryCTA>
      </div>

      {/* Overlay: analysis video plays here */}
      {mounted && overlayHost &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="overlay-stage"
                className="absolute inset-0 z-[100] flex justify-center items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: CROSSFADE_D }}
                onClick={() => setOpen(false)}
              >
                <motion.div
                  layoutId="analysis-shell"
                  onClick={(e) => e.stopPropagation()}
                  className="relative mx-auto w-full h-full overflow-hidden"
                  style={{ borderRadius: 16, transformOrigin: "center" }}
                  transition={SHELL_T}
                >
                  <button
                    type="button"
                    aria-label="Close analysis"
                    onClick={() => setOpen(false)}
                    className="absolute top-4 left-4 z-50 p-2 text-white text-2xl font-bold"
                  >
                    ×
                  </button>

                  <motion.video
                    ref={overlayVideoRef}
                    key={`overlay-${analysisSrc}`}
                    src={analysisSrc}
                    autoPlay
                    muted
                    playsInline
                    loop
                    preload="auto"
                    poster={effectivePoster}
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: CROSSFADE_D }}
                    crossOrigin="anonymous"
                  />

                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(60% 60% at 25% 20%, rgba(0,130,255,.18), transparent 70%), radial-gradient(60% 60% at 80% 85%, rgba(255,120,40,.14), transparent 70%)",
                      mixBlendMode: "screen",
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          overlayHost
        )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export default function Hero({
  hero,
  content,
}: {
  hero: React.ReactNode;
  content?: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    setImagesReady(false);

    const root = rootRef.current;
    if (!root) {
      setImagesReady(true);
      return;
    }

    const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));

    if (images.length === 0) {
      setImagesReady(true);
      return;
    }

    let loaded = 0;
    const cleanup: Array<() => void> = [];

    const checkDone = () => {
      loaded++;
      if (loaded === images.length) {
        cleanup.forEach((fn) => fn());
        setImagesReady(true);
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        checkDone();
        return;
      }

      const onDone = () => checkDone();
      img.addEventListener("load", onDone, { once: true });
      img.addEventListener("error", onDone, { once: true });

      cleanup.push(() => {
        img.removeEventListener("load", onDone);
        img.removeEventListener("error", onDone);
      });
    });

    return () => cleanup.forEach((fn) => fn());
  }, [hero, content]);

  return (
    <div ref={rootRef} className="w-full flex flex-col">
      {/* HERO AREA (always visible for background) */}
      <section
        className="relative w-full min-h-[70vh] flex items-center justify-center pt-6 md:pt-12 pb-6 md:pb-12 -mt-16 md:-mt-20 pt-[calc(1.5rem+4rem)] md:pt-[calc(3rem+5rem)]"
        style={{
          backgroundImage: "url('/skillcheck/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

        {/* Bottom fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: "inset 0 -28px 18px -4px rgba(0,0,0,0.75)",
          }}
        />



        {/* Hero content (gated) */}
        <div
          className="relative w-full max-w-4xl mx-auto flex flex-col items-center p-2 md:p-4"
          style={{
            opacity: imagesReady ? 1 : 0,
            transition: "opacity 150ms ease",
            pointerEvents: imagesReady ? "auto" : "none",
          }}
        >
          {hero}
        </div>
      </section>

      {/* BELOW-HERO CONTENT (gated) */}
      {content && (
        <section
          className="w-full py-6 text-white"
          style={{
            opacity: imagesReady ? 1 : 0,
            transition: "opacity 150ms ease",
            pointerEvents: imagesReady ? "auto" : "none",
          }}
        >
          <div className="w-full sm:max-w-4xl sm:mx-auto px-0 sm:px-6 flex flex-col gap-6">
            {content}
          </div>
        </section>
      )}
    </div>
  );
}

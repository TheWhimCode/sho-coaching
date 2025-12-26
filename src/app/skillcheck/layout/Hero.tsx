"use client";

import { useRef } from "react";

export default function Hero({
  hero,
  content,
}: {
  hero: React.ReactNode;
  content?: React.ReactNode;
}) {
  const resultRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-full flex flex-col">
      {/* HERO AREA */}
      <section
        className="relative w-full min-h-[70vh] flex items-center justify-center pt-6 md:pt-12 pb-6 md:pb-12"
        style={{
          backgroundImage: "url('/skillcheck/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Bottom fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow:
              "inset 0 -28px 18px -4px rgba(0,0,0,0.75)",
          }}
        />

        {/* Hero content */}
        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center p-4">
          {hero}
        </div>
      </section>

      {/* BELOW-HERO CONTENT (multiple choice / result) */}
      {content && (
        <section
          ref={resultRef}
          className="w-full py-6 text-white"
        >
          <div className="max-w-3xl mx-auto px-6 flex flex-col gap-6">
            {content}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { useRef } from "react";

export default function MainSection({
  main,
  secondary,
}: {
  main: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  const resultRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-full flex flex-col">
      <div
        className="relative w-full flex justify-center pt-6 md:pt-12 pb-6 md:pb-12"
        style={{
          backgroundImage: "url('/skillcheck/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: "inset 0 -28px 18px -4px rgba(0,0,0,0.75)",
          }}
        />

        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center p-4">
          {main}
        </div>
      </div>

      {secondary && <div ref={resultRef}>{secondary}</div>}
    </div>
  );
}

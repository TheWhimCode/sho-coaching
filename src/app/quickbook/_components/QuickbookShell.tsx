"use client";

import * as React from "react";
import QuickbookBackground from "./QuickbookBackground";

type Props = {
  children: React.ReactNode;
};

export default function QuickbookShell({ children }: Props) {
  return (
    <div className="relative isolate min-h-[100svh] supports-[height:100dvh]:min-h-dvh w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-black/20" />

      <div className="absolute inset-0 -z-10 pointer-events-none">
        <QuickbookBackground />
      </div>

      <div className="relative z-10 min-h-[100svh] supports-[height:100dvh]:min-h-dvh w-full grid place-items-center">
        <div
          className="
            relative w-[100vw] md:w-[92vw] max-w-[1200px]
            h-[92svh] supports-[height:100dvh]:h-dvh
            md:h-[88vh]
            rounded-2xl overflow-hidden
            flex flex-col
            shadow-[0_20px_80px_-20px_rgba(0,0,0,.6)]
            ring-1 ring-[rgba(146,180,255,.18)]
            bg-[rgba(12,22,44,.1)]
            [background-image:linear-gradient(180deg,rgba(99,102,241,.12),transparent)]
            supports-[backdrop-filter]:backdrop-saturate-50
            supports-[backdrop-filter]:backdrop-contrast-125
            transform-gpu
            [backface-visibility:hidden]
            [will-change:backdrop-filter]
          "
          style={{ WebkitTransform: "translateZ(0)" }}
        >
          {/* Fixed header */}
          <div className="px-6 pt-5 pb-3">
            <div className="text-[14px] uppercase tracking-[0.18em] text-white/60">
              Schedule your session
            </div>
          </div>

          {/* Body */}
<div className="relative flex-1 min-h-0 flex flex-col">{children}</div>        </div>
      </div>
    </div>
  );
}
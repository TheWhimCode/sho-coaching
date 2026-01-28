// app/skillcheck/components/Resultscreen.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import GlassPanel from "@/app/_components/panels/GlassPanel";

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

export default function ResultsScreen({
  avgAttempts,
  header,
  children,
  cta,
}: {
  avgAttempts: string;
  header?: ReactNode;
  children?: ReactNode;
  cta?: ReactNode;
}) {
  /* -----------------------------
     difficulty
  ----------------------------- */

  const difficulty = useMemo(() => {
    const avg = Number(avgAttempts);

    return avg <= 1.5
      ? { label: "Easy", color: "border-green-400/40 text-green-400" }
      : avg <= 2.0
      ? { label: "Tricky", color: "border-blue-500/40 text-blue-500" }
      : avg <= 2.5
      ? { label: "Hard", color: "border-orange-400/40 text-orange-400" }
      : { label: "Nightmare", color: "border-red-700/50 text-red-700" };
  }, [avgAttempts]);

  /* -----------------------------
     countdown (HH:MM:SS)
  ----------------------------- */

  const [timeLeft, setTimeLeft] = useState("00:00:00");

  useEffect(() => {
    function update() {
      const now = new Date();
      const next = new Date();
      next.setUTCHours(24, 0, 0, 0);

      let diff = Math.max(0, next.getTime() - now.getTime());

      const h = Math.floor(diff / 36e5);
      diff %= 36e5;
      const m = Math.floor(diff / 6e4);
      diff %= 6e4;
      const s = Math.floor(diff / 1000);

      const pad = (n: number) => String(n).padStart(2, "0");
      setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative z-10 w-full sm:max-w-4xl sm:mx-auto px-0 sm:px-6">
      <GlassPanel
        className="
          mt-12
          min-h-[80vh]
          py-6 px-3 md:p-10
          !ring-0
          border border-[rgba(146,180,255,.18)]
        "
      >
        <div className="max-w-4xl mx-auto flex flex-col">
          {/* HEADER (provided by game) */}
          {header && (
            <div
              className="text-3xl md:text-4xl font-semibold text-white mb-4"
              style={{ textShadow: HEAVY_TEXT_SHADOW }}
            >
              {header}
            </div>
          )}

          {/* MAIN CONTENT (provided by game) */}
          {children}

          {/* STATS (always) */}
          <div className="mt-12 flex justify-center">
            <div
              className={`
                w-full max-w-[320px]
                px-4 py-3
                rounded-lg
                border
                text-md
                flex items-center justify-center gap-2
                ${difficulty.color}
              `}
            >
              <span>Average attempts:</span>
              <span className="text-white font-semibold">{avgAttempts}</span>
              <span className="opacity-60">•</span>
              <span className="font-black">{difficulty.label}</span>
            </div>
          </div>

          {/* CTA (provided by game) */}
          {cta && <div className="mt-12 hidden sm:flex justify-center">{cta}</div>}

          {/* COUNTDOWN (always) */}
          <div className="mt-12 text-center">
            <div className="text-md uppercase tracking-wide text-gray-400 mb-2">
              Come back tomorrow for another puzzle
            </div>

            <div
              className="
                text-6xl md:text-7xl font-mono font-semibold
                bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400
                bg-clip-text text-transparent
              "
            >
              {timeLeft}
            </div>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}

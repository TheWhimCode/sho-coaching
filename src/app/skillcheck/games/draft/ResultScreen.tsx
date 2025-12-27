"use client";

import { useEffect, useState } from "react";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import {
  champSquareUrlById,
  resolveChampionId,
} from "@/lib/league/datadragon";

type DraftAnswer = {
  champ: string;
  explanation: string;
  correct?: true;
};

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

export function ResultScreen({
  answers,
  avgAttempts,
  onCreateDraft,
}: {
  answers: DraftAnswer[];
  avgAttempts: string;
  onCreateDraft?: (initialStep: "setup" | "success") => void;
}) {
  const correct = answers.find((a) => a.correct);

  /* -----------------------------
     difficulty
  ----------------------------- */

  const avg = Number(avgAttempts);

  const difficulty =
    avg <= 1.4
      ? { label: "Easy", color: "border-green-400/40 text-green-400" }
      : avg <= 2.0
      ? { label: "Tricky", color: "border-blue-500/40 text-blue-500" }
      : avg <= 2.6
      ? { label: "Hard", color: "border-orange-400/40 text-orange-400" }
      : { label: "Nightmare", color: "border-red-700/50 text-red-700" };

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
          {/* HEADER */}
          <h3
            className="text-3xl md:text-4xl font-semibold text-white mb-4"
            style={{ textShadow: HEAVY_TEXT_SHADOW }}
          >
            Why {correct?.champ}?
          </h3>

          {/* ANSWERS */}
          <div className="flex flex-col gap-2 md:gap-4">
            {answers.map((a) => {
              const src = champSquareUrlById(
                resolveChampionId(a.champ)
              );

              return (
                <div
                  key={a.champ}
                  className={[
                    "flex items-center gap-4 p-4 rounded-lg transition-colors",
                    a.correct
                      ? "bg-white/10 ring-1 ring-green-400/40"
                      : "bg-white/5",
                  ].join(" ")}
                >
                  <img
                    src={src}
                    alt={a.champ}
                    className="
                      w-14 h-14 rounded-lg
                      object-cover
                      flex-shrink-0
                    "
                  />

                  <p className="text-md text-gray-200 leading-relaxed">
                    {a.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          {/* STATS */}
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

          {/* CTA */}
          {onCreateDraft && (
            <div className="mt-12 hidden sm:flex justify-center">
              <PrimaryCTA
                className="px-10 py-4 text-lg w-full max-w-[320px]"
                onClick={async () => {
                  const res = await fetch(
                    "/api/skillcheck/db/draftExists"
                  );

                  const data = await res.json();

                  if (data?.exists) {
                    onCreateDraft("success");
                  } else {
                    onCreateDraft("setup");
                  }
                }}
              >
                Make your own draft
              </PrimaryCTA>
            </div>
          )}

          {/* COUNTDOWN */}
          <div className="mt-12 text-center">
            <div className="text-md uppercase tracking-wide text-gray-400 mb-2">
              Come back tomorrow for a new draft
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

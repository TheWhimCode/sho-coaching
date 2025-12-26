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

export function ResultScreen({
  answers,
  avgAttempts,
  onCreateDraft,
}: {
  answers: DraftAnswer[];
  avgAttempts: string;
  onCreateDraft?: () => void;
}) {
  const correct = answers.find((a) => a.correct);

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
    <section className="relative z-10 mx-auto max-w-4xl px-6">
      <GlassPanel
        className="
          mt-12
          min-h-[80vh]
          p-6 md:p-10
          !ring-0
          border border-[rgba(146,180,255,.18)]
        "
      >
        <div className="max-w-4xl mx-auto flex flex-col">
          {/* HEADER */}
          <h3 className="text-2xl md:text-3xl font-semibold text-white mb-10">
            Why {correct?.champ}?
          </h3>

          {/* ANSWERS */}
          <div className="flex flex-col gap-6">
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

                  <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                    {a.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          {/* STATS */}
          <div className="mt-10 flex justify-center">
            <div className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
              Average attempts to solve
              <span className="ml-2 text-white font-semibold">
                {avgAttempts}
              </span>
            </div>
          </div>

          {/* CTA */}
          {onCreateDraft && (
            <div className="mt-12 flex justify-center">
              <PrimaryCTA
                onClick={onCreateDraft}
                className="px-10 py-4 text-lg"
              >
                Make your own draft
              </PrimaryCTA>
            </div>
          )}

          {/* COUNTDOWN */}
          <div className="mt-12 text-center">
            <div className="text-sm uppercase tracking-wide text-gray-400 mb-2">
              Come back tomorrow for a new draft
            </div>

            <div
              className="
                text-5xl md:text-6xl font-mono font-semibold
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

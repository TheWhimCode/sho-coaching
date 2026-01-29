"use client";

import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import ResultsScreen, { DifficultyUI } from "@/app/skillcheck/components/ResultScreen";
import { champSquareUrlById, resolveChampionId } from "@/lib/league/datadragon";

type DraftAnswer = {
  champ: string;
  explanation: string;
  correct?: true;
};

function getDraftDifficulty(avgAttempts: string): DifficultyUI {
  const avg = Number(avgAttempts);

  // optional safety: handle NaN
  if (!Number.isFinite(avg)) {
    return { label: "—", color: "border-white/20 text-white/60" };
  }

  return avg <= 1.5
    ? { label: "Easy", color: "border-green-400/40 text-green-400" }
    : avg <= 2.0
    ? { label: "Tricky", color: "border-blue-500/40 text-blue-500" }
    : avg <= 2.5
    ? { label: "Hard", color: "border-orange-400/40 text-orange-400" }
    : { label: "Nightmare", color: "border-red-700/50 text-red-700" };
}

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
  const difficulty = getDraftDifficulty(avgAttempts);

  return (
    <ResultsScreen
      avgAttempts={avgAttempts}
      difficulty={difficulty}
      header={
        <>
          Why <span className="whitespace-nowrap">{correct?.champ}</span>?
        </>
      }
      cta={
        onCreateDraft ? (
              <div className="mb-8">

          <PrimaryCTA
            className="px-10 py-4 text-lg w-full max-w-[320px]"
            onClick={async () => {
              const res = await fetch("/api/skillcheck/draft/draftExists");
              const data = await res.json();

              if (data?.exists) onCreateDraft("success");
              else onCreateDraft("setup");
            }}
          >
            Make your own draft
          </PrimaryCTA>
              </div>

        ) : null
      }
    >
      {/* ANSWERS (draft-specific content) */}
      <div className="flex flex-col gap-2 md:gap-4">
        {answers.map((a) => {
          const src = champSquareUrlById(resolveChampionId(a.champ));

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
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />

              <p className="text-md text-gray-200 leading-relaxed">
                {a.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </ResultsScreen>
  );
}

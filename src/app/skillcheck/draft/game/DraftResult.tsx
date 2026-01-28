"use client";

import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import ResultsScreen from "@/app/skillcheck/components/ResultScreen";
import { champSquareUrlById, resolveChampionId } from "@/lib/league/datadragon";

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
  onCreateDraft?: (initialStep: "setup" | "success") => void;
}) {
  const correct = answers.find((a) => a.correct);

  return (
    <ResultsScreen
      avgAttempts={avgAttempts}
      header={
        <>
          Why <span className="whitespace-nowrap">{correct?.champ}</span>?
        </>
      }
      cta={
        onCreateDraft ? (
          <PrimaryCTA
            className="px-10 py-4 text-lg w-full max-w-[320px]"
            onClick={async () => {
              const res = await fetch("/api/skillcheck/db/draftExists");
              const data = await res.json();

              if (data?.exists) onCreateDraft("success");
              else onCreateDraft("setup");
            }}
          >
            Make your own draft
          </PrimaryCTA>
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

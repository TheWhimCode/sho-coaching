"use client";

import MultipleChoiceLayout from "@/app/skillcheck/layout/MultipleChoice";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import { champSquareUrlById, resolveChampionId } from "@/lib/league/datadragon";

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

export default function ChampOptions({
  question,
  answers,
  selected,
  locked,
  correctAnswer,
  attempts,
  disabledAnswers,
  lastWrong,
  onSelect,
  onLock,
}: {
  question?: string;
  answers: string[];
  selected: string | null;
  locked: boolean;
  correctAnswer: string;
  attempts: number;
  disabledAnswers: string[];
  lastWrong: string | null;
  onSelect: (answer: string) => void;
  onLock: () => void;
}) {
  const shakeCTA = !!lastWrong;

  return (
    <MultipleChoiceLayout>
      {question && (
        <div className="w-full text-center">
          <h2
            className="text-3xl font-semibold text-gray-200"
            style={{ textShadow: HEAVY_TEXT_SHADOW }}
          >
            {question}
          </h2>
        </div>
      )}

      <div className="inline-flex flex-row items-center mx-auto">
        <div className="flex flex-row gap-4">
          {answers.map((a) => {
            const src = champSquareUrlById(resolveChampionId(a));

            const isSelected = selected === a;
            const isDisabled = disabledAnswers.includes(a);
            const isWrong = lastWrong === a;
            const isCorrect = locked && a === correctAnswer;

            return (
              <button
                key={a}
                onClick={() => onSelect(a)}
                disabled={locked || isDisabled}
                className={[
                  "relative w-16 h-16 rounded-lg overflow-hidden transition-all duration-200",
                  !locked && !isDisabled ? "hover:scale-105" : "",
                  isSelected && !locked ? "ring-1 ring-blue-300" : "",
                  isCorrect ? "ring-2 ring-green-500 scale-105" : "",
                  isDisabled && !isCorrect ? "ring-2 ring-red-500" : "",
                  isWrong ? "animate-shake" : "",
                  isDisabled ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <div className="relative w-full h-full">
                  <img
                    src={src}
                    alt={a}
                    className={[
                      "w-full h-full object-cover transition-opacity",
                      isDisabled ? "opacity-40 grayscale" : "",
                    ].join(" ")}
                  />

                  {isDisabled && !isCorrect && (
                    <div className="absolute inset-0">
                      <div
                        className="
                          absolute top-1/2 left-1/2
                          w-[140%] h-[2px]
                          bg-red-500
                          -translate-x-1/2 -translate-y-1/2
                          -rotate-45
                        "
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative ml-6">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-bold whitespace-nowrap">
            Attempts: {attempts}
          </div>

          <PrimaryCTA
            key={lastWrong ?? "idle"}
            disabled={!selected || locked}
            onClick={onLock}
            className={[
              "px-6 py-2 min-w-[130px]",
              shakeCTA ? "animate-shake" : "",
            ].join(" ")}
          >
            {locked ? "Locked In" : "Lock In"}
          </PrimaryCTA>
        </div>
      </div>
    </MultipleChoiceLayout>
  );
}

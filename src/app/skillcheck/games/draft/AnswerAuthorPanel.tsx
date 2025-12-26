"use client";

import { useState } from "react";
import {
  champSquareUrlById,
  resolveChampionId,
} from "@/lib/league/datadragon";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";

type Answer = {
  champ: string;
  explanation: string;
  correct?: true;
};

export default function AnswerAuthorPanel({
  value,
  onChange,
  onSubmit,
}: {
  value: Answer[];
  onChange: (answers: Answer[]) => void;
  onSubmit: () => void;
}) {
  function update(i: number, patch: Partial<Answer>) {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  function setCorrect(i: number) {
    onChange(
      value.map((a, idx) =>
        idx === i
          ? { ...a, correct: true }
          : { ...a, correct: undefined }
      )
    );
  }

  const canSubmit =
    value.length === 3 &&
    value.every((a) => a.champ && a.explanation.trim()) &&
    value.some((a) => a.correct);

  return (
    <div className="max-w-3xl mx-auto mt-12 flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-white text-center">
        Create answer options
      </h2>

      {value.map((a, i) => (
        <div
          key={i}
          className="flex gap-4 items-start p-4 rounded-lg bg-white/5 border border-white/10"
        >
          {/* CHAMP INPUT */}
          <div className="flex flex-col items-center gap-2">
            {a.champ ? (
              <img
                src={champSquareUrlById(
                  resolveChampionId(a.champ)
                )}
                alt={a.champ}
                className="w-14 h-14 rounded-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-800" />
            )}

            <input
              placeholder="Champion"
              value={a.champ}
              onChange={(e) =>
                update(i, { champ: e.target.value })
              }
              className="w-28 px-2 py-1 text-sm bg-black/40 text-white rounded"
            />
          </div>

          {/* EXPLANATION */}
          <textarea
            placeholder="Explanation…"
            value={a.explanation}
            onChange={(e) =>
              update(i, { explanation: e.target.value })
            }
            className="flex-1 min-h-[80px] px-3 py-2 text-sm bg-black/40 text-white rounded resize-none"
          />

          {/* CORRECT */}
          <button
            onClick={() => setCorrect(i)}
            className={[
              "px-3 py-2 rounded text-sm",
              a.correct
                ? "bg-green-500/20 text-green-300 ring-1 ring-green-400"
                : "bg-white/5 text-gray-300",
            ].join(" ")}
          >
            Correct
          </button>
        </div>
      ))}

      <div className="flex justify-center mt-4">
        <PrimaryCTA
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          Save Draft (Pending)
        </PrimaryCTA>
      </div>
    </div>
  );
}

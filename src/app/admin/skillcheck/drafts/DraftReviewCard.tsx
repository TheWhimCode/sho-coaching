"use client";

import { useState, useEffect } from "react";
import { DraftGrid } from "@/app/skillcheck/draft/DraftGrid";
import { TeamSlot } from "@/app/skillcheck/draft/DraftTeam";
import AnswerAuthorPanel from "@/app/admin/skillcheck/drafts/AnswerAuthorPanel";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";

import {
  champSquareUrlById,
  resolveChampionId,
} from "@/lib/datadragon";

type Answer = {
  champ: string;
  explanation: string;
  correct?: true;
};

function champUrl(input: string | null | undefined) {
  if (!input) return null;
  return champSquareUrlById(resolveChampionId(input));
}

/* -------------------------------------------
   Build answers with DB-correct answer prefilled
-------------------------------------------- */
function buildInitialAnswersFromDraft(draft: any): Answer[] {
  const correctFromDb =
    draft.answers?.find((a: any) => a.correct)?.champ ??
    null;

  const size = 3;
  const answers: Answer[] = Array.from({ length: size }, () => ({
    champ: "",
    explanation: "",
  }));

  if (!correctFromDb) {
    // no correct answer yet → leave all empty
    return answers;
  }

  const index = Math.floor(Math.random() * size);

  answers[index] = {
    champ: correctFromDb,
    explanation:
      draft.answers?.find((a: any) => a.correct)?.explanation ?? "",
    correct: true,
  };

  return answers;
}

/* -------------------------------------------
   Draft preview helpers
-------------------------------------------- */
function buildTeamSlots(
  team: any[],
  solutionRole: string,
  isUserTeam: boolean,
  side: "blue" | "red"
): TeamSlot[] {
  return team.map((p: any) => {
    const isSolution = isUserTeam && p.role === solutionRole;

    return {
      champ: champUrl(p.champ),
      role: p.role,
      side,
      state: isSolution
        ? "solution"
        : p.champ
        ? "filled"
        : "empty",
    };
  });
}

export default function DraftReviewCard({
  draft,
  onDone,
}: {
  draft: any;
  onDone: () => void;
}) {
  const [answers, setAnswers] = useState<Answer[]>(() =>
    buildInitialAnswersFromDraft(draft)
  );
  const [madeBy, setMadeBy] = useState<string>(draft.madeBy ?? "");

  useEffect(() => {
    setMadeBy(draft.madeBy ?? "");
  }, [draft.id, draft.madeBy]);

  const blueSlots = buildTeamSlots(
    draft.blue,
    draft.role,
    draft.userTeam === "blue",
    "blue"
  );

  const redSlots = buildTeamSlots(
    draft.red,
    draft.role,
    draft.userTeam === "red",
    "red"
  );

  async function submit(status: "APPROVED" | "REJECTED") {
    await fetch("/api/admin/skillcheck/drafts/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: draft.id,
        status,
        answers,
        madeBy: status === "APPROVED" ? (madeBy.trim() || null) : undefined,
      }),
    });

    onDone();
  }

  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
      {/* DRAFT PREVIEW */}
      <DraftGrid blue={blueSlots} red={redSlots} />

      {/* ANSWERS */}
      <AnswerAuthorPanel
        value={answers}
        onChange={setAnswers}
      />

      {/* MADE BY (shown in daily game when set) */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Draft made by (optional)
        </label>
        <input
          type="text"
          value={madeBy}
          onChange={(e) => setMadeBy(e.target.value)}
          placeholder="e.g. StreamerName, Coach Y"
          className="w-full max-w-md bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <p className="text-xs text-white/50 mt-1">
          Shown as a badge in the daily draft game. Leave empty to hide.
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-center gap-6 mt-8">
        <PrimaryCTA
          className="px-8 py-3 text-lg bg-green-600"
          onClick={() => submit("APPROVED")}
        >
          Approve
        </PrimaryCTA>

        <PrimaryCTA
          className="px-8 py-3 text-lg bg-red-600"
          onClick={() => submit("REJECTED")}
        >
          Reject
        </PrimaryCTA>
      </div>
    </div>
  );
}

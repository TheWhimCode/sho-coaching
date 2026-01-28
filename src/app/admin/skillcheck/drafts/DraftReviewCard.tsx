"use client";

import { useState } from "react";
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
  isUserTeam: boolean
): TeamSlot[] {
  return team.map((p: any) => {
    const isSolution = isUserTeam && p.role === solutionRole;

    return {
      champ: champUrl(p.champ),
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

  const blueSlots = buildTeamSlots(
    draft.blue,
    draft.role,
    draft.userTeam === "blue"
  );

  const redSlots = buildTeamSlots(
    draft.red,
    draft.role,
    draft.userTeam === "red"
  );

  async function submit(status: "APPROVED" | "REJECTED") {
    await fetch("/api/admin/skillcheck/drafts/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: draft.id,
        status,
        answers,
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

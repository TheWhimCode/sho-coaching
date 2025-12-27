"use client";

import { useState } from "react";
import { DraftOverlay } from "@/app/skillcheck/games/draft/DraftOverlay";
import AnswerAuthorPanel from "@/app/skillcheck/games/draft/AnswerAuthorPanel";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";

type Answer = {
  champ: string;
  explanation: string;
  correct?: true;
};

function buildInitialAnswers(solutionChamp: string): Answer[] {
  const index = Math.floor(Math.random() * 3);

  const answers: Answer[] = Array.from({ length: 3 }, () => ({
    champ: "",
    explanation: "",
  }));

  answers[index] = {
    champ: solutionChamp,
    explanation: "",
    correct: true,
  };

  return answers;
}

export default function DraftReviewCard({
  draft,
  onDone,
}: {
  draft: any;
  onDone: () => void;
}) {
  const solutionTeam =
    draft.userTeam === "blue" ? draft.blue : draft.red;

  const solutionSlot = solutionTeam.find(
    (p: any) => p.role === draft.role
  );

  const solutionChamp = solutionSlot?.champ;

  const [answers, setAnswers] = useState<Answer[]>(() =>
    buildInitialAnswers(solutionChamp)
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
      <DraftOverlay
        blue={draft.blue}
        red={draft.red}
        role={draft.role}
        userTeam={draft.userTeam}
        solutionChamp={solutionChamp}
        locked
      />

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

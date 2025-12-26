"use client";

import { useState } from "react";
import { DraftOverlay } from "@/app/skillcheck/games/draft/DraftOverlay";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import ChampSelectPanel from "./ChampSelectPanel";
import AnswerAuthorPanel from "./AnswerAuthorPanel";

type Role = "top" | "jng" | "mid" | "adc" | "sup";
type Side = "blue" | "red";

type Pick = {
  role: Role;
  champ: string | null;
};

type ActiveSlot = {
  side: Side;
  index: number;
} | null;

type DraftAnswer = {
  champ: string;
  explanation: string;
  correct?: true;
};

export default function DraftAuthorMain() {
  const [role] = useState<Role>("mid");       // gameplay only, ignored in authoring
  const [userTeam] = useState<Side>("blue");  // gameplay only, ignored in authoring

  const [blue, setBlue] = useState<Pick[]>([
    { role: "jng", champ: null },
    { role: "adc", champ: null },
    { role: "sup", champ: null },
    { role: "mid", champ: null },
    { role: "top", champ: null },
  ]);

  const [red, setRed] = useState<Pick[]>([
    { role: "jng", champ: null },
    { role: "adc", champ: null },
    { role: "sup", champ: null },
    { role: "mid", champ: null },
    { role: "top", champ: null },
  ]);

  // ✅ start at top-left
  const [activeSlot, setActiveSlot] =
    useState<ActiveSlot>({
      side: "blue",
      index: 0,
    });

  const [previewChamp, setPreviewChamp] =
    useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const [step, setStep] =
    useState<"draft" | "answers">("draft");

  const [answers, setAnswers] =
    useState<DraftAnswer[]>([
      { champ: "", explanation: "", correct: true },
      { champ: "", explanation: "" },
      { champ: "", explanation: "" },
    ]);

  /* -----------------------------
     CHAMP ASSIGNMENT
  ----------------------------- */

  function assignChampion(champ: string | null) {
    if (!activeSlot || locked) return;

    const { side, index } = activeSlot;
    const team = side === "blue" ? blue : red;
    const setTeam = side === "blue" ? setBlue : setRed;

    const updated = [...team];
    updated[index] = {
      ...updated[index],
      champ,
    };

    setTeam(updated);
    setPreviewChamp(null);

    if (!champ) return;

    // auto-advance within same side
    if (index + 1 < team.length) {
      setActiveSlot({ side, index: index + 1 });
    }
  }

  /* -----------------------------
     REORDERING (MUTATES ARRAY)
  ----------------------------- */

  function moveRole(
    side: Side,
    index: number,
    dir: -1 | 1
  ) {
    const team = side === "blue" ? blue : red;
    const setTeam = side === "blue" ? setBlue : setRed;

    const next = index + dir;
    if (next < 0 || next >= team.length) return;

    const updated = [...team];
    [updated[index], updated[next]] =
      [updated[next], updated[index]];

    setTeam(updated);
    setActiveSlot({ side, index: next });
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* DRAFT OVERLAY */}
      <DraftOverlay
        blue={blue}
        red={red}
        role={role}
        userTeam={userTeam}
        previewChamp={previewChamp}
        locked={locked}
        authoring
        activeSlot={activeSlot}
        onMoveRole={moveRole}
        onSlotClick={(side, index) =>
          !locked && setActiveSlot({ side, index })
        }
        center={
          !locked && step === "draft" ? (
            <ChampSelectPanel
              onHover={setPreviewChamp}
              onSelect={assignChampion}
            />
          ) : null
        }
      />

      {/* CONTROLS */}
      <div className="flex gap-4">
        <PrimaryCTA
          disabled={locked}
          onClick={() => {
            setLocked(true);
            setStep("answers");
          }}
        >
          Lock Draft
        </PrimaryCTA>

        {locked && (
          <PrimaryCTA
            onClick={() => {
              setLocked(false);
              setStep("draft");
              setActiveSlot({ side: "blue", index: 0 });
            }}
          >
            Unlock
          </PrimaryCTA>
        )}
      </div>

      {/* ANSWER AUTHORING */}
      {step === "answers" && (
        <AnswerAuthorPanel
          value={answers}
          onChange={setAnswers}
          onSubmit={async () => {
            const payload = {
              role,
              userTeam,
              blue,
              red,
              answers,
            };

            const res = await fetch(
              "/api/skillcheck/db/draft",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              }
            );

            if (!res.ok) {
              console.error("Failed to save draft");
              return;
            }

            const data = await res.json();
            console.log("Draft saved", data);
          }}
        />
      )}
    </div>
  );
}

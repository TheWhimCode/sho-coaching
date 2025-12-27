"use client";

import { useEffect, useState } from "react";
import { DraftOverlay } from "@/app/skillcheck/games/draft/DraftOverlay";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import OutlineCTA from "@/app/_components/small/buttons/OutlineCTA";
import ChampSelectPanel from "./ChampSelectPanel";
import DraftSetupStep, {
  DraftSetup,
} from "./DraftSetupStep";

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

type Step = "setup" | "draft" | "success";

const EMPTY_TEAM: Pick[] = [
  { role: "jng", champ: null },
  { role: "adc", champ: null },
  { role: "sup", champ: null },
  { role: "mid", champ: null },
  { role: "top", champ: null },
];

export default function DraftAuthorMain({
  initialStep = "setup",
}: {
  initialStep?: Step;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [setup, setSetup] =
    useState<DraftSetup | null>(null);

  const role = setup?.role ?? "mid";
  const userTeam = setup?.side ?? "blue";

  const [blue, setBlue] =
    useState<Pick[]>(EMPTY_TEAM);
  const [red, setRed] =
    useState<Pick[]>(EMPTY_TEAM);

  const [activeSlot, setActiveSlot] =
    useState<ActiveSlot>(null);

  const [previewChamp, setPreviewChamp] =
    useState<string | null>(null);

  const [locked, setLocked] = useState(false);

  /* reset draft when setup changes */
  useEffect(() => {
    if (!setup) return;

    setBlue(EMPTY_TEAM);
    setRed(EMPTY_TEAM);
    setActiveSlot({ side: setup.side, index: 0 });
    setLocked(false);
  }, [setup?.side, setup?.role, setup?.mainChamp]);

  /* auto-fill solution champ */
  useEffect(() => {
    if (!setup) return;

    const team = setup.side === "blue" ? blue : red;
    const setTeam = setup.side === "blue" ? setBlue : setRed;

    const index = team.findIndex(
      (p) => p.role === setup.role
    );

    if (index === -1 || team[index].champ) return;

    const next = [...team];
    next[index] = {
      ...next[index],
      champ: setup.mainChamp,
    };

    setTeam(next);
  }, [setup, blue, red]);

  const usedChamps = [
    setup?.mainChamp,
    ...blue.map((p) => p.champ),
    ...red.map((p) => p.champ),
  ].filter(Boolean) as string[];

  function assignChampion(champ: string | null) {
    if (!activeSlot || locked || !setup) return;

    const { side, index } = activeSlot;
    const team = side === "blue" ? blue : red;
    const setTeam = side === "blue" ? setBlue : setRed;

    const isSolutionSlot =
      side === setup.side &&
      team[index].role === setup.role;

    if (isSolutionSlot) return;

    const next = [...team];
    next[index] = { ...next[index], champ };

    setTeam(next);
    setPreviewChamp(null);

    if (champ && index + 1 < team.length) {
      setActiveSlot({ side, index: index + 1 });
    }
  }

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

  /* --------------------------------
     SUCCESS SHORT-CIRCUIT
  -------------------------------- */

  if (step === "success" && !setup) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-center text-white">
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            Draft already submitted 🎉
          </h2>
          <p className="text-white/70">
            You can submit a new draft tomorrow.
          </p>
        </div>
      </div>
    );
  }

  /* STEP 0 */
  if (step === "setup") {
    return (
      <DraftSetupStep
        value={setup}
        onComplete={(data) => {
          setSetup(data);
          setStep("draft");
        }}
      />
    );
  }

  /* STEP 1 + 2 */
  return (
    <div className="flex flex-col items-center gap-8">
      <DraftOverlay
        blue={blue}
        red={red}
        role={role}
        userTeam={userTeam}
        solutionChamp={setup?.mainChamp ?? ""}
        previewChamp={previewChamp}
        locked={locked}
        authoring
        activeSlot={activeSlot}
        onMoveRole={moveRole}
        onSlotClick={(side, index) =>
          !locked && setActiveSlot({ side, index })
        }
        center={
          step === "draft" ? (
            <ChampSelectPanel
              onHover={setPreviewChamp}
              onSelect={assignChampion}
              disabledChamps={usedChamps}
            />
          ) : (
            <div className="text-center text-white">
              <h2 className="text-2xl font-semibold mb-2">
                Draft submitted 🎉
              </h2>
              <p className="text-white/70">
                Your draft is now awaiting approval.
              </p>
            </div>
          )
        }
      />

      {step === "draft" && (
        <div className="flex gap-4">
          <OutlineCTA
            className="px-8 py-3 text-lg"
            onClick={() => {
              setLocked(false);
              setStep("setup");
            }}
          >
            Back
          </OutlineCTA>

          <PrimaryCTA
            className="px-8 py-3 text-lg"
            onClick={async () => {
              setLocked(true);

              await fetch("/api/skillcheck/db/draft", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  role: setup!.role,
                  userTeam: setup!.side,
                  blue,
                  red,
                  answers: [
                    {
                      champ: setup!.mainChamp,
                      explanation: "PLACEHOLDER",
                      correct: true,
                    },
                  ],
                }),
              });

              setStep("success");
            }}
          >
            Submit Draft
          </PrimaryCTA>
        </div>
      )}
    </div>
  );
}

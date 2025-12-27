"use client";

import { useEffect, useMemo, useState } from "react";
import { DraftOverlay } from "@/app/skillcheck/games/draft/DraftOverlay";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import OutlineCTA from "@/app/_components/small/buttons/OutlineCTA";
import ChampSelectPanel from "./ChampSelectPanel";
import DraftSetupStep, { DraftSetup } from "./DraftSetupStep";

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

/**
 * True League pick order:
 * Blue: 1,4,5,8,9
 * Red : 2,3,6,7,10
 *
 * We'll use 0-based "global pick index" (0..9):
 * Blue indices: [0,3,4,7,8]
 * Red  indices: [1,2,5,6,9]
 */
const BLUE_GLOBAL = [0, 3, 4, 7, 8] as const;
const RED_GLOBAL = [1, 2, 5, 6, 9] as const;

function otherSide(side: Side): Side {
  return side === "blue" ? "red" : "blue";
}

function isSameSlot(a: ActiveSlot, b: ActiveSlot) {
  return !!a && !!b && a.side === b.side && a.index === b.index;
}

export default function DraftAuthorMain({
  initialStep = "setup",
}: {
  initialStep?: Step;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [setup, setSetup] = useState<DraftSetup | null>(null);

  const role = setup?.role ?? "mid";
  const userTeam = setup?.side ?? "blue";

  const [blue, setBlue] = useState<Pick[]>(EMPTY_TEAM);
  const [red, setRed] = useState<Pick[]>(EMPTY_TEAM);

  const [activeSlot, setActiveSlot] = useState<ActiveSlot>(null);
  const [previewChamp, setPreviewChamp] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  /* --------------------------------------------------
     Helpers based on CURRENT order (reorder affects legality)
  -------------------------------------------------- */

  const userTeamArray = userTeam === "blue" ? blue : red;

  const userIndex = useMemo(() => {
    if (!setup) return -1;
    return userTeamArray.findIndex((p) => p.role === setup.role);
  }, [setup, userTeamArray]);

  const userGlobalPick = useMemo(() => {
    if (!setup) return -1;
    if (userIndex < 0 || userIndex > 4) return -1;
    return setup.side === "blue" ? BLUE_GLOBAL[userIndex] : RED_GLOBAL[userIndex];
  }, [setup, userIndex]);

  function slotToGlobalPick(side: Side, index: number) {
    if (index < 0 || index > 4) return Infinity;
    return side === "blue" ? BLUE_GLOBAL[index] : RED_GLOBAL[index];
  }

  function isSolutionSlot(side: Side, index: number) {
    if (!setup) return false;
    const team = side === "blue" ? blue : red;
    return side === setup.side && team[index]?.role === setup.role;
  }
const disabledSlots = useMemo(() => {
  return {
    blue: blue.map((_, i) =>
      isEnemySlotLocked("blue", i)
    ),
    red: red.map((_, i) =>
      isEnemySlotLocked("red", i)
    ),
  };
}, [blue, red, setup, userGlobalPick]);

  function isEnemySlotLocked(side: Side, index: number) {
    if (!setup) return true;
    if (side === setup.side) return false; // own team never locked by this rule
    if (userGlobalPick < 0) return true;

    const g = slotToGlobalPick(side, index);
    return g > userGlobalPick;
  }

  function isSlotSelectable(side: Side, index: number) {
    if (!setup) return false;
    if (locked) return false;
    if (index < 0 || index >= 5) return false;
    if (isSolutionSlot(side, index)) return false;
    if (isEnemySlotLocked(side, index)) return false;
    return true;
  }

  function findFirstSelectableOnSide(side: Side): ActiveSlot | null {
    const team = side === "blue" ? blue : red;
    for (let i = 0; i < team.length; i++) {
      if (isSlotSelectable(side, i)) return { side, index: i };
    }
    return null;
  }

function findNextSelectableSameSide(
  from: NonNullable<ActiveSlot>
): ActiveSlot | null {
  const team = from.side === "blue" ? blue : red;

  for (let i = from.index + 1; i < team.length; i++) {
    if (isSlotSelectable(from.side, i)) {
      return { side: from.side, index: i };
    }
  }

  return null;
}


  /* --------------------------------------------------
     reset draft when setup changes
  -------------------------------------------------- */
  useEffect(() => {
    if (!setup) return;

    setBlue(EMPTY_TEAM);
    setRed(EMPTY_TEAM);

    // start at first selectable slot on user's team (skip solution slot if it's at index 0)
    setActiveSlot({ side: setup.side, index: 0 });
    setLocked(false);
  }, [setup?.side, setup?.role, setup?.mainChamp]);

  /* --------------------------------------------------
     auto-fill solution champ (always present)
  -------------------------------------------------- */
  useEffect(() => {
    if (!setup) return;

    const team = setup.side === "blue" ? blue : red;
    const setTeam = setup.side === "blue" ? setBlue : setRed;

    const idx = team.findIndex((p) => p.role === setup.role);
    if (idx === -1) return;

    if (team[idx].champ === setup.mainChamp) return;

    const next = [...team];
    next[idx] = { ...next[idx], champ: setup.mainChamp };
    setTeam(next);
  }, [setup, blue, red]);

  /* --------------------------------------------------
     keep activeSlot valid (avoid auto-selecting locked/solution slots)
  -------------------------------------------------- */
  useEffect(() => {
    if (!setup) return;
    if (!activeSlot) return;

    if (isSlotSelectable(activeSlot.side, activeSlot.index)) return;

    // try next selectable same side, else first selectable on user's side, else null
    const next =
      findNextSelectableSameSide(activeSlot) ??
      findFirstSelectableOnSide(setup.side) ??
      null;

    if (!isSameSlot(activeSlot, next)) {
      setActiveSlot(next);
      setPreviewChamp(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup, blue, red, activeSlot, locked]);

  /* --------------------------------------------------
     AUTO-CLEAR illegal enemy champs after reorder
     (guarded: only sets when actually changes)
  -------------------------------------------------- */
  useEffect(() => {
    if (!setup) return;
    if (userGlobalPick < 0) return;

    const { side: userSide } = setup;

    function clean(team: Pick[], side: Side): [Pick[], boolean] {
      if (side === userSide) return [team, false];

      let changed = false;
      const next = team.map((p, i) => {
        if (isEnemySlotLocked(side, i) && p.champ !== null) {
          changed = true;
          return { ...p, champ: null };
        }
        return p;
      });

      return [next, changed];
    }

    const [nextBlue, blueChanged] = clean(blue, "blue");
    const [nextRed, redChanged] = clean(red, "red");

    if (blueChanged) setBlue(nextBlue);
    if (redChanged) setRed(nextRed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup, userGlobalPick, blue, red]);

  const usedChamps = useMemo(() => {
    return [
      setup?.mainChamp,
      ...blue.map((p) => p.champ),
      ...red.map((p) => p.champ),
    ].filter(Boolean) as string[];
  }, [setup?.mainChamp, blue, red]);

  /* --------------------------------------------------
     Assign champion
  -------------------------------------------------- */
  function assignChampion(champ: string | null) {
    if (!setup || !activeSlot || locked) return;

    const { side, index } = activeSlot;
    if (!isSlotSelectable(side, index)) return;

    const team = side === "blue" ? blue : red;
    const setTeam = side === "blue" ? setBlue : setRed;

    const next = [...team];
    next[index] = { ...next[index], champ };
    setTeam(next);

    setPreviewChamp(null);

    // Auto-advance ONLY within same side, and NEVER into a locked slot
    if (champ) {
      const nextSlot = findNextSelectableSameSide(activeSlot);
      setActiveSlot(nextSlot); // can be null; that's fine
    }
  }

  function moveRole(side: Side, index: number, dir: -1 | 1) {
    const team = side === "blue" ? blue : red;
    const setTeam = side === "blue" ? setBlue : setRed;

    const next = index + dir;
    if (next < 0 || next >= team.length) return;

    const updated = [...team];
    [updated[index], updated[next]] = [updated[next], updated[index]];

    setTeam(updated);

    // keep selection on moved row, but only if selectable
    const candidate: ActiveSlot = { side, index: next };
    setActiveSlot(isSlotSelectable(side, next) ? candidate : null);
  }

  /* --------------------------------
     SUCCESS SHORT-CIRCUIT
  -------------------------------- */
  if (step === "success" && !setup) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-center text-white">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Draft already submitted 🎉</h2>
          <p className="text-white/70">You can submit a new draft tomorrow.</p>
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

  /* STEP 1 */
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
        onSlotClick={(side, index) => {
          if (!isSlotSelectable(side, index)) return;
          setActiveSlot({ side, index });
        }}
        center={
          <ChampSelectPanel
            onHover={setPreviewChamp}
            onSelect={assignChampion}
            disabledChamps={usedChamps}
          />
        }
      />

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
            if (!setup) return;

            setLocked(true);

            await fetch("/api/skillcheck/db/draft", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: setup.role,
                userTeam: setup.side,
                blue,
                red,
                answers: [
                  {
                    champ: setup.mainChamp,
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
    </div>
  );
}

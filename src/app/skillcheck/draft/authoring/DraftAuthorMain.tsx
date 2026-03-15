"use client";

import { useEffect, useMemo, useState } from "react";
import { DraftOverlay } from "@/app/skillcheck/draft/game/DraftOverlay";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import OutlineCTA from "@/app/_components/small/buttons/OutlineCTA";
import ChampSelectPanel from "./ChampSelectPanel";
import DraftSetupStep, { DraftSetup } from "./DraftSetupStep";

// ✅ unified draft facts
import {
  Role,
  Side,
  Pick,
  getGlobalPick,
  getTeamIndexFromGlobalPick,
} from "@/app/skillcheck/draft/draftCore";

type ActiveSlot = {
  side: Side;
  index: number;
} | null;

type Step = "setup" | "draft" | "name" | "success";

const EMPTY_TEAM: Pick[] = [
  { role: "jng", champ: null },
  { role: "adc", champ: null },
  { role: "sup", champ: null },
  { role: "mid", champ: null },
  { role: "top", champ: null },
];

function otherSide(side: Side): Side {
  return side === "blue" ? "red" : "blue";
}

function isSameSlot(a: ActiveSlot, b: ActiveSlot) {
  return !!a && !!b && a.side === b.side && a.index === b.index;
}

function slotFromGlobalPick(globalPick: number): ActiveSlot | null {
  const blueIndex = getTeamIndexFromGlobalPick("blue", globalPick);
  if (blueIndex !== -1) return { side: "blue", index: blueIndex };

  const redIndex = getTeamIndexFromGlobalPick("red", globalPick);
  if (redIndex !== -1) return { side: "red", index: redIndex };

  return null;
}

export default function DraftAuthorMain({
  initialStep = "setup",
  submitUrl = "/api/skillcheck/draft/db",
  successMode = "public",
}: {
  initialStep?: Step;
  submitUrl?: string;
  successMode?: "public" | "admin";
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [setup, setSetup] = useState<DraftSetup | null>(null);
  const [madeBy, setMadeBy] = useState<string>("Anonymous");

  const role = setup?.role ?? "mid";
  const userTeam = setup?.side ?? "blue";

  const [blue, setBlue] = useState<Pick[]>(EMPTY_TEAM);
  const [red, setRed] = useState<Pick[]>(EMPTY_TEAM);

  const [activeSlot, setActiveSlot] = useState<ActiveSlot>(null);
  const [globalPickCursor, setGlobalPickCursor] = useState<number | null>(null);
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
    return getGlobalPick(setup.side, userIndex);
  }, [setup, userIndex]);

  function isSolutionSlot(side: Side, index: number) {
    if (!setup) return false;
    const team = side === "blue" ? blue : red;
    return side === setup.side && team[index]?.role === setup.role;
  }

  const disabledSlots = useMemo(() => {
    return {
      blue: blue.map((_, i) => isEnemySlotLocked("blue", i)),
      red: red.map((_, i) => isEnemySlotLocked("red", i)),
    };
  }, [blue, red, setup, userGlobalPick]);

  function isEnemySlotLocked(side: Side, index: number) {
    if (!setup) return true;
    if (side === setup.side) return false;
    if (userGlobalPick < 0) return true;

    const g = getGlobalPick(side, index);
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

  function findNextActiveFromGlobal(
    currentGlobal: number | null
  ): { slot: ActiveSlot | null; global: number | null } {
    if (!setup) return { slot: null, global: null };

    const start = currentGlobal === null ? 0 : currentGlobal + 1;

    for (let g = start; g <= 9; g++) {
      const slot = slotFromGlobalPick(g);
      if (!slot) continue;
      if (isSlotSelectable(slot.side, slot.index)) {
        return { slot, global: g };
      }
    }

    return { slot: null, global: null };
  }

  /* --------------------------------------------------
     reset draft when setup changes
  -------------------------------------------------- */
  useEffect(() => {
    if (!setup) return;

    setBlue(EMPTY_TEAM);
    setRed(EMPTY_TEAM);

    setGlobalPickCursor(null);
    const { slot, global } = findNextActiveFromGlobal(null);
    setActiveSlot(slot);
    setGlobalPickCursor(global);
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
     keep activeSlot valid
  -------------------------------------------------- */
  useEffect(() => {
    if (!setup) return;
    if (activeSlot && isSlotSelectable(activeSlot.side, activeSlot.index))
      return;

    const currentGlobal =
      globalPickCursor === null && activeSlot
        ? getGlobalPick(activeSlot.side, activeSlot.index)
        : globalPickCursor;

    const { slot, global } = findNextActiveFromGlobal(currentGlobal);

    if (!isSameSlot(activeSlot, slot)) {
      setActiveSlot(slot);
      setPreviewChamp(null);
    }

    setGlobalPickCursor(global);
  }, [setup, blue, red, activeSlot, locked, globalPickCursor]);

  /* --------------------------------------------------
     AUTO-CLEAR illegal enemy champs after reorder
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

    if (champ) {
      const { slot, global } = findNextActiveFromGlobal(globalPickCursor);
      setActiveSlot(slot);
      setGlobalPickCursor(global);
    }
  }

  function reorderTeam(side: Side, newOrder: Pick[]) {
    const setTeam = side === "blue" ? setBlue : setRed;
    const team = side === "blue" ? blue : red;
    setTeam(newOrder);
    if (activeSlot?.side === side) {
      const oldPick = team[activeSlot.index];
      const newIndex = newOrder.findIndex((p) => p.role === oldPick?.role);
      if (newIndex >= 0) setActiveSlot({ side, index: newIndex });
      else setActiveSlot(null);
    }
  }

  /* --------------------------------
     SUCCESS SHORT-CIRCUIT
  -------------------------------- */
  if (step === "success") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-center text-white">
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            Draft submitted 🎉
          </h2>
          <p className="text-white/70 mb-1">
            Sho will approve it asap (if it&apos;s good)
          </p>
          <p className="text-white/70">
            {successMode === "admin"
              ? "You can create another draft right away on this page."
              : "You can submit a new draft tomorrow."}
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

  /* STEP: name (public only – enter display name before submit) */
  if (step === "name" && successMode === "public") {
    return (
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
        <h2 className="text-xl md:text-2xl font-semibold text-white text-center">
          What's your name?
        </h2>
        <p className="text-white/70 text-center text-sm">
          This name will appear when your draft is eventually featured.
        </p>
        <input
          type="text"
          value={madeBy}
          onChange={(e) => setMadeBy(e.target.value)}
          placeholder="Anonymous"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <div className="flex gap-4 w-full">
          <OutlineCTA
            className="flex-1 px-6 py-3 text-lg"
            onClick={() => setStep("draft")}
          >
            Back
          </OutlineCTA>
          <PrimaryCTA
            className="flex-1 px-6 py-3 text-lg"
            onClick={async () => {
              if (!setup) return;
              setLocked(true);
              await fetch(submitUrl, {
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
                  madeBy: madeBy.trim() || "Anonymous",
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

  /* STEP 1: draft board */
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
        disabledSlots={disabledSlots}
        onReorderTeam={reorderTeam}
        onSlotClick={(side, index) => {
          if (!isSlotSelectable(side, index)) return;
          setPreviewChamp(null);
          setActiveSlot({ side, index });
          setGlobalPickCursor(getGlobalPick(side, index));
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
            if (successMode === "public") {
              setStep("name");
              return;
            }
            setLocked(true);
            await fetch(submitUrl, {
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

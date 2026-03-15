"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import GlassPanel from "@/app/_components/panels/GlassPanel";

import { Pick } from "@/app/skillcheck/draft/draftCore";

import { DraftTeam, type ActiveSlot, type DisabledSlots } from "./DraftTeam";

const AUTHOR_TUTORIAL_KEY = "skillcheck:draftAuthorTutorialSeen";

export type DraftAuthoringOverlayProps = {
  blue: Pick[];
  red: Pick[];
  role: "top" | "jng" | "mid" | "adc" | "sup";
  userTeam: "blue" | "red";
  solutionChamp: string;
  previewChamp?: string | null;
  locked: boolean;
  activeSlot: ActiveSlot;
  onSlotClick: (side: "blue" | "red", index: number) => void;
  center: React.ReactNode;
  onReorderTeam: (side: "blue" | "red", newOrder: Pick[]) => void;
  disabledSlots: DisabledSlots;
};

export function DraftAuthoringOverlay({
  blue,
  red,
  role,
  userTeam,
  solutionChamp,
  previewChamp,
  locked,
  activeSlot,
  onSlotClick,
  center,
  onReorderTeam,
  disabledSlots,
}: DraftAuthoringOverlayProps) {
  const [tutorialStep, setTutorialStep] = useState<1 | 2 | 3 | null>(1);
  const [justDropped, setJustDropped] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(AUTHOR_TUTORIAL_KEY);
      if (seen === "1") {
        setTutorialStep(null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!justDropped) return;
    const id = requestAnimationFrame(() => setJustDropped(false));
    return () => cancelAnimationFrame(id);
  }, [justDropped]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleBlueDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blue.findIndex((_, i) => String(active.id) === `blue-${i}`);
    const newIndex = blue.findIndex((_, i) => String(over.id) === `blue-${i}`);
    if (oldIndex === -1 || newIndex === -1) return;
    flushSync(() => {
      onReorderTeam("blue", arrayMove([...blue], oldIndex, newIndex));
    });
    setJustDropped(true);
  };

  const handleRedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = red.findIndex((_, i) => String(active.id) === `red-${i}`);
    const newIndex = red.findIndex((_, i) => String(over.id) === `red-${i}`);
    if (oldIndex === -1 || newIndex === -1) return;
    flushSync(() => {
      onReorderTeam("red", arrayMove([...red], oldIndex, newIndex));
    });
    setJustDropped(true);
  };

  const showTutorial = tutorialStep !== null;

  return (
    <div className="relative flex w-full max-w-6xl items-stretch justify-between my-6 px-4 py-6">
      <div className="flex-1 flex justify-start">
        <DndContext onDragEnd={handleBlueDragEnd} sensors={sensors}>
          <DraftTeam
            team={blue}
            side="blue"
            role={role}
            userTeam={userTeam}
            previewChamp={previewChamp}
            solutionChamp={solutionChamp}
            locked={locked}
            authoring
            sortable
            justDropped={justDropped}
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            disabledSlots={disabledSlots}
          />
        </DndContext>
      </div>

      <div className="w-[720px] flex items-center justify-center">
        {center}
      </div>

      <div className="flex-1 flex justify-end">
        <DndContext onDragEnd={handleRedDragEnd} sensors={sensors}>
          <DraftTeam
            team={red}
            side="red"
            role={role}
            userTeam={userTeam}
            previewChamp={previewChamp}
            solutionChamp={solutionChamp}
            locked={locked}
            authoring
            sortable
            justDropped={justDropped}
            activeSlot={activeSlot}
            onSlotClick={onSlotClick}
            disabledSlots={disabledSlots}
          />
        </DndContext>
      </div>

      {showTutorial && (
        <div className="pointer-events-auto absolute -bottom-12 right-8">
          <GlassPanel className="max-w-sm px-4 py-3 text-base text-white/80 shadow-lg backdrop-blur-[6px]">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                {tutorialStep === 1 &&
                  "Pick the comps for both teams that will enable your champ to the max."}
                {tutorialStep === 2 &&
                  "Drag rows to change the pick-order and match a real champselect."}
                {tutorialStep === 3 &&
                  "Enemies that pick after your selected main champion are locked. Adjust pick-order to unlock them."}
              </div>
              <button
                type="button"
                className="cursor-pointer text-base text-sky-300 hover:text-sky-200"
                onClick={() => {
                  if (tutorialStep === 3) {
                    setTutorialStep(null);
                    try {
                      localStorage.setItem(AUTHOR_TUTORIAL_KEY, "1");
                    } catch {
                      // ignore
                    }
                  } else {
                    setTutorialStep((tutorialStep === 1 ? 2 : 3) as 1 | 2 | 3);
                  }
                }}
              >
                {tutorialStep === 1 ? "Next 1/3" : tutorialStep === 2 ? "Next 2/3" : "Finish 3/3"}
              </button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

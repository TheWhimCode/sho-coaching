import type { WhatNowCandidate } from "./whatNow";
import { stepsForGuide } from "./whatNow";
import type { SurveyChoice } from "./whatNowSurvey";

export type EngineBeat =
  | { kind: "say"; text: string; continueLabel?: string }
  | { kind: "ask"; questionId?: string; prompt?: string; choices?: SurveyChoice[] }
  | { kind: "pick" }
  | { kind: "guide" }
  | { kind: "result" };

export type MoodEngine = {
  id: string;
  pace: "find" | "guide";
  empty: string;
  beats: EngineBeat[];
};

export const moodEngines: Record<string, MoodEngine> = {
  "feel-work": {
    id: "work",
    pace: "find",
    empty: "Nothing on your lists fits this right now. You can pick another direction, or rest.",
    beats: [
      {
        kind: "ask",
        prompt: "What do you want to look at?",
        choices: [
          { id: "work-life", label: "Tell me what needs to be done", filter: { pick: "timeline", result: "card" } },
          { id: "work-create", label: "Make a TikTok", filter: { pick: "timed", categories: ["tiktok"], soonDays: 3, laterDays: 7, count: 3, result: "card" } },
          { id: "work-either", label: "Work on your model", filter: { pick: "list", categories: ["blender", "unity"], count: 3, result: "card" } },
        ],
      },
      { kind: "pick" },
      { kind: "result" },
    ],
  },
  "feel-meh": {
    id: "meh",
    pace: "find",
    empty: "Nothing light enough is on your lists. Rest counts. Eat if you can.",
    beats: [
      {
        kind: "ask",
        prompt: "What's wrong?",
        choices: [
          { id: "meh-hungry", label: "Hungry", filter: { categories: ["food"] } },
          { id: "meh-tired", label: "Tired", filter: { categories: ["selfcare"] } },
          { id: "meh-sad", label: "Sad", filter: { categories: ["selfcare"] } },
          { id: "meh-bored", label: "Bored", filter: { categories: ["twitter", "reddit", "vtubing"] } },
        ],
      },
      { kind: "pick" },
      { kind: "result" },
    ],
  },
  "feel-bad": {
    id: "bad",
    pace: "guide",
    empty: "Nothing on your lists is small enough. Rest is a valid answer. You can stop here.",
    beats: [
      { kind: "say", text: "We'll keep this small. Nothing has to be finished.", continueLabel: "Okay" },
      { kind: "say", text: "Drink a little water if you can. If you can't, that's okay. We'll still go slowly.", continueLabel: "Okay" },
      { kind: "ask", questionId: "bad-need" },
      { kind: "pick" },
      { kind: "say", text: "One step at a time. Tap when you've done this bit. You can stop whenever you want.", continueLabel: "I'm ready" },
      { kind: "guide" },
      { kind: "say", text: "That's enough. You can rest now.", continueLabel: "Okay" },
    ],
  },
  "feel-miserable": {
    id: "miserable",
    pace: "guide",
    empty: "You don't have to find a task. Rest counts. Eat if you can. You can stop here.",
    beats: [
      { kind: "say", text: "You don't have to do this well. Slow is okay. We'll do one tiny thing at a time.", continueLabel: "Okay" },
      { kind: "say", text: "Take three slow breaths. In through the nose. Out through the mouth. No rush.", continueLabel: "I did that" },
      { kind: "say", text: "If there's water nearby, take a sip. If there isn't, that's okay.", continueLabel: "Okay" },
      { kind: "ask", questionId: "miserable-need" },
      { kind: "pick" },
      { kind: "say", text: "We'll go through this slowly. One small piece. You can stop after any step.", continueLabel: "I'm ready" },
      { kind: "guide" },
      { kind: "say", text: "That's enough. You can stop here. You did something, and that counts.", continueLabel: "Okay" },
    ],
  },
};

export function engineForChoice(choiceId: string) {
  return moodEngines[choiceId] ?? null;
}

export function enterBeatIndex(engine: MoodEngine, index: number, suggestion: WhatNowCandidate | null) {
  const beat = engine.beats[index];
  if (!beat) return engine.beats.length;
  if (beat.kind !== "pick") return index;
  if (!suggestion) return engine.beats.length;
  return index + 1;
}

export function guideProgress(item: WhatNowCandidate, stepIndex: number) {
  const steps = stepsForGuide(item);
  const index = Math.min(Math.max(stepIndex, 0), Math.max(steps.length - 1, 0));
  return { steps, index, text: steps[index] ?? item.title, last: index >= steps.length - 1 };
}

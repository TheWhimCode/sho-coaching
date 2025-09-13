// lib/sessions/steps.ts
import type { Preset } from "./preset";

type Step = { title: string };

export const stepsByPreset: Record<Preset, Step[]> = {
  instant: [
    { title: "Bring your questions" },
    { title: "Hop on Discord" },
    { title: "Cut straight to the answers" },
    { title: "Leave with clear principles" },
  ],
  signature: [
    { title: "Pick a game & join Discord" },
    { title: "Break down key mistakes" },
    { title: "Build your SoloQ plan" },
    { title: "Apply what you’ve learned" },
    { title: "Request your 15-min follow-up" },
  ],
  vod: [
    { title: "Pick 1–2 games & join Discord" },
    { title: "Analyze critical mistakes" },
    { title: "Identify habits holding you back" },
    { title: "Learn how to practice long-term" },
    { title: "Get your VOD + notes package" },
  ],
  custom: [
    { title: "Customize your session" },
    { title: "Join Discord & share your plan" },
    { title: "Deep dive into your unique goals" },
    { title: "Build a plan to achieve them" },
    { title: "Get your VOD + notes package" },
  ],
};

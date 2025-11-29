// lib/sessions/labels.ts
import { Preset } from "./preset";

export const titlesByPreset: Record<Preset, string> = {
  instant: "Instant Insights",
  signature: "Signature Session",
  vod: "VOD Review",
  custom: "Custom Session",
  bootcamp: "Bootcamp", // added
};

export const taglinesByPreset: Record<Preset, string> = {
  instant: "Clarity in minutes",
  signature: "Designed to make you climb",
  vod: "Rewind. Analyze. Improve.",
  custom: "Your goals, your path",
  bootcamp: "Intensive learning, maximum impact", // added
};

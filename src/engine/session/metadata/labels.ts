// lib/sessions/labels.ts
import { Preset } from "../rules/preset";

export const titlesByPreset: Record<Preset, string> = {
  instant: "Instant Insights",
  signature: "Signature Session",
  vod: "VOD Review",
  custom: "Custom Session",
  rush: "Elo Rush",
  bundle_bootcamp: "Bootcamp Coaching",
};

export const taglinesByPreset: Record<Preset, string> = {
  instant: "Clarity in minutes",
  signature: "Designed to make you climb",
  vod: "Rewind. Analyze. Improve.",
  custom: "Your goals, your path",
  rush: "Your improvement arc starts today",
  bundle_bootcamp: "Intensive multi-session transformation",
};

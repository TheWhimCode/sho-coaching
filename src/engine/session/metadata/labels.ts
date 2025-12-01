// lib/sessions/labels.ts
import { Preset } from "../rules/preset";

export const titlesByPreset: Record<Preset, string> = {
  instant: "Instant Insights",
  signature: "Signature Session",
  vod: "VOD Review",
  custom: "Custom Session",
  bundle_4x60: "4-Session Package",
  bundle_bootcamp: "Bootcamp Coaching",
};

export const taglinesByPreset: Record<Preset, string> = {
  instant: "Clarity in minutes",
  signature: "Designed to make you climb",
  vod: "Rewind. Analyze. Improve.",
  custom: "Your goals, your path",
  bundle_4x60: "Over 4 weeks of guided improvement",
  bundle_bootcamp: "Intensive multi-session transformation",
};

// engine/session/metadata/colors.ts
import type { Preset } from "../rules/preset";

// Both solid + gradient variants have ring + glow
export type ColorStyle =
  | { ring: string; glow: string; gradient?: undefined }
  | { ring: string; glow: string; gradient: string };

export const colorsByPreset: Record<Preset, ColorStyle> = {
  instant: {
    ring: "#fee484ff",
    glow: "rgba(248,211,75,.65)",
  },

  signature: {
    ring: "#F87171",
    glow: "rgba(248,113,113,.65)",
  },

  vod: {
    ring: "#69A8FF",
    glow: "rgba(105,168,255,.65)",
  },

  custom: {
    ring: "#e6e6e6ff",
    glow: "rgba(255,255,255,0.39)",
  },

  bundle_4x60: {
    ring: "#ffac38ff",
    gradient:
      "linear-gradient(90deg, #D08A2A 0%, #E1A653 25%, #F1C97F 50%, #E1A653 75%, #C07827 100%)",
    glow: "rgba(225,166,83,0.55)",
  },

  bundle_bootcamp: {
    ring: "#10B981",
    gradient:
      "linear-gradient(90deg, #10B981 0%, #42D1AB 25%, #85E5C8 50%, #42D1AB 75%, #0F9E6E 100%)",
    glow: "rgba(52,211,153,0.55)",
  },
};

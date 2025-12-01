// engine/session/metadata/colors.ts
import type { Preset } from "../rules/preset";

export const colorsByPreset: Record<Preset, { ring: string; glow: string }> = {
  instant:   { ring: "#fee484ff", glow: "rgba(248,211,75,.65)" },
  signature: { ring: "#F87171",   glow: "rgba(248,113,113,.65)" },
  vod:       { ring: "#69A8FF",   glow: "rgba(105,168,255,.65)" },
  custom:    { ring: "#e6e6e6ff", glow: "rgba(255,255,255,0.39)" },
bundle_4x60: { ring: "#8D4BFF",   glow: "rgba(141,75,255,0.65)" },

  bundle_bootcamp: {
    ring: "#22C55E",
    glow: "rgba(34,197,94,0.65)"
  },
};

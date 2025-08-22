// lib/sessions/colors.ts
// lib/sessions/colors.ts
import type { Preset } from "./preset";

export const colorsByPreset: Record<Preset, { ring: string; glow: string }> = {
  instant:   { ring: "#fee484ff", glow: "rgba(248,211,75,.65)" },
  signature: { ring: "#F87171",   glow: "rgba(248,113,113,.65)" },
  vod:       { ring: "#69A8FF",   glow: "rgba(105,168,255,.65)" },
  custom:    { ring: "#e6e6e6ff", glow: "rgba(255,255,255,0.39)" },
};


export type Preset = "vod" | "instant" | "signature" | "custom";

export function getPreset(minutes: number, followups = 0): Preset {
  if (minutes === 60 && followups === 0) return "vod";
  if (minutes === 30 && followups === 0) return "instant";
  if (minutes === 45 && followups === 1) return "signature";
  return "custom";
}
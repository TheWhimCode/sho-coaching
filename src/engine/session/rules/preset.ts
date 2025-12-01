export type Preset = "vod" | "instant" | "signature" | "custom";

/** Base-only minutes decide the named presets; any live block flips to custom. */
export function getPreset(baseMinutes: number, followups = 0, liveBlocks = 0): Preset {
  if (liveBlocks > 0) return "custom";
  if (baseMinutes === 60 && followups === 0) return "vod";
  if (baseMinutes === 30 && followups === 0) return "instant";
  if (baseMinutes === 45 && followups === 1) return "signature";
  return "custom";
}

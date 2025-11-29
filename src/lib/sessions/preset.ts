export type Preset =
  | "vod"
  | "instant"
  | "signature"
  | "custom"
  | "bootcamp";

/**
 * IMPORTANT RULE:
 * Bootcamp is NEVER inferred.
 * If chosen, it must be explicitly passed through presetOverride.
 */
export function getPreset(
  baseMinutes: number,
  followups = 0,
  liveBlocks = 0,
  presetOverride?: Preset
): Preset {

  // Bootcamp always wins and is never inferred from minutes
  if (presetOverride === "bootcamp") return "bootcamp";

  // override for normal presets still allowed
  if (presetOverride) return presetOverride;

  // normal presets:
  if (liveBlocks > 0) return "custom";
  if (baseMinutes === 60 && followups === 0) return "vod";
  if (baseMinutes === 30 && followups === 0) return "instant";
  if (baseMinutes === 45 && followups === 1) return "signature";

  return "custom";
}

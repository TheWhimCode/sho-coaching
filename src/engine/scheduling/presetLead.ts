/** Lead time (minutes) for Instant Insights — 2 hours so slots can start sooner. */
export const INSTANT_LEAD_MINUTES = 120;

export function isInstantPreset(preset?: string | null): boolean {
  if (!preset) return false;
  const n = preset.replace(/-/g, "_").toLowerCase();
  return n === "instant" || n === "instant_insights";
}

/** Returns lead minutes override for a preset, or undefined to use default. */
export function getLeadMinutesOverride(preset?: string | null): number | undefined {
  return isInstantPreset(preset) ? INSTANT_LEAD_MINUTES : undefined;
}

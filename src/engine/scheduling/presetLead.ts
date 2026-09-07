/** Lead time (minutes) for Instant Insights — 2 hours so slots can start sooner. */
export const INSTANT_LEAD_MINUTES = 120;

/**
 * When true, every session type uses Instant Insights lead time (2h).
 * Flip to `false` to restore the default long lead for non-instant presets.
 */
export const USE_INSTANT_LEAD_FOR_ALL = true;

export function isInstantPreset(preset?: string | null): boolean {
  if (!preset) return false;
  const n = preset.replace(/-/g, "_").toLowerCase();
  return n === "instant" || n === "instant_insights";
}

/**
 * Lead minutes override for a preset, or undefined to use default LEAD_MINUTES.
 * When USE_INSTANT_LEAD_FOR_ALL is on, always returns the Instant Insights lead.
 */
export function getLeadMinutesOverride(preset?: string | null): number | undefined {
  if (USE_INSTANT_LEAD_FOR_ALL) return INSTANT_LEAD_MINUTES;
  return isInstantPreset(preset) ? INSTANT_LEAD_MINUTES : undefined;
}

/**
 * Deterministic daily champion for the runes (keystone) skillcheck game.
 * Must match between cron (sampling) and runes page (display).
 */

import { cooldownAbilities } from "@/app/skillcheck/cooldowns/components/cooldownAbilities";

const ELIGIBLE_CHAMP_IDS = Object.keys(cooldownAbilities).filter(Boolean);

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Returns the champion key (e.g. "Aatrox") for the runes game for the given dayKey (YYYY-MM-DD).
 */
export function getRunesDailyChampion(dayKey: string): string {
  const seed = hash32(`runes:${dayKey}`);
  const idx = seed % ELIGIBLE_CHAMP_IDS.length;
  return ELIGIBLE_CHAMP_IDS[idx] ?? ELIGIBLE_CHAMP_IDS[0]!;
}

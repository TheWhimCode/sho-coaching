/**
 * Deterministic daily champion for the cooldowns skillcheck game.
 * Must match the logic in app/skillcheck/cooldowns/page.tsx so layout background stays in sync.
 */

import { cooldownAbilities } from "@/app/skillcheck/cooldowns/components/cooldownAbilities";

const KEYS = ["Q", "W", "E", "R"] as const;

const ELIGIBLE_CHAMP_IDS = Object.entries(cooldownAbilities)
  .filter(([, keys]) => keys.some((k) => KEYS.includes(k as (typeof KEYS)[number])))
  .map(([id]) => id);

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Returns the champion id (e.g. "Anivia") for the cooldowns game for the given dayKey (YYYY-MM-DD).
 */
export function getCooldownsDailyChampion(dayKey: string): string {
  const seed = hash32(`cooldowns:${dayKey}`);
  const idx = seed % ELIGIBLE_CHAMP_IDS.length;
  return ELIGIBLE_CHAMP_IDS[idx] ?? ELIGIBLE_CHAMP_IDS[0]!;
}

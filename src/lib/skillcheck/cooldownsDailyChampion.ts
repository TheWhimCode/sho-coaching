import { cooldownAbilities } from "@/app/skillcheck/cooldowns/components/cooldownAbilities";

const ELIGIBLE_CHAMP_IDS = Object.entries(cooldownAbilities)
  .map(([id, keys]) => ({
    id,
    keys: keys.filter(Boolean),
  }))
  .filter((x) => x.keys.length > 0)
  .map((x) => x.id);

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic daily champion for the cooldowns skillcheck game.
 * Must match between the cooldowns page and any consumers (e.g. layout background).
 */
export function getCooldownsDailyChampion(dayKey: string): string {
  if (ELIGIBLE_CHAMP_IDS.length === 0) {
    throw new Error("No eligible champions for cooldowns daily");
  }

  const seed = hash32(`cooldowns:${dayKey}`);
  const idx = seed % ELIGIBLE_CHAMP_IDS.length;
  return ELIGIBLE_CHAMP_IDS[idx] ?? ELIGIBLE_CHAMP_IDS[0]!;
}


import {
  compositionFacts,
  isMagicDamage,
  isPhysicalDamage,
  SHADOW_ECONOMY_CHAMPIONS,
} from "@/lib/guides/buildPicker/compositionFacts";
import {
  BARRIER_SHIELD_SCORE,
  extraShieldScore,
  runDecisionTree,
  teamShieldScore,
  type TreeParticipant,
} from "@/lib/guides/buildPicker/decisionTree";
import { SCORING_THRESHOLDS, type ScoringThresholds } from "@/lib/guides/buildPicker/thresholds";
import type { LiveGameParticipant } from "@/lib/guides/buildPicker/types";

export type TestChampion = TreeParticipant & LiveGameParticipant & {
  durabilityScore: number;
  shieldScore: number;
  shieldTiming: string | null;
  canBuildSteelcaps: boolean | null;
  damageScore: number;
  ccScore: number | null;
};

export {
  BARRIER_SHIELD_SCORE,
  extraShieldScore,
  isMagicDamage,
  isPhysicalDamage,
  teamShieldScore,
};

export function barrierShieldScore(champion: Pick<TestChampion, "spellIds" | "perkIds">) {
  return champion.spellIds.includes(21) ? BARRIER_SHIELD_SCORE : 0;
}

export function steelcapsDurabilityBonus(
  champion: Pick<TestChampion, "canBuildSteelcaps">,
  applies: boolean,
  bonus = 1
) {
  return applies && champion.canBuildSteelcaps === true ? bonus : 0;
}

export const DEFAULTS: ScoringThresholds = { ...SCORING_THRESHOLDS };
export type Settings = ScoringThresholds;

export function shadowEconomyTargets(enemies: Pick<TestChampion, "name" | "championId">[]) {
  return enemies
    .filter(
      (champion) =>
        SHADOW_ECONOMY_CHAMPIONS.has(champion.name) || SHADOW_ECONOMY_CHAMPIONS.has(champion.championId)
    )
    .map((champion) => champion.name);
}

export function scoreTeams(allies: TestChampion[], enemies: TestChampion[], settings: Settings) {
  const durability = enemies.reduce((sum, c) => sum + c.durabilityScore, 0);
  const late = enemies.reduce((sum, c) => sum + (c.shieldTiming === "Late" ? c.shieldScore : 0), 0);
  const shields = teamShieldScore(enemies);
  const early = shields - late;
  const physical = allies.filter(isPhysicalDamage).length;
  const magicDamage = allies.filter(isMagicDamage).reduce((sum, c) => sum + c.damageScore, 0);
  const eligible = enemies.filter(c => c.canBuildSteelcaps === true).length;
  const steelApplies = physical >= settings.physicalMin && magicDamage < settings.magicDamageMax;
  const adjustment = steelApplies ? eligible * settings.steelcapsBonus : 0;
  const adjusted = durability + adjustment;
  const shadowTargets = shadowEconomyTargets(enemies);
  let buildId: string;
  let reason: string;
  if (shadowTargets.length > 0 && durability < settings.titansMin) {
    buildId = "umbral-collector";
    reason = `${shadowTargets.join(", ")} on the enemy team. Shadow Economy is the primary build because base durability ${durability} is below the Titansbane threshold ${settings.titansMin}.`;
  } else if (early + late >= settings.shield) {
    buildId = early >= settings.earlyShield ? "sit-serpents-first" : "sit-serpents-late";
    reason = `Shield total ${shields} reaches ${settings.shield}: ${early} early, ${late} late (Barrier and Guardian included).`;
  } else if (durability >= settings.titansMin) {
    buildId = "hubris-ldr";
    reason = `Base durability ${durability} reaches Titansbane threshold ${settings.titansMin}. Steelcaps does not contribute to this threshold.`;
  } else if (adjusted <= settings.lethalityMax) {
    buildId = "bastionbreaker-cyclosword";
    reason = `Adjusted durability ${adjusted} is at or below full-lethality maximum ${settings.lethalityMax}.`;
  } else if (adjusted <= settings.bastionMax) {
    buildId = "main-bastionbreaker";
    reason = `Adjusted durability ${adjusted} is at or below Bastionbreaker maximum ${settings.bastionMax}.`;
  } else {
    buildId = "main-hubris";
    reason = `Adjusted durability ${adjusted} exceeds ${settings.bastionMax}, but base durability ${durability} is below Titansbane threshold ${settings.titansMin}.`;
  }
  // Reuse only reset-denial and boot handling, bypassing the old category tree.
  const recommendation = runDecisionTree({ allies, enemies }, { kind: "build", id: "score-preview", buildId, reason });
  return {
    durability, early, late, physical, magicDamage, eligible, steelApplies, adjustment, adjusted, reason,
    recommendation: {
      ...recommendation,
      missingProfiles: [],
      facts: compositionFacts(allies, enemies, settings),
    },
  };
}

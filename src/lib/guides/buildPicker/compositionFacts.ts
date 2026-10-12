import type { ChampionDamageType } from "@prisma/client";
import { SCORING_THRESHOLDS, type ScoringThresholds } from "./thresholds";

export const SHADOW_ECONOMY_CHAMPIONS = new Set(["Shaco", "Evelynn", "Rengar"]);
export const STEELCAPS_ITEM_ID = 3047;
export const UMBRAL_ITEM_ID = 3179;

export type CompositionFactChampion = {
  championId: string;
  championName: string;
  championIcon: string;
};

export type CompositionFact = {
  id: "steelcaps" | "umbral";
  itemId: number;
  label: string;
  champions: CompositionFactChampion[];
};

export type FactChampion = {
  name: string;
  championId: string;
  championIcon: string;
  damageType?: ChampionDamageType | null;
  damageScore?: number | null;
  canBuildSteelcaps?: boolean | null;
};

export function isPhysicalDamage(champion: Pick<FactChampion, "damageType">) {
  return champion.damageType === "AD" || champion.damageType === "Mixed";
}

export function isMagicDamage(champion: Pick<FactChampion, "damageType">) {
  return champion.damageType === "AP" || champion.damageType === "Mixed";
}

function portraits(champions: FactChampion[]): CompositionFactChampion[] {
  return champions.map((champion) => ({
    championId: champion.championId,
    championName: champion.name,
    championIcon: champion.championIcon,
  }));
}

/** Lobby facts shown under the composition chart when they actually apply. */
export function compositionFacts(
  allies: FactChampion[],
  enemies: FactChampion[],
  settings: ScoringThresholds = SCORING_THRESHOLDS
): CompositionFact[] {
  const physical = allies.filter(isPhysicalDamage).length;
  const magicDamage = allies
    .filter(isMagicDamage)
    .reduce((sum, champion) => sum + (champion.damageScore ?? 0), 0);
  const steelApplies = physical >= settings.physicalMin && magicDamage < settings.magicDamageMax;
  const steelTargets = enemies.filter((champion) => champion.canBuildSteelcaps === true);
  const umbralTargets = enemies.filter(
    (champion) =>
      SHADOW_ECONOMY_CHAMPIONS.has(champion.name) || SHADOW_ECONOMY_CHAMPIONS.has(champion.championId)
  );

  const facts: CompositionFact[] = [];
  if (steelApplies && steelTargets.length > 0) {
    facts.push({
      id: "steelcaps",
      itemId: STEELCAPS_ITEM_ID,
      label: "Enemies can build",
      champions: portraits(steelTargets),
    });
  }
  if (umbralTargets.length > 0) {
    facts.push({
      id: "umbral",
      itemId: UMBRAL_ITEM_ID,
      label: "Strong Against",
      champions: portraits(umbralTargets),
    });
  }
  return facts;
}

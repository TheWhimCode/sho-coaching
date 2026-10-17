import type { ChampionDamageType } from "@prisma/client";
import { SCORING_THRESHOLDS, type ScoringThresholds } from "./thresholds";

export const SHADOW_ECONOMY_CHAMPIONS = new Set(["Shaco", "Evelynn", "Rengar"]);
export const STEELCAPS_ITEM_ID = 3047;
export const UMBRAL_ITEM_ID = 3179;
export const HUBRIS_ITEM_ID = 6697;
export const RESET_DENIER_MIN = 2;

export type CompositionFactChampion = {
  championId: string;
  championName: string;
  championIcon: string;
};

export type CompositionFact = {
  id: "steelcaps" | "umbral" | "hubris-cc" | "reset-denial";
  itemId: number;
  label: string;
  /** Include is a reason to take or expect the item; exclude is why it is skipped. */
  tone: "include" | "exclude";
  champions: CompositionFactChampion[];
};

export type FactChampion = {
  name: string;
  championId: string;
  championIcon: string;
  damageType?: ChampionDamageType | null;
  damageScore?: number | null;
  ccScore?: number | null;
  canBuildSteelcaps?: boolean | null;
  deniesResets?: boolean | null;
};

export function isPhysicalDamage(champion: Pick<FactChampion, "damageType">) {
  return champion.damageType === "AD" || champion.damageType === "Mixed";
}

export function isMagicDamage(champion: Pick<FactChampion, "damageType">) {
  return champion.damageType === "AP" || champion.damageType === "Mixed";
}

/** Split mixed damage evenly; retain fractional scores without rounding. */
export function physicalDamageScore(champion: Pick<FactChampion, "damageType" | "damageScore">) {
  const score = champion.damageScore ?? 0;
  return champion.damageType === "Mixed" ? score / 2 : champion.damageType === "AD" ? score : 0;
}

export function magicDamageScore(champion: Pick<FactChampion, "damageType" | "damageScore">) {
  const score = champion.damageScore ?? 0;
  return champion.damageType === "Mixed" ? score / 2 : champion.damageType === "AP" ? score : 0;
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
  const magicDamage = allies.reduce((sum, champion) => sum + magicDamageScore(champion), 0);
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
      tone: "include",
      champions: portraits(steelTargets),
    });
  }
  if (umbralTargets.length > 0) {
    facts.push({
      id: "umbral",
      itemId: UMBRAL_ITEM_ID,
      label: "Strong Against",
      tone: "include",
      champions: portraits(umbralTargets),
    });
  }
  const alliedCc = allies.reduce((sum, champion) => sum + (champion.ccScore ?? 0), 0);
  if (alliedCc < settings.hubrisCcMin && allies.length > 0) {
    facts.push({
      id: "hubris-cc",
      itemId: HUBRIS_ITEM_ID,
      label: "Not enough setup",
      tone: "exclude",
      champions: portraits(allies),
    });
  }
  const resetDeniers = enemies.filter((champion) => champion.deniesResets === true);
  if (resetDeniers.length >= RESET_DENIER_MIN) {
    facts.push({
      id: "reset-denial",
      itemId: HUBRIS_ITEM_ID,
      label: "Reliable disengage",
      tone: "exclude",
      champions: portraits(resetDeniers),
    });
  }
  return facts;
}

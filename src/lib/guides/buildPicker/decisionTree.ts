import type {
  ChampionCcLevel,
  ChampionDamageType,
  ChampionShieldLevel,
  ChampionThreatLevel,
} from "@prisma/client";
import {
  magicDamageScore,
  physicalDamageScore,
  isPhysicalDamage,
  RESET_DENIER_MIN,
} from "./compositionFacts";
import { BOOT_THRESHOLDS, SCORING_THRESHOLDS, type ScoringThresholds } from "./thresholds";
import { applyRuneScoreOverrides } from "./runeScoreOverrides";

/** The trait rows the tree reasons about (a `ChampionProfile` without timestamps). */
export type ChampionTraits = {
  name: string;
  shields: ChampionShieldLevel;
  damageType: ChampionDamageType;
  damageThreat: ChampionThreatLevel;
  deniesResets: boolean;
  cc: ChampionCcLevel;
};

export type TreeParticipant = ChampionTraits & {
  championId: string;
  spellIds: number[];
  perkIds?: number[];
  durabilityScore?: number | null;
  damageScore?: number | null;
  ccScore?: number | null;
  shieldScore?: number | null;
  mercuryTreadsScore?: number | null;
  canBuildSteelcaps?: boolean | null;
  shieldTiming?: string | null;
};

export type TreeContext = {
  allies: TreeParticipant[];
  enemies: TreeParticipant[];
  settings?: ScoringThresholds;
};

const BARRIER = 21;
const GUARDIAN = 8465;
const DARK_HARVEST = 8128;
const FIRST_STRIKE = 8369;
const KAYN_FORM_DURABILITY = 2;

/** Numeric shield bonuses counted in the composition chart and playground table. */
export const BARRIER_SHIELD_SCORE = 1;
export const GUARDIAN_SHIELD_SCORE = 1;

export type ChoiceOption = {
  id: string;
  label: string;
  next: DecisionNode;
};

export type DecisionNode =
  | {
      kind: "choice";
      id: string;
      title: string;
      /** Plain-language rule shown in the tree UI. */
      rule: string;
      pick: (ctx: TreeContext) => { optionId: string; ruleId: string; detail: string };
      options: ChoiceOption[];
    }
  | {
      kind: "build";
      id: string;
      buildId: string;
      reason: string;
    };

export type SerializedTreeOption = {
  id: string;
  label: string;
  next: SerializedTreeNode;
};

/** Function-free copy of the tree for the client. */
export type SerializedTreeNode =
  | { kind: "choice"; id: string; title: string; rule: string; options: SerializedTreeOption[] }
  | { kind: "build"; id: string; buildId: string; reason: string };

export type TreeTraceStep = {
  nodeId: string;
  title: string;
  optionId: string;
  optionLabel: string;
  /** Id of the specific if-line that fired, for the logic table highlight. */
  ruleId: string;
  detail: string;
  /** Later checks still run after an earlier leaf, so the breakdown can show that route. */
  hypothetical?: boolean;
};

export type AlternateRoute = {
  buildId: string;
  reason: string;
};

export type BuildFloatTag = {
  championId: string;
  side: "ally" | "enemy";
  word: string;
  tone: "shield" | "barrier" | "damage" | "tank" | "bruiser" | "squishy" | "survive" | "ad" | "ap" | "cc" | "disengage";
};

export type EnemyComposition = {
  durability: number;
  damage: number;
  cc: number;
  shields: number;
};

export type TreeResult = {
  buildId: string;
  leafId: string;
  reason: string;
  boot: { itemId: number; slot: 2 | 3 | 4 };
  alternative?: { buildId: string; label: string };
  /** Nearby durability and (when close) anti-shield routes, shown in the breakdown. */
  alternates: AlternateRoute[];
  trace: TreeTraceStep[];
  /** Short words for the champions whose traits selected this build. */
  floatTags: BuildFloatTag[];
  /** Enemy-team counts used by the breakdown chart. */
  composition: EnemyComposition;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function countTeam<K extends keyof ChampionTraits>(
  team: TreeParticipant[],
  key: K,
  value: ChampionTraits[K]
): number {
  return team.filter((champion) => champion[key] === value).length;
}

function countEnemies<K extends keyof ChampionTraits>(
  ctx: TreeContext,
  key: K,
  value: ChampionTraits[K]
): number {
  return countTeam(ctx.enemies, key, value);
}

function hasBarrier(participant: Pick<TreeParticipant, "spellIds">) {
  return participant.spellIds.includes(BARRIER);
}

function hasGuardian(participant: Pick<TreeParticipant, "perkIds">) {
  return participant.perkIds?.includes(GUARDIAN) === true;
}

export function extraShieldScore(participant: Pick<TreeParticipant, "spellIds" | "perkIds">) {
  return (hasBarrier(participant) ? BARRIER_SHIELD_SCORE : 0)
    + (hasGuardian(participant) ? GUARDIAN_SHIELD_SCORE : 0);
}

export function teamShieldScore(team: TreeParticipant[]) {
  return scoreSum(team, "shieldScore") + team.reduce((total, champion) => total + extraShieldScore(champion), 0);
}

function treeSettings(ctx: TreeContext) {
  return ctx.settings ?? SCORING_THRESHOLDS;
}

function isLateShield(champion: TreeParticipant) {
  return champion.shieldTiming === "Late" || champion.shields === "Late";
}

function lateShieldScore(team: TreeParticipant[]) {
  return team.reduce(
    (sum, champion) => sum + (isLateShield(champion) ? (champion.shieldScore ?? 0) : 0),
    0
  );
}

function steelcapsAdjustment(ctx: TreeContext) {
  const settings = treeSettings(ctx);
  const physical = ctx.allies.filter(isPhysicalDamage).length;
  const magicDamage = ctx.allies.reduce((sum, champion) => sum + magicDamageScore(champion), 0);
  const steelApplies = physical >= settings.physicalMin && magicDamage < settings.magicDamageMax;
  const eligible = ctx.enemies.filter((champion) => champion.canBuildSteelcaps === true).length;
  const adjustment = steelApplies ? eligible * settings.steelcapsBonus : 0;
  return { physical, magicDamage, steelApplies, eligible, adjustment };
}

function durabilityTotals(ctx: TreeContext) {
  const base = scoreSum(ctx.enemies, "durabilityScore");
  const steel = steelcapsAdjustment(ctx);
  return { base, adjusted: base + steel.adjustment, ...steel };
}

function shieldTotals(ctx: TreeContext) {
  const total = teamShieldScore(ctx.enemies);
  const late = lateShieldScore(ctx.enemies);
  return { total, late, early: total - late };
}

function enemyMagicDamage(ctx: TreeContext) {
  return ctx.enemies.reduce((sum, champion) => sum + magicDamageScore(champion), 0);
}

const SHIELDBOW_COUNTER_CHAMPIONS = new Set(["Khazix", "Kha'Zix", "Talon", "Kayn", "Rengar", "Shaco", "Qiyana"]);
const ASSASSIN_SURVIVABILITY_SHIELD_MAX = 4;

function shieldbowBlockedByAlliedShields(ctx: TreeContext) {
  return teamShieldScore(ctx.allies) > ASSASSIN_SURVIVABILITY_SHIELD_MAX
    && ctx.enemies.some((champion) => SHIELDBOW_COUNTER_CHAMPIONS.has(champion.championId)
      || SHIELDBOW_COUNTER_CHAMPIONS.has(champion.name));
}

function shouldBuildSurvivability(ctx: TreeContext) {
  return !shieldbowBlockedByAlliedShields(ctx)
    && enemyAdChampionDamage(ctx) >= 11
    && countEnemies(ctx, "damageType", "AD") >= 3 && enemyMagicDamage(ctx) <= 4;
}

function enemyAdChampionDamage(ctx: TreeContext) {
  return scoreSum(ctx.enemies.filter((champion) => champion.damageType === "AD"), "damageScore");
}

function shouldBuildAssassinSurvivability(ctx: TreeContext) {
  return enemyAdChampionDamage(ctx) >= 11
    && countEnemies(ctx, "damageType", "AD") >= 3
    && ctx.enemies.some((champion) => champion.damageType === "AD" && champion.spellIds.includes(11)
      && (champion.championId === "Rengar" || champion.championId === "Talon"
        || champion.name === "Rengar" || champion.name === "Talon"))
    && teamShieldScore(ctx.allies) <= ASSASSIN_SURVIVABILITY_SHIELD_MAX;
}

function enemyPhysicalDamage(ctx: TreeContext) {
  return ctx.enemies.reduce((sum, champion) => sum + physicalDamageScore(champion), 0);
}

function shouldBuildMagicSurvivability(ctx: TreeContext) {
  return !shieldbowBlockedByAlliedShields(ctx)
    && countEnemies(ctx, "damageType", "AP") >= 3
    && enemyPhysicalDamage(ctx) <= 4
    && enemyMercsScore(ctx) >= 8;
}

function enemyMercsScore(ctx: TreeContext) {
  return ctx.enemies.reduce((sum, champion) => sum + (champion.mercuryTreadsScore ?? 0), 0);
}

function recommendedBoots(ctx: TreeContext): {
  boot: TreeResult["boot"];
  ruleId: string;
  detail: string;
} {
  const durability = scoreSum(ctx.enemies, "durabilityScore");
  const damage = scoreSum(ctx.enemies, "damageScore");
  const enemyAd = countEnemies(ctx, "damageType", "AD");
  const magic = enemyMagicDamage(ctx);
  const mercs = enemyMercsScore(ctx);
  const detail = `durability ${durability}, ${enemyAd} enemy AD, magic ${magic}, damage ${damage}, mercs ${mercs}`;

  if (shouldBuildAssassinSurvivability(ctx)) {
    return {
      boot: { itemId: 3047, slot: 2 },
      ruleId: "b9",
      detail: `${detail}, enemy AD champion damage ${enemyAdChampionDamage(ctx)}, enemy AD Rengar or Talon with Smite, allied shields ${teamShieldScore(ctx.allies)}`,
    };
  }
  if (shouldBuildSurvivability(ctx)) {
    return { boot: { itemId: 3047, slot: 2 }, ruleId: "b0", detail };
  }
  if (shouldBuildMagicSurvivability(ctx)) {
    return {
      boot: { itemId: 3111, slot: 2 },
      ruleId: "b8",
      detail: `${detail}, ${countEnemies(ctx, "damageType", "AP")} enemy AP, physical ${enemyPhysicalDamage(ctx)}`,
    };
  }

  if (enemyAd >= BOOT_THRESHOLDS.steelcapsAdMin) {
    if (magic < BOOT_THRESHOLDS.steelcapsMagicSecond) {
      return { boot: { itemId: 3047, slot: 2 }, ruleId: "b1", detail };
    }
    if (magic < BOOT_THRESHOLDS.steelcapsMagicThird) {
      return { boot: { itemId: 3047, slot: 3 }, ruleId: "b2", detail };
    }
    if (magic < BOOT_THRESHOLDS.steelcapsMagicFourth) {
      return { boot: { itemId: 3047, slot: 4 }, ruleId: "b3", detail };
    }
  }
  if (mercs >= BOOT_THRESHOLDS.mercsScoreMin) {
    if (damage < BOOT_THRESHOLDS.mercsDamageThird) {
      return { boot: { itemId: 3111, slot: 3 }, ruleId: "b4", detail };
    }
    if (damage < BOOT_THRESHOLDS.mercsDamageFourth) {
      return { boot: { itemId: 3111, slot: 4 }, ruleId: "b5", detail };
    }
  }
  if (durability <= BOOT_THRESHOLDS.swiftiesDurabilityMax) {
    return { boot: { itemId: 3009, slot: 4 }, ruleId: "b6", detail };
  }
  return { boot: { itemId: 3008, slot: 4 }, ruleId: "b7", detail };
}

function resetDenierCount(ctx: TreeContext) {
  return ctx.enemies.filter((champion) => champion.deniesResets).length;
}

const RESET_DENIER_ALTERNATIVE = "Better scaling if you think you can stack it despite their reliable disengage";
const LOW_CC_ALTERNATIVE = "Better scaling if your team has enough CC to set up Hubris stacks";

/** Build-specific pivots take priority over generic nearby-composition fallbacks. */
const BUILD_ALTERNATIVES: Record<string, NonNullable<TreeResult["alternative"]>> = {
  "hubris-ldr": { buildId: "hubris-skip-anti-tank", label: "If you fall behind early" },
  "main-hubris": { buildId: "umbral-collector", label: "If you fall behind early" },
  "yun-tal-ldr": { buildId: "hubris-ldr", label: "If you miss B. F. Sword on first reset" },
  "collector-shieldbow": { buildId: "umbral-collector", label: "If you fall too far behind" },
  "collector-shieldbow-ga": { buildId: "umbral-collector", label: "If you fall too far behind" },
  "sit-serpents-first": { buildId: "sit-serpents", label: "If you want anti-shield later" },
  "sit-serpents-late": { buildId: "sit-serpents", label: "If you want anti-shield earlier" },
};

/** Hubris stacks are unreliable into 2+ reset deniers, so those leaves swap to the safer build. */
function applyResetDenial(
  ctx: TreeContext,
  buildId: string,
  leafId: string,
  reason: string
): { buildId: string; leafId: string; reason: string; alternative?: TreeResult["alternative"] } {
  const resetDeniers = resetDenierCount(ctx);
  if (resetDeniers < RESET_DENIER_MIN) return { buildId, leafId, reason };
  if (buildId === "main-hubris") {
    return {
      buildId: "umbral-collector",
      leafId: "umbral-reset-denial",
      reason: "Two or more reset deniers make Hubris stacks unreliable. Go Umbral into Collector for safer mid-game value.",
      alternative: { buildId: "main-hubris", label: RESET_DENIER_ALTERNATIVE },
    };
  }
  if (buildId === "hubris-ldr") {
    return {
      buildId: "hubris-skip-anti-tank",
      leafId: "collector-ldr-reset-denial",
      reason: "Two or more reset deniers make Hubris stacks unreliable. Go Collector into LDR instead.",
      alternative: { buildId: "hubris-ldr", label: RESET_DENIER_ALTERNATIVE },
    };
  }
  return { buildId, leafId, reason };
}

/** Hubris needs allied CC to stack. Below the threshold, use the safer alternative as primary. */
function applyLowAlliedCc(
  ctx: TreeContext,
  buildId: string,
  leafId: string,
  reason: string,
  alternative?: TreeResult["alternative"]
): { buildId: string; leafId: string; reason: string; alternative?: TreeResult["alternative"] } {
  const alliedCc = scoreSum(ctx.allies, "ccScore");
  if (alliedCc >= treeSettings(ctx).hubrisCcMin) return { buildId, leafId, reason, alternative };
  if (buildId === "main-hubris") {
    return {
      buildId: "umbral-collector",
      leafId: "umbral-low-cc",
      reason: `Allied CC ${alliedCc} is below ${treeSettings(ctx).hubrisCcMin}, so Hubris is hard to stack. Go Umbral into Collector instead.`,
      alternative: { buildId: "main-hubris", label: LOW_CC_ALTERNATIVE },
    };
  }
  if (buildId === "hubris-ldr") {
    return {
      buildId: "hubris-skip-anti-tank",
      leafId: "collector-ldr-low-cc",
      reason: `Allied CC ${alliedCc} is below ${treeSettings(ctx).hubrisCcMin}, so Hubris is hard to stack. Go Collector into LDR instead.`,
      alternative: { buildId: "hubris-ldr", label: LOW_CC_ALTERNATIVE },
    };
  }
  return { buildId, leafId, reason, alternative };
}

/* ------------------------------------------------------------------ */
/* Tree                                                                */
/* ------------------------------------------------------------------ */

function isKayn(champion: Pick<TreeParticipant, "name" | "championId">) {
  return champion.name === "Kayn" || champion.championId === "Kayn";
}

/** Rhaast-shaped Kayn: a real keystone that is not Dark Harvest or First Strike. Missing runes stay at 1. */
function kaynFormDurability(champion: TreeParticipant) {
  if (!isKayn(champion)) return 0;
  const perks = champion.perkIds ?? [];
  if (perks.length === 0) return 0;
  if (perks.includes(DARK_HARVEST) || perks.includes(FIRST_STRIKE)) return 0;
  return KAYN_FORM_DURABILITY;
}

function durabilityOf(champion: TreeParticipant) {
  return (champion.durabilityScore ?? 0) + kaynFormDurability(champion);
}

function scoreSum(
  team: TreeParticipant[],
  key: "durabilityScore" | "damageScore" | "ccScore" | "shieldScore"
) {
  if (key === "durabilityScore") {
    return team.reduce((total, champion) => total + durabilityOf(champion), 0);
  }
  return team.reduce((total, champion) => total + (champion[key] ?? 0), 0);
}

function enemyComposition(ctx: TreeContext): EnemyComposition {
  return {
    durability: scoreSum(ctx.enemies, "durabilityScore"),
    damage: scoreSum(ctx.enemies, "damageScore"),
    cc: scoreSum(ctx.enemies, "ccScore"),
    shields: teamShieldScore(ctx.enemies),
  };
}

const HOW_TANKY: DecisionNode = {
  kind: "choice",
  id: "tanky",
  title: "How tanky?",
  rule: "Base durability 15+ → Titansbane. Adjusted durability (Steelcaps included) at or below 7 → The twink crusher. Otherwise Another Bloodrush starts at 13 durability when enemy physical damage is below 9, at 12 when physical damage is 9 to below 11, and at 11 when physical damage is 11+. Below that cutoff → Sneaky like a cat. Steelcaps never counts toward Titansbane.",
  pick: (ctx) => {
    const settings = treeSettings(ctx);
    const { base, adjusted } = durabilityTotals(ctx);
    const physical = enemyPhysicalDamage(ctx);
    const sneakyMax = settings.bastionMax + (physical < 9 ? 1 : physical >= 11 ? -1 : 0);
    const detail = `base ${base}, adjusted ${adjusted}, physical damage ${physical}, standard Hubris above ${sneakyMax} durability`;
    if (base >= settings.titansMin) return { optionId: "titans", ruleId: "t3", detail };
    if (adjusted <= settings.lethalityMax) return { optionId: "lethality", ruleId: "t1", detail };
    if (adjusted <= sneakyMax) return { optionId: "bastion", ruleId: "t2", detail };
    return { optionId: "hubris", ruleId: "t4", detail };
  },
  options: [
    {
      id: "lethality",
      label: "The twink crusher",
      next: {
        kind: "build",
        id: "twink-crusher",
        buildId: "bastionbreaker-cyclosword",
        reason:
          "Adjusted durability is low enough for full lethality. Go The twink crusher: Umbral Glaive into Voltaic Cyclosword for maximum burst against squishies.",
      },
    },
    {
      id: "bastion",
      label: "Sneaky like a cat",
      next: {
        kind: "build",
        id: "bastionbreaker",
        buildId: "umbral-collector",
        reason:
          "Adjusted durability sits in the former Bastionbreaker band. After the Bastionbreaker nerfs, go Sneaky like a cat: Umbral Glaive into Collector instead.",
      },
    },
    {
      id: "titans",
      label: "Titansbane",
      next: {
        kind: "build",
        id: "hubris-ldr",
        buildId: "hubris-ldr",
        reason:
          "Base durability reaches the Titansbane threshold. Hubris into LDR second so the %pen comes online before they stack armor.",
      },
    },
    {
      id: "hubris",
      label: "Hubris",
      next: {
        kind: "build",
        id: "hubris",
        buildId: "main-hubris",
        reason:
          "Adjusted durability is above the Sneaky like a cat band, but base durability is below Titansbane. Standard Hubris build: scale into max AD and crit, play for three items.",
      },
    },
  ],
};

/**
 * Numeric shield totals. Barrier and Guardian add early points.
 * Shieldbreaker's Path is never a primary pick; it is only offered as an alternative.
 */
const SHIELD_DECISION_TREE: DecisionNode = {
  kind: "choice",
  id: "shields",
  title: "How much shield?",
  rule: "Shield total 7+ and early 7+ → Serpent's first. Shield total 7+ otherwise → delayed Serpent's (Reckoning). Else durability. Shieldbreaker's Path is an alternative, never the primary pick.",
  pick: (ctx) => {
    const settings = treeSettings(ctx);
    const { total, early, late } = shieldTotals(ctx);
    const detail = `${total} shields (${early} early, ${late} late)`;
    if (total >= settings.shield && early >= settings.earlyShield) {
      return { optionId: "first", ruleId: "s1", detail };
    }
    if (total >= settings.shield) return { optionId: "delayed", ruleId: "s4", detail };
    return { optionId: "none", ruleId: "s6", detail };
  },
  options: [
    {
      id: "first",
      label: "Serpent's first",
      next: {
        kind: "build",
        id: "anti-shield-first",
        buildId: "sit-serpents-first",
        reason:
          "You'll be hitting shields in every fight from the first minutes, so Serpent's Fang goes first. Collector second, then the usual LDR into Infinity Edge.",
      },
    },
    {
      id: "delayed",
      label: "Delayed Serpent's",
      next: {
        kind: "build",
        id: "anti-shield-late",
        buildId: "sit-serpents-late",
        reason:
          "The enemy has enough shields to buy Serpent's Fang, but not enough early ones to rush it. Take Collector and LDR first and slot Serpent's Fang third.",
      },
    },
    { id: "none", label: "Not enough", next: HOW_TANKY },
  ],
};

/**
 * With very little damage on either side, Viego gets enough room to DPS.
 * This runs before shields.
 */
const LOW_DAMAGE_DPS: DecisionNode = {
  kind: "choice",
  id: "low-damage-dps",
  title: "Enough room to DPS?",
  rule: "Enemy damage below 12 and allied damage below 12 → Forged Momentum. Otherwise continue to shield checks.",
  pick: (ctx) => {
    const enemyDamage = scoreSum(ctx.enemies, "damageScore");
    const allyDamage = scoreSum(ctx.allies, "damageScore");
    const cap = treeSettings(ctx).forgedMomentumMax;
    const pass = enemyDamage < cap && allyDamage < cap;
    return {
      optionId: pass ? "yes" : "no",
      ruleId: pass ? "d1" : "d2",
      detail: `enemy damage ${enemyDamage}, allied damage ${allyDamage}`,
    };
  },
  options: [
    {
      id: "yes",
      label: "Low-damage game",
      next: {
        kind: "build",
        id: "max-midgame-dps",
        buildId: "yun-tal-ldr",
        reason:
          "Both teams are below the Forged Momentum damage cap, so there is room to DPS. Go Forged Momentum, provided you get B. F. Sword on your first reset.",
      },
    },
    { id: "no", label: "Normal damage", next: SHIELD_DECISION_TREE },
  ],
};

export const VIEGO_DECISION_TREE: DecisionNode = {
  kind: "choice",
  id: "survivability",
  title: "Damage concentrated in one type?",
  rule: "Skip Survivability maxxing when allied shields exceed 4 and the enemy has Kha'Zix, Talon, Kayn, Rengar, Shaco, or Qiyana. Both AD survivability rules require enemy AD champion damage of at least 11. Otherwise first check 3+ AD including AD Rengar or Talon with Smite and allied shields 4 or below for Steelcaps second. Otherwise 3+ AD and magic damage 4 or below for Steelcaps second; 3+ AP, physical damage 4 or below, and Mercs value 8+ for Mercury Treads second.",
  pick: (ctx) => {
    const enemyAd = countEnemies(ctx, "damageType", "AD");
    const qualifies = shouldBuildSurvivability(ctx);
    const magicQualifies = shouldBuildMagicSurvivability(ctx);
    const assassinQualifies = shouldBuildAssassinSurvivability(ctx);
    return {
      optionId: assassinQualifies ? "assassin" : qualifies ? "yes" : magicQualifies ? "magic" : "no",
      ruleId: assassinQualifies ? "v4" : qualifies ? "v1" : magicQualifies ? "v3" : "v2",
      detail: `${enemyAd} AD enemies, magic damage ${enemyMagicDamage(ctx)}, ${countEnemies(ctx, "damageType", "AP")} AP enemies, physical damage ${enemyPhysicalDamage(ctx)}, Mercs value ${enemyMercsScore(ctx)}, allied shields ${teamShieldScore(ctx.allies)}${shieldbowBlockedByAlliedShields(ctx) ? "; Survivability maxxing blocked by allied shields and enemy assassin" : ""}`,
    };
  },
  options: [
    {
      id: "assassin",
      label: "3+ AD including Rengar or Talon with Smite, AD champion damage 11+, allied shields 4 or below",
      next: {
        kind: "build",
        id: "assassin-survivability",
        buildId: "collector-shieldbow-ga",
        reason: "Enemy AD champions total at least 11 damage and at least three enemies are AD, including Rengar or Talon with Smite, and allied shields are 4 or below. This takes priority: Collector, Plated Steelcaps, LDR, Shieldbow, Infinity Edge, then Guardian Angel.",
      },
    },
    {
      id: "yes",
      label: "3+ AD, AD champion damage 11+, and magic damage 4 or below",
      next: {
        kind: "build",
        id: "survivability",
        buildId: "collector-shieldbow-ga",
        reason: "Enemy AD champions total at least 11 damage, at least three enemies are AD, and enemy magic damage is 4 or below. Go Survivability maxxing — AD with Collector, Plated Steelcaps, LDR, Shieldbow, Infinity Edge, then Guardian Angel.",
      },
    },
    {
      id: "magic",
      label: "3+ AP, physical damage 4 or below, Mercs value 8+",
      next: {
        kind: "build",
        id: "magic-survivability",
        buildId: "collector-shieldbow",
        reason: "At least three enemies are AP, enemy physical damage is 4 or below, and Mercury Treads value is at least 8. Go Collector, Mercury Treads, LDR, Shieldbow, Infinity Edge, then Voltaic Cyclosword.",
      },
    },
    { id: "no", label: "Otherwise continue", next: LOW_DAMAGE_DPS },
  ],
};

/* ------------------------------------------------------------------ */
/* Portrait float tags                                                 */
/* ------------------------------------------------------------------ */

function floatTag(
  participant: TreeParticipant,
  side: "ally" | "enemy",
  word: string,
  tone: BuildFloatTag["tone"]
): BuildFloatTag {
  return { championId: participant.championId, side, word, tone };
}

function dedupeFloatTags(tags: BuildFloatTag[]): BuildFloatTag[] {
  const seen = new Set<string>();
  return tags.filter((entry) => {
    const key = `${entry.side}:${entry.championId}:${entry.word}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shieldFloatTags(enemies: TreeParticipant[]): BuildFloatTag[] {
  const seen = new Set<string>();
  const tags: BuildFloatTag[] = [];
  for (const champion of enemies) {
    if (seen.has(champion.championId)) continue;
    const hasScore = (champion.shieldScore ?? 0) > 0;
    const barrier = hasBarrier(champion);
    const guardian = hasGuardian(champion);
    if (!hasScore && !barrier && !guardian) continue;
    seen.add(champion.championId);
    if (hasScore) {
      tags.push(floatTag(champion, "enemy", "Shield", "shield"));
      continue;
    }
    if (barrier) tags.push(floatTag(champion, "enemy", "Barrier", "barrier"));
    if (guardian) tags.push(floatTag(champion, "enemy", "Guardian", "barrier"));
  }
  return tags;
}

function lowDamageFloatTags(ctx: TreeContext): BuildFloatTag[] {
  const isLow = (champion: TreeParticipant) => (champion.damageScore ?? 0) <= 2;
  return [
    ...ctx.enemies.filter(isLow).map((champion) => floatTag(champion, "enemy", "Low dmg", "damage")),
    ...ctx.allies.filter(isLow).map((champion) => floatTag(champion, "ally", "Low dmg", "damage")),
  ];
}

function durabilityLabel(score: number | null | undefined): { word: string; tone: BuildFloatTag["tone"] } | null {
  if (score === 1 || score === 2) return { word: "Squishy", tone: "squishy" };
  if (score === 3) return { word: "Tough", tone: "bruiser" };
  if (score === 4 || score === 5) return { word: "Tanky", tone: "tank" };
  return null;
}

function durabilityFloatTag(champion: TreeParticipant, side: "ally" | "enemy" = "enemy"): BuildFloatTag | null {
  const label = durabilityLabel(champion.durabilityScore);
  return label ? floatTag(champion, side, label.word, label.tone) : null;
}

function durabilityFloatTagsForScores(enemies: TreeParticipant[], scores: number[]): BuildFloatTag[] {
  return enemies.flatMap((champion) => {
    const score = champion.durabilityScore;
    if (score == null || !scores.includes(score)) return [];
    const tag = durabilityFloatTag(champion);
    return tag ? [tag] : [];
  });
}

/** Full-lethality / squishy-focused builds: only 1s and 2s. */
function squishyDecisionFloatTags(enemies: TreeParticipant[]) {
  return durabilityFloatTagsForScores(enemies, [1, 2]);
}

/** Anti-tank builds: 3 is Tough, 4 and 5 are Tanky. */
function antiTankDecisionFloatTags(enemies: TreeParticipant[]) {
  return durabilityFloatTagsForScores(enemies, [3, 4, 5]);
}

function tankFloatTags(ctx: TreeContext, ruleId: string): BuildFloatTag[] {
  if (ruleId === "t1") return squishyDecisionFloatTags(ctx.enemies);
  if (ruleId === "t3" || ruleId === "t4") return antiTankDecisionFloatTags(ctx.enemies);
  return [];
}

function scorePreviewFloatTags(ctx: TreeContext, buildId: string): BuildFloatTag[] {
  if (buildId === "umbral-collector") return squishyDecisionFloatTags(ctx.enemies);
  if (buildId === "sit-serpents-first" || buildId === "sit-serpents-late") {
    return shieldFloatTags(ctx.enemies);
  }
  if (buildId === "yun-tal-ldr") return lowDamageFloatTags(ctx);
  if (buildId === "bastionbreaker-cyclosword") return squishyDecisionFloatTags(ctx.enemies);
  if (buildId === "hubris-ldr" || buildId === "main-hubris") return antiTankDecisionFloatTags(ctx.enemies);
  return [];
}

function buildFloatTags(
  ctx: TreeContext,
  trace: TreeTraceStep[],
  leafId: string,
  originalLeafId: string,
  scoredBuildId: string
): BuildFloatTag[] {
  const decisive = [...trace]
    .reverse()
    .find(
      (step) =>
        !step.hypothetical &&
        step.nodeId !== "boots" &&
        step.nodeId !== "reset-deniers" &&
        step.nodeId !== "allied-cc"
    );
  let tags: BuildFloatTag[] = [];

  if (decisive?.nodeId === "survivability" && (decisive.ruleId === "v1" || decisive.ruleId === "v4")) {
    tags = ctx.enemies
      .filter((champion) => champion.damageType === "AD")
      .map((champion) => floatTag(champion, "enemy", "AD", "ad"));
  } else if (decisive?.nodeId === "survivability" && decisive.ruleId === "v3") {
    tags = ctx.enemies
      .filter((champion) => champion.damageType === "AP")
      .map((champion) => floatTag(champion, "enemy", "AP", "ap"));

  } else if (decisive?.nodeId === "shields" && decisive.ruleId !== "s6") {
    tags = shieldFloatTags(ctx.enemies);
  } else if (decisive?.nodeId === "low-damage-dps" && decisive.ruleId === "d1") {
    tags = lowDamageFloatTags(ctx);
  } else if (decisive?.nodeId === "tanky") {
    tags = tankFloatTags(ctx, decisive.ruleId);
    const physical = enemyPhysicalDamage(ctx);
    const { adjusted } = durabilityTotals(ctx);
    const settings = treeSettings(ctx);
    const blockedByLowPhysical = decisive.ruleId === "t2"
      && physical < 9
      && adjusted > settings.bastionMax
      && adjusted <= settings.bastionMax + 1
      && scoreSum(ctx.allies, "ccScore") >= settings.hubrisCcMin
      && resetDenierCount(ctx) < RESET_DENIER_MIN;
    const enabledByHighPhysical = decisive.ruleId === "t4"
      && leafId === "hubris"
      && physical >= 11
      && adjusted > settings.bastionMax - 1
      && adjusted <= settings.bastionMax;
    if (blockedByLowPhysical || enabledByHighPhysical) {
      const word = blockedByLowPhysical ? "AP" : "AD";
      tags.push(...ctx.enemies
        .filter((champion) => (blockedByLowPhysical ? magicDamageScore(champion) : physicalDamageScore(champion)) > 0)
        .map((champion) => floatTag(champion, "enemy", word, blockedByLowPhysical ? "ap" : "ad")));
    }
  } else if (originalLeafId === "score-preview") {
    tags = scorePreviewFloatTags(ctx, scoredBuildId);
  }

  if (leafId === "umbral-reset-denial" || leafId === "collector-ldr-reset-denial") {
    tags = [
      ...tags,
      ...ctx.enemies
        .filter((champion) => champion.deniesResets)
        .map((champion) => floatTag(champion, "enemy", "Disengage", "disengage")),
    ];
  }

  return dedupeFloatTags(tags);
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

const SHIELD_BUILD_IDS = new Set(["sit-serpents-first", "sit-serpents-late", "sit-serpents"]);
const SHIELD_PROXIMITY = 2;

type BuildLeaf = Extract<DecisionNode, { kind: "build" }>;

function walkChoice(
  ctx: TreeContext,
  start: DecisionNode,
  trace: TreeTraceStep[],
  hypothetical: boolean
): BuildLeaf {
  let node = start;
  while (node.kind === "choice") {
    const { optionId, ruleId, detail } = node.pick(ctx);
    const option = node.options.find((entry) => entry.id === optionId);
    if (!option) throw new Error(`Decision "${node.id}" picked unknown option "${optionId}"`);
    if (!trace.some((step) => step.nodeId === node.id)) {
      trace.push({
        nodeId: node.id,
        title: node.title,
        optionId,
        optionLabel: option.label,
        ruleId,
        detail,
        ...(hypothetical ? { hypothetical: true } : {}),
      });
    }
    node = option.next;
  }
  return node;
}

function finalizeLeaf(
  ctx: TreeContext,
  node: BuildLeaf,
  trace: TreeTraceStep[],
  hypothetical: boolean
) {
  const afterDenial = applyResetDenial(ctx, node.buildId, node.id, node.reason);
  if (afterDenial.buildId !== node.buildId && !trace.some((step) => step.nodeId === "reset-deniers")) {
    trace.push({
      nodeId: "reset-deniers",
      title: "Reset deniers?",
      optionId: "yes",
      optionLabel: "Two or more",
      ruleId: "r1",
      detail: `${resetDenierCount(ctx)} enemy reset deniers`,
      ...(hypothetical ? { hypothetical: true } : {}),
    });
  }
  const resolved = applyLowAlliedCc(
    ctx,
    afterDenial.buildId,
    afterDenial.leafId,
    afterDenial.reason,
    afterDenial.alternative
  );
  if (resolved.buildId !== afterDenial.buildId && !trace.some((step) => step.nodeId === "allied-cc")) {
    trace.push({
      nodeId: "allied-cc",
      title: "Hubris setup?",
      optionId: "low",
      optionLabel: "Not enough CC",
      ruleId: "c1",
      detail: `allied CC ${scoreSum(ctx.allies, "ccScore")}`,
      ...(hypothetical ? { hypothetical: true } : {}),
    });
  }
  return resolved;
}

function walkToResolved(ctx: TreeContext, start: DecisionNode) {
  const leaf = walkChoice(ctx, start, [], false);
  return finalizeLeaf(ctx, leaf, [], false);
}

function alreadyQualifiesForShields(ctx: TreeContext) {
  return shieldTotals(ctx).total >= treeSettings(ctx).shield;
}

function closeToAntiShield(ctx: TreeContext, proximity: number) {
  if (alreadyQualifiesForShields(ctx)) return false;
  const gap = treeSettings(ctx).shield - shieldTotals(ctx).total;
  return gap > 0 && gap <= proximity;
}

function nearbyDurability(
  ctx: TreeContext,
  actualBuildId: string,
  maxDistance = 1,
  actionable = false
): AlternateRoute | null {
  const current = walkToResolved(ctx, HOW_TANKY);
  if (current.buildId !== actualBuildId || ctx.enemies.length === 0) return null;
  for (let distance = 1; distance <= maxDistance; distance++) {
    for (const change of [distance, -distance]) {
      const enemies = ctx.enemies.map((enemy, index) => index === 0
        ? { ...enemy, durabilityScore: (enemy.durabilityScore ?? 0) + change }
        : enemy);
      const nearby = walkToResolved({ ...ctx, enemies }, HOW_TANKY);
      if (nearby.buildId !== actualBuildId) {
        return {
          buildId: nearby.buildId,
          reason: actionable
            ? change > 0 ? "If they build tankier than expected." : "If they build squishier than expected."
            : change > 0 ? "If they had a little more durability." : "If they had a little less durability.",
        };
      }
    }
  }
  return null;
}

function pickDurabilityAlternate(ctx: TreeContext, actualBuildId: string): AlternateRoute | null {
  const durability = walkToResolved(ctx, HOW_TANKY);
  if (durability.buildId !== actualBuildId) {
    return {
      buildId: durability.buildId,
      reason: SHIELD_BUILD_IDS.has(actualBuildId)
        ? "If they had fewer shields, this build would have been better."
        : actualBuildId === "yun-tal-ldr"
          ? "If there had been more damage in the lobby, this build would have been better."
          : "If the earlier checks hadn't applied, this build would have been better.",
    };
  }
  return nearbyDurability(ctx, actualBuildId, 25);
}
function pickShieldAlternate(ctx: TreeContext, actualBuildId: string, proximity = SHIELD_PROXIMITY): AlternateRoute | null {
  if (SHIELD_BUILD_IDS.has(actualBuildId)) return null;
  if (!closeToAntiShield(ctx, proximity)) return null;
  return {
    buildId: "sit-serpents-late",
    reason: "If they build extra shields.",
  };
}

function pickAlternateRoutes(
  ctx: TreeContext,
  actualBuildId: string,
): AlternateRoute[] {
  const durability = pickDurabilityAlternate(ctx, actualBuildId);
  const shield = pickShieldAlternate(ctx, actualBuildId);
  const routes: AlternateRoute[] = [];
  if (durability) routes.push(durability);
  if (shield && shield.buildId !== durability?.buildId) routes.push(shield);
  return routes;
}

function walkRemainingBranches(ctx: TreeContext, trace: TreeTraceStep[]) {
  for (const start of [LOW_DAMAGE_DPS, SHIELD_DECISION_TREE, HOW_TANKY]) {
    if (start.kind !== "choice" || trace.some((step) => step.nodeId === start.id)) continue;
    const leaf = walkChoice(ctx, start, trace, true);
    finalizeLeaf(ctx, leaf, trace, true);
  }
}

export function runDecisionTree(ctx: TreeContext, root: DecisionNode = VIEGO_DECISION_TREE): TreeResult {
  ctx = { ...ctx, allies: ctx.allies.map(applyRuneScoreOverrides), enemies: ctx.enemies.map(applyRuneScoreOverrides) };
  const trace: TreeTraceStep[] = [];
  const node = walkChoice(ctx, root, trace, false);
  const resolved = finalizeLeaf(ctx, node, trace, false);
  walkRemainingBranches(ctx, trace);

  const boots = recommendedBoots(ctx);
  trace.push({
    nodeId: "boots",
    title: "Which boots?",
    optionId: boots.ruleId,
    optionLabel: boots.ruleId,
    ruleId: boots.ruleId,
    detail: boots.detail,
  });
  return {
    buildId: resolved.buildId,
    leafId: resolved.leafId,
    reason: resolved.reason,
    boot: boots.boot,
    alternative: (() => {
      if (resolved.buildId === "collector-shieldbow" || resolved.buildId === "collector-shieldbow-ga") {
        return {
          buildId: resolved.buildId === "collector-shieldbow-ga" ? "survivability-earlier-shieldbow-ad" : "survivability-earlier-shieldbow",
          label: "If you get ahead",
        };
      }
      if (resolved.alternative) return resolved.alternative;
      const buildSpecific = BUILD_ALTERNATIVES[resolved.buildId];
      if (buildSpecific) return buildSpecific;
      const shield = pickShieldAlternate(ctx, resolved.buildId, 1);
      if (shield) return { buildId: shield.buildId, label: "If they build more shields than expected." };
      // Nearby-composition rules fill gaps when no specific alternative is set.
      const nearby = nearbyDurability(ctx, resolved.buildId, 1, true);
      return nearby ? { buildId: nearby.buildId, label: nearby.reason } : undefined;
    })(),
    alternates: pickAlternateRoutes(ctx, resolved.buildId),
    trace,
    floatTags: dedupeFloatTags([
      ...buildFloatTags(ctx, trace, resolved.leafId, node.id, node.buildId),
      ...bootFloatTags(ctx, boots.boot.itemId),
    ]),
    composition: enemyComposition(ctx),
  };
}

function bootFloatTags(ctx: TreeContext, itemId: number): BuildFloatTag[] {
  if (itemId === 3047) {
    return ctx.enemies
      .filter((champion) => champion.damageType === "AD")
      .map((champion) => floatTag(champion, "enemy", "AD", "ad"));
  }
  if (itemId === 3111) {
    return ctx.enemies
      .filter((champion) => (champion.mercuryTreadsScore ?? 0) > 0)
      .map((champion) => floatTag(champion, "enemy", "CC", "cc"));
  }
  if (itemId === 3009) return squishyDecisionFloatTags(ctx.enemies);
  return [];
}

export function serializeTree(node: DecisionNode = VIEGO_DECISION_TREE): SerializedTreeNode {
  if (node.kind === "build") {
    return { kind: "build", id: node.id, buildId: node.buildId, reason: node.reason };
  }
  return {
    kind: "choice",
    id: node.id,
    title: node.title,
    rule: node.rule,
    options: node.options.map((option) => ({
      id: option.id,
      label: option.label,
      next: serializeTree(option.next),
    })),
  };
}

import type {
  ChampionCcLevel,
  ChampionDamageType,
  ChampionDurability,
  ChampionShieldLevel,
  ChampionThreatLevel,
} from "@prisma/client";
import { SHADOW_ECONOMY_CHAMPIONS } from "./compositionFacts";
import { SCORING_THRESHOLDS } from "./thresholds";

/** The trait rows the tree reasons about (a `ChampionProfile` without timestamps). */
export type ChampionTraits = {
  name: string;
  durability: ChampionDurability;
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
};

export type TreeContext = {
  allies: TreeParticipant[];
  enemies: TreeParticipant[];
};

const SMITE = 11;
const BARRIER = 21;
const GUARDIAN = 8465;
const ASSASSIN_JUNGLE = new Set(["Talon", "Rengar"]);

/** Numeric shield bonuses counted in the composition chart and playground table. */
export const BARRIER_SHIELD_SCORE = 2;
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

function enemyAssassinJungle(ctx: TreeContext) {
  return ctx.enemies.some(
    (participant) =>
      participant.spellIds.includes(SMITE) && ASSASSIN_JUNGLE.has(participant.championId)
  );
}

function isShadowEconomyChampion(champion: Pick<TreeParticipant, "name" | "championId">) {
  return SHADOW_ECONOMY_CHAMPIONS.has(champion.name) || SHADOW_ECONOMY_CHAMPIONS.has(champion.championId);
}

function shadowEconomyTargets(team: TreeParticipant[]) {
  return team.filter(isShadowEconomyChampion);
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function recommendedBoots(ctx: TreeContext, buildId: string): {
  boot: TreeResult["boot"];
  ruleId: string;
  detail: string;
} {
  const enemyAd = countEnemies(ctx, "damageType", "AD");
  const enemyAp = countEnemies(ctx, "damageType", "AP");
  const enemySquishy = countEnemies(ctx, "durability", "Squishy");
  const enemyHighCc = countEnemies(ctx, "cc", "High");
  const survivability = buildId === "collector-shieldbow";
  const detail = `${survivability ? "Survivability build" : "Other build"}, ${enemyAd} enemy AD, ${enemyAp} enemy AP, ${enemyHighCc} enemy High CC, ${enemySquishy} enemy squishy`;

  if (survivability && enemyAp >= 4 && enemyHighCc >= 3) {
    return { boot: { itemId: 3111, slot: 2 }, ruleId: "b1", detail };
  }
  if (enemyAd >= 4) return { boot: { itemId: 3047, slot: 2 }, ruleId: "b2", detail };
  if (survivability) return { boot: { itemId: 3047, slot: 3 }, ruleId: "b3", detail };
  if (enemySquishy >= 4) return { boot: { itemId: 3009, slot: 4 }, ruleId: "b4", detail };
  return { boot: { itemId: 3008, slot: 4 }, ruleId: "b5", detail };
}

function resetDenierCount(ctx: TreeContext) {
  return ctx.enemies.filter((champion) => champion.deniesResets).length;
}

const RESET_DENIER_ALTERNATIVE = "Better scaling if you think you can stack it despite their reliable disengage";

/** Hubris stacks are unreliable into 2+ reset deniers, so those leaves swap to the safer build. */
function applyResetDenial(
  ctx: TreeContext,
  buildId: string,
  leafId: string,
  reason: string
): { buildId: string; leafId: string; reason: string; alternative?: TreeResult["alternative"] } {
  const resetDeniers = resetDenierCount(ctx);
  if (resetDeniers < 2) return { buildId, leafId, reason };
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

/* ------------------------------------------------------------------ */
/* Tree                                                                */
/* ------------------------------------------------------------------ */

export const BIG_SHIELD_THRESHOLD = 2;
export const SMALL_SHIELD_THRESHOLD = 5;

function shieldCounts(team: TreeParticipant[]) {
  const big = countTeam(team, "shields", "High");
  const barriers = team.filter(hasBarrier).length;
  const guardians = team.filter(hasGuardian).length;
  const early = countTeam(team, "shields", "Low") + barriers + guardians;
  const late = countTeam(team, "shields", "Late");
  return { big, early, late, barriers, guardians, small: early + late };
}

function shieldDetail(team: TreeParticipant[]) {
  const { big, early, late, barriers, guardians } = shieldCounts(team);
  return `${plural(big, "big shield")}, ${plural(early, "early small shield")} (${barriers} Barrier, ${guardians} Guardian), ${plural(late, "late small shield")}`;
}

function durabilityCounts(ctx: TreeContext) {
  const rawSquishy = countEnemies(ctx, "durability", "Squishy");
  const rawBruiser = countEnemies(ctx, "durability", "Bruiser");
  const tanky = countEnemies(ctx, "durability", "Tanky");
  const allyAd = countTeam(ctx.allies, "damageType", "AD");
  let squishy = rawSquishy;
  let bruiser = rawBruiser;
  /** Your team 3+ AD → enemies buy more armor: count one extra Bruiser (converted from a Squishy when there is one). */
  if (allyAd >= 3) {
    bruiser += 1;
    if (squishy > 0) squishy -= 1;
  }
  return { squishy, bruiser, tanky, allyAd, rawSquishy, rawBruiser };
}

function durabilityDetail(ctx: TreeContext) {
  const { rawSquishy, rawBruiser, tanky, allyAd } = durabilityCounts(ctx);
  return `${rawSquishy} squishy, ${rawBruiser} bruiser, ${tanky} tanky${allyAd >= 3 ? ", 3+ AD allies" : ""}`;
}

function scoreSum(
  team: TreeParticipant[],
  key: "durabilityScore" | "damageScore" | "ccScore" | "shieldScore"
) {
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
  rule: "4+ squishy and 0 tanks → Twin Crusher. 2 bruisers, or 4 squishy + a tank → Bread & Butter Carnage. 2+ tanks or 3+ bruiser+tank → Hubris into LDR. Otherwise Hubris.",
  pick: (ctx) => {
    const { squishy, bruiser, tanky } = durabilityCounts(ctx);
    const frontline = tanky >= 2 || bruiser + tanky >= 3;
    const twinCrusher = squishy >= 4 && tanky === 0;
    const bastion = !frontline && (bruiser === 2 || squishy === 4);
    const optionId = twinCrusher ? "all-squishy" : frontline ? "tanks" : bastion ? "two-bruisers" : "hubris";
    const ruleId = twinCrusher ? "t1" : frontline ? "t3" : bastion ? "t2" : "t4";
    return { optionId, ruleId, detail: durabilityDetail(ctx) };
  },
  options: [
    {
      id: "all-squishy",
      label: "Mostly squishy",
      next: {
        kind: "build",
        id: "twink-crusher",
        buildId: "bastionbreaker-cyclosword",
        reason:
          "Four or five squishies and no tanks. Maximum Lethality: Bastionbreaker into Cyclosword and you one-shot anything you touch.",
      },
    },
    {
      id: "two-bruisers",
      label: "Two bruisers",
      next: {
        kind: "build",
        id: "bastionbreaker",
        buildId: "main-bastionbreaker",
        reason:
          "Two bruisers, not a tank line. Bread & Butter Carnage: strong first spike and you still one-shot the squishies.",
      },
    },
    {
      id: "tanks",
      label: "Two+ tanks",
      next: {
        kind: "build",
        id: "hubris-ldr",
        buildId: "hubris-ldr",
        reason:
          "Multiple real tanks. Hubris into LDR second so the %pen comes online before they stack armor.",
      },
    },
    {
      id: "hubris",
      label: "Bruisers",
      next: {
        kind: "build",
        id: "hubris",
        buildId: "main-hubris",
        reason:
          "Enough durable targets that Lethality alone falls off. Standard Hubris build: scale into max AD and crit, play for three items.",
      },
    },
  ],
};

/** Collector into Shieldbow when Talon/Rengar jungle, your team is light on shields, and the enemy is mostly AD. */
const SURVIVABILITY: DecisionNode = {
  kind: "choice",
  id: "survivability",
  title: "Survivability?",
  rule: "Talon or Rengar jungle (Smite), 2 or fewer ally small shields, no ally High shields, and 3+ enemy AD — or 4+ enemy AP plus 3+ enemy High CC.",
  pick: (ctx) => {
    const ally = shieldCounts(ctx.allies);
    const enemyAd = countEnemies(ctx, "damageType", "AD");
    const enemyAp = countEnemies(ctx, "damageType", "AP");
    const enemyHighCc = countEnemies(ctx, "cc", "High");
    const assassin = enemyAssassinJungle(ctx);
    const physicalSurvival = assassin && ally.small <= 2 && ally.big === 0 && enemyAd >= 3;
    const magicSurvival = enemyAp >= 4 && enemyHighCc >= 3;
    const pass = physicalSurvival || magicSurvival;
    const jungler = ctx.enemies.find((participant) => participant.spellIds.includes(SMITE));
    return {
      optionId: pass ? "yes" : "no",
      ruleId: pass ? "v1" : "v2",
      detail: `${jungler?.championId ?? "no Smite"} jungle, ${ally.small} ally small shields, ${ally.big} ally high shields, ${enemyAd} enemy AD, ${enemyAp} enemy AP, ${enemyHighCc} enemy High CC`,
    };
  },
  options: [
    {
      id: "yes",
      label: "Survivability",
      next: {
        kind: "build",
        id: "survivability",
        buildId: "collector-shieldbow",
        reason:
          "Either Talon or Rengar jungle plus a mostly-AD enemy with little ally shielding, or a mostly-AP enemy with heavy CC. Collector into Shieldbow so you don't get deleted in the first fight.",
      },
    },
    { id: "no", label: "No", next: HOW_TANKY },
  ],
};

/**
 * One shield question, three answers:
 *  - first: 2+ big, or 1 big + 2+ small, or 5+ early small
 *  - delayed: 5+ small otherwise (including late majority)
 *  - none: not enough shields → survivability check, then durability
 * Shieldbreaker's Path is never a primary pick; it is only offered as an alternative.
 */
const SHIELD_DECISION_TREE: DecisionNode = {
  kind: "choice",
  id: "shields",
  title: "How much shield?",
  rule: "2+ big, 1 big + 2 small, or 5+ early small → Serpent's first. 5+ small otherwise → delayed Serpent's (Reckoning). Else survivability, then durability. Barrier and Guardian each count as an early small shield. Guardian adds one, not two. Shieldbreaker's Path is an alternative, never the primary pick.",
  pick: (ctx) => {
    const { big, early, small } = shieldCounts(ctx.enemies);
    const detail = shieldDetail(ctx.enemies);
    if (big >= BIG_SHIELD_THRESHOLD) return { optionId: "first", ruleId: "s1", detail };
    if (big >= 1 && small >= 2) return { optionId: "first", ruleId: "s2", detail };
    if (early >= 5) return { optionId: "first", ruleId: "s3", detail };
    if (small >= SMALL_SHIELD_THRESHOLD) return { optionId: "delayed", ruleId: "s4", detail };
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
    { id: "none", label: "Not enough", next: SURVIVABILITY },
  ],
};

/**
 * With very little damage on either side, Viego gets enough room to DPS.
 * This runs before the other checks: it is an intentional build identity,
 * not a fallback based on shields or durability alone.
 */
const LOW_DAMAGE_DPS: DecisionNode = {
  kind: "choice",
  id: "low-damage-dps",
  title: "Enough room to DPS?",
  rule: "4+ enemy champions with Low damage and 3+ allied champions with Low damage → Forged Momentum. Otherwise continue to shield checks.",
  pick: (ctx) => {
    const enemyLowDamage = countEnemies(ctx, "damageThreat", "Low");
    const allyLowDamage = countTeam(ctx.allies, "damageThreat", "Low");
    const pass = enemyLowDamage >= 4 && allyLowDamage >= 3;
    return {
      optionId: pass ? "yes" : "no",
      ruleId: pass ? "d1" : "d2",
      detail: `${enemyLowDamage} enemy Low damage, ${allyLowDamage} ally Low damage`,
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
          "Four or five low-damage enemies and at least three low-damage allies give you room to DPS. Go Forged Momentum, provided you get B. F. Sword on your first reset.",
      },
    },
    { id: "no", label: "Normal damage", next: SHIELD_DECISION_TREE },
  ],
};

/** Shaco / Evelynn / Rengar take Shadow Economy unless Titansbane already wins on durability. */
const SHADOW_ECONOMY: DecisionNode = {
  kind: "choice",
  id: "shadow-economy",
  title: "Shadow Economy?",
  rule: "Shaco, Evelynn, or Rengar on the enemy team, and enemy durability below the Titansbane threshold → Shadow Economy. Otherwise continue.",
  pick: (ctx) => {
    const targets = shadowEconomyTargets(ctx.enemies);
    const durability = scoreSum(ctx.enemies, "durabilityScore");
    const pass = targets.length > 0 && durability < SCORING_THRESHOLDS.titansMin;
    return {
      optionId: pass ? "yes" : "no",
      ruleId: pass ? "u1" : "u2",
      detail: targets.length
        ? `${targets.map((champion) => champion.name).join(", ")}, durability ${durability}`
        : `no Shaco/Evelynn/Rengar, durability ${durability}`,
    };
  },
  options: [
    {
      id: "yes",
      label: "Stealth assassin",
      next: {
        kind: "build",
        id: "shadow-economy",
        buildId: "umbral-collector",
        reason:
          "Shaco, Evelynn, or Rengar is on the enemy team, and the lobby is not tanky enough for Titansbane. Shadow Economy is the primary build: Umbral Glaive into Collector.",
      },
    },
    { id: "no", label: "No", next: LOW_DAMAGE_DPS },
  ],
};

export const VIEGO_DECISION_TREE: DecisionNode = SHADOW_ECONOMY;

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

function shieldFloatTags(enemies: TreeParticipant[], ruleId: string): BuildFloatTag[] {
  const high = enemies.filter((champion) => champion.shields === "High");
  const low = enemies.filter((champion) => champion.shields === "Low");
  const late = enemies.filter((champion) => champion.shields === "Late");
  const extras = enemies.filter((champion) => hasBarrier(champion) || hasGuardian(champion));
  const small = [...low, ...late, ...extras];
  const picked =
    ruleId === "s1" ? high : ruleId === "s2" ? [...high, ...small] : ruleId === "s3" ? [...low, ...extras] : small;

  const seen = new Set<string>();
  const tags: BuildFloatTag[] = [];
  for (const champion of picked) {
    if (seen.has(champion.championId)) continue;
    seen.add(champion.championId);
    if (champion.shields !== "None") {
      tags.push(floatTag(champion, "enemy", "Shield", "shield"));
      continue;
    }
    if (hasBarrier(champion)) tags.push(floatTag(champion, "enemy", "Barrier", "barrier"));
    if (hasGuardian(champion)) tags.push(floatTag(champion, "enemy", "Guardian", "barrier"));
  }
  return tags;
}

function lowDamageFloatTags(ctx: TreeContext): BuildFloatTag[] {
  return [
    ...ctx.enemies
      .filter((champion) => champion.damageThreat === "Low")
      .map((champion) => floatTag(champion, "enemy", "Low dmg", "damage")),
    ...ctx.allies
      .filter((champion) => champion.damageThreat === "Low")
      .map((champion) => floatTag(champion, "ally", "Low dmg", "damage")),
  ];
}

function surviveFloatTags(ctx: TreeContext): BuildFloatTag[] {
  const ally = shieldCounts(ctx.allies);
  const enemyAd = countEnemies(ctx, "damageType", "AD");
  const enemyAp = countEnemies(ctx, "damageType", "AP");
  const enemyHighCc = countEnemies(ctx, "cc", "High");
  const physical = enemyAssassinJungle(ctx) && ally.small <= 2 && ally.big === 0 && enemyAd >= 3;
  const magic = enemyAp >= 4 && enemyHighCc >= 3;
  const tags: BuildFloatTag[] = [];

  if (physical) {
    for (const champion of ctx.enemies) {
      if (champion.spellIds.includes(SMITE) && ASSASSIN_JUNGLE.has(champion.championId)) {
        tags.push(floatTag(champion, "enemy", "Survive", "survive"));
      } else if (champion.damageType === "AD") {
        tags.push(floatTag(champion, "enemy", "AD", "ad"));
      }
    }
  }
  if (magic) {
    for (const champion of ctx.enemies) {
      if (champion.damageType === "AP") tags.push(floatTag(champion, "enemy", "AP", "ap"));
      if (champion.cc === "High") tags.push(floatTag(champion, "enemy", "CC", "cc"));
    }
  }
  return tags;
}

function durabilityLabel(score: number | null | undefined): { word: string; tone: BuildFloatTag["tone"] } | null {
  if (score === 1 || score === 2) return { word: "Squishy", tone: "squishy" };
  if (score === 3) return { word: "Durable", tone: "bruiser" };
  if (score === 4) return { word: "Tough", tone: "bruiser" };
  if (score === 5) return { word: "Tank", tone: "tank" };
  return null;
}

function durabilityFloatTag(champion: TreeParticipant, side: "ally" | "enemy" = "enemy"): BuildFloatTag | null {
  const label = durabilityLabel(champion.durabilityScore);
  return label ? floatTag(champion, side, label.word, label.tone) : null;
}

function durabilityFloatTags(enemies: TreeParticipant[]): BuildFloatTag[] {
  return enemies.flatMap((champion) => {
    const tag = durabilityFloatTag(champion);
    return tag ? [tag] : [];
  });
}

function tankFloatTags(ctx: TreeContext, ruleId: string): BuildFloatTag[] {
  const { squishy, bruiser, tanky, allyAd } = durabilityCounts(ctx);
  const of = (value: TreeParticipant["durability"]) =>
    ctx.enemies
      .filter((champion) => champion.durability === value)
      .flatMap((champion) => {
        const tag = durabilityFloatTag(champion);
        return tag ? [tag] : [];
      });

  let tags: BuildFloatTag[];
  if (ruleId === "t1") tags = of("Squishy");
  else if (ruleId === "t3") {
    tags = [];
    if (tanky >= 2) tags.push(...of("Tanky"));
    if (bruiser + tanky >= 3) {
      tags.push(...of("Tanky"), ...of("Bruiser"));
    }
  } else if (ruleId === "t2") {
    tags = [];
    if (bruiser === 2) tags.push(...of("Bruiser"));
    if (squishy === 4) tags.push(...of("Squishy"), ...of("Tanky"));
  } else {
    tags = [...of("Bruiser"), ...of("Tanky")];
  }

  if (allyAd >= 3) {
    tags.push(
      ...ctx.allies
        .filter((champion) => champion.damageType === "AD")
        .map((champion) => floatTag(champion, "ally", "AD", "ad"))
    );
  }
  return tags;
}

function buildFloatTags(ctx: TreeContext, trace: TreeTraceStep[], leafId: string): BuildFloatTag[] {
  const decisive = [...trace].reverse().find((step) => step.nodeId !== "boots");
  let tags: BuildFloatTag[] = [];

  if (decisive?.nodeId === "shadow-economy" && decisive.ruleId === "u1") {
    tags = shadowEconomyTargets(ctx.enemies).map((champion) =>
      floatTag(champion, "enemy", "Stealth", "disengage")
    );
  } else if (decisive?.nodeId === "shields" && decisive.ruleId !== "s6") {
    tags = shieldFloatTags(ctx.enemies, decisive.ruleId);
  } else if (decisive?.nodeId === "low-damage-dps" && decisive.ruleId === "d1") {
    tags = lowDamageFloatTags(ctx);
  } else if (decisive?.nodeId === "survivability" && decisive.ruleId === "v1") {
    tags = surviveFloatTags(ctx);
  } else if (decisive?.nodeId === "tanky") {
    tags = tankFloatTags(ctx, decisive.ruleId);
  } else if (leafId === "score-preview") {
    tags = durabilityFloatTags(ctx.enemies);
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

export function runDecisionTree(ctx: TreeContext, root: DecisionNode = VIEGO_DECISION_TREE): TreeResult {
  const trace: TreeTraceStep[] = [];
  let node = root;
  while (node.kind === "choice") {
    const { optionId, ruleId, detail } = node.pick(ctx);
    const option = node.options.find((entry) => entry.id === optionId);
    if (!option) throw new Error(`Decision "${node.id}" picked unknown option "${optionId}"`);
    trace.push({
      nodeId: node.id,
      title: node.title,
      optionId,
      optionLabel: option.label,
      ruleId,
      detail,
    });
    node = option.next;
  }
  const resolved = applyResetDenial(ctx, node.buildId, node.id, node.reason);
  let buildId = resolved.buildId;
  let leafId = resolved.leafId;
  let reason = resolved.reason;
  let alternative = resolved.alternative;

  if (resolved.buildId !== node.buildId) {
    trace.push({
      nodeId: "reset-deniers",
      title: "Reset deniers?",
      optionId: "yes",
      optionLabel: "Two or more",
      ruleId: "r1",
      detail: `${resetDenierCount(ctx)} enemy reset deniers`,
    });
  }

  const boots = recommendedBoots(ctx, buildId);
  trace.push({
    nodeId: "boots",
    title: "Which boots?",
    optionId: boots.ruleId,
    optionLabel: boots.ruleId,
    ruleId: boots.ruleId,
    detail: boots.detail,
  });
  return {
    buildId,
    leafId,
    reason,
    boot: boots.boot,
    alternative,
    trace,
    floatTags: buildFloatTags(ctx, trace, leafId),
    composition: enemyComposition(ctx),
  };
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

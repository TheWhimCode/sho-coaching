import type {
  ChampionCcLevel,
  ChampionDamageType,
  ChampionDurability,
  ChampionShieldLevel,
  ChampionThreatLevel,
} from "@prisma/client";

/** The trait rows the tree reasons about (a `ChampionProfile` without timestamps). */
export type ChampionTraits = {
  name: string;
  durability: ChampionDurability;
  shields: ChampionShieldLevel;
  damageType: ChampionDamageType;
  damageThreat: ChampionThreatLevel;
  cc: ChampionCcLevel;
};

export type TreeParticipant = ChampionTraits & {
  championId: string;
  spellIds: number[];
};

export type TreeContext = {
  allies: TreeParticipant[];
  enemies: TreeParticipant[];
};

const SMITE = 11;
const BARRIER = 21;
const ASSASSIN_JUNGLE = new Set(["Talon", "Rengar"]);

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

export type TreeResult = {
  buildId: string;
  leafId: string;
  reason: string;
  trace: TreeTraceStep[];
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

function hasBarrier(participant: TreeParticipant) {
  return participant.spellIds.includes(BARRIER);
}

function enemyAssassinJungle(ctx: TreeContext) {
  return ctx.enemies.some(
    (participant) =>
      participant.spellIds.includes(SMITE) && ASSASSIN_JUNGLE.has(participant.championId)
  );
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------ */
/* Tree                                                                */
/* ------------------------------------------------------------------ */

export const BIG_SHIELD_THRESHOLD = 2;
export const SMALL_SHIELD_THRESHOLD = 4;

function shieldCounts(team: TreeParticipant[]) {
  const big = countTeam(team, "shields", "High");
  const barriers = team.filter(hasBarrier).length;
  const early = countTeam(team, "shields", "Low") + barriers;
  const late = countTeam(team, "shields", "Late");
  return { big, early, late, barriers, small: early + late };
}

function shieldDetail(team: TreeParticipant[]) {
  const { big, early, late, barriers } = shieldCounts(team);
  return `${plural(big, "big shield")}, ${plural(early, "early small shield")} (${barriers} Barrier), ${plural(late, "late small shield")}`;
}

function durabilityCounts(ctx: TreeContext) {
  let squishy = countEnemies(ctx, "durability", "Squishy");
  let bruiser = countEnemies(ctx, "durability", "Bruiser");
  const tanky = countEnemies(ctx, "durability", "Tanky");
  const allyAd = countTeam(ctx.allies, "damageType", "AD");
  /** Your team 3+ AD → enemies buy more armor: count one extra Bruiser (converted from a Squishy when there is one). */
  if (allyAd >= 3) {
    bruiser += 1;
    if (squishy > 0) squishy -= 1;
  }
  return { squishy, bruiser, tanky, allyAd };
}

function durabilityDetail(ctx: TreeContext) {
  const { squishy, bruiser, tanky, allyAd } = durabilityCounts(ctx);
  return `${squishy} squishy, ${bruiser} bruiser, ${tanky} tanky${allyAd >= 3 ? ` (ally ${allyAd} AD → +1 bruiser)` : ""}`;
}

const HOW_TANKY: DecisionNode = {
  kind: "choice",
  id: "tanky",
  title: "How tanky?",
  rule: "4+ squishy and 0 tanks → Twin Crusher. 2 bruisers, or 4 squishy + a tank → Bastionbreaker. 2+ tanks or 3+ bruiser+tank → Hubris into LDR. Otherwise Hubris.",
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
          "Two bruisers, not a tank line. Standard Bastionbreaker: strong first spike and you still one-shot the squishies.",
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
  rule: "Enemy jungler is Talon or Rengar (Smite), your team has 2 or fewer small shields and no High shields, and 3+ enemy AD.",
  pick: (ctx) => {
    const ally = shieldCounts(ctx.allies);
    const enemyAd = countEnemies(ctx, "damageType", "AD");
    const assassin = enemyAssassinJungle(ctx);
    const pass = assassin && ally.small <= 2 && ally.big === 0 && enemyAd >= 3;
    const jungler = ctx.enemies.find((participant) => participant.spellIds.includes(SMITE));
    return {
      optionId: pass ? "yes" : "no",
      ruleId: pass ? "v1" : "v2",
      detail: `${jungler?.championId ?? "no Smite"} jungle, ${ally.small} ally small shields, ${ally.big} ally high shields, ${enemyAd} enemy AD`,
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
          "Talon or Rengar jungle plus a mostly-AD enemy, and your team isn't shielding you. Collector into Shieldbow so you don't get deleted in the first fight.",
      },
    },
    { id: "no", label: "No", next: HOW_TANKY },
  ],
};

/**
 * One shield question, four answers:
 *  - first: 2+ big, or 1 big + 2+ small, or 4+ early small
 *  - delayed: 4+ small and more late than early
 *  - second: 4+ small otherwise
 *  - none: not enough shields → survivability check, then durability
 */
export const VIEGO_DECISION_TREE: DecisionNode = {
  kind: "choice",
  id: "shields",
  title: "How much shield?",
  rule: "2+ big, 1 big + 2 small, or 4+ early small → Serpent's first. 4+ small with late majority → delayed. 4+ small otherwise → Serpent's second. Else survivability, then durability. Barrier counts as an early small shield.",
  pick: (ctx) => {
    const { big, early, late, small } = shieldCounts(ctx.enemies);
    const detail = shieldDetail(ctx.enemies);
    if (big >= BIG_SHIELD_THRESHOLD) return { optionId: "first", ruleId: "s1", detail };
    if (big >= 1 && small >= 2) return { optionId: "first", ruleId: "s2", detail };
    if (early >= 4) return { optionId: "first", ruleId: "s3", detail };
    if (small >= SMALL_SHIELD_THRESHOLD && late > early) return { optionId: "delayed", ruleId: "s4", detail };
    if (small >= SMALL_SHIELD_THRESHOLD) return { optionId: "second", ruleId: "s5", detail };
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
      id: "second",
      label: "Serpent's second",
      next: {
        kind: "build",
        id: "anti-shield",
        buildId: "sit-serpents",
        reason:
          "The enemy team stacks shields from early on, so you'll almost always hit one when you fight. Serpent's Fang second cuts through them and still gets you to LDR fast.",
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
          "Most of the enemy shields only show up later in the game, so there's no rush. Take Collector and LDR first and slot Serpent's Fang third when the shields start mattering.",
      },
    },
    { id: "none", label: "Not enough", next: SURVIVABILITY },
  ],
};

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
  return { buildId: node.buildId, leafId: node.id, reason: node.reason, trace };
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

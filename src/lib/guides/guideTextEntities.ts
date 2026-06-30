export const GUIDE_CONQUEROR_ORANGE = "#F97316";
export const GUIDE_DARK_RED = "#B01212";
export const GUIDE_SHIELDBOW_RED = "#FF2222";
export const GUIDE_KRAKEN_GOLD = "#F5B800";
export const GUIDE_STEELCAPS_BROWN = "#A67C4E";
export const GUIDE_HUBRIS_BROWN = "#C86B10";
export const GUIDE_SERPENTS_GRAY = "#C5DDD0";
export const GUIDE_LDR_GRAY = "#B4BEC8";
export const GUIDE_COLLECTOR_BLUE = "#3B82F6";
export const GUIDE_SERAPHS_BLUE = "#60A5FA";
export const GUIDE_ZHONYAS_BLUE = "#4478F0";
export const GUIDE_FROST_BLUE = "#67E8F9";

export type GuideTextEntityIcon =
  | { kind: "item"; id: string }
  | { kind: "rune"; id: number }
  | { kind: "spell"; id: number }
  | { kind: "stat"; name: string };

export type GuideTextEntity = {
  patterns: string[];
  matchKey: string;
  icon?: GuideTextEntityIcon;
  iconShape?: "round" | "square";
  color?: string;
  /** When set, only this trailing substring of the match is colored. */
  colorSuffix?: string;
  weight?: number;
  boldOnly?: boolean;
};

/** Longest patterns win — list multi-word names before short aliases. */
export const GUIDE_TEXT_ENTITIES: GuideTextEntity[] = [
  {
    patterns: ["How is nobody punishing you?"],
    matchKey: "how is nobody punishing you?",
    boldOnly: true,
  },
  { patterns: ["already transforming"], matchKey: "already transforming", boldOnly: true },
  { patterns: ["time-to-kill"], matchKey: "time-to-kill", color: GUIDE_DARK_RED, weight: 800 },
  {
    patterns: ["Voltaic Cyclosword", "Cyclosword", "Cyclo"],
    matchKey: "cyclosword",
    color: GUIDE_SHIELDBOW_RED,
    icon: { kind: "item", id: "6699" },
  },
  {
    patterns: ["Serpent's Fang", "Serpents"],
    matchKey: "serpents-fang",
    color: GUIDE_SERPENTS_GRAY,
    icon: { kind: "item", id: "6695" },
  },
  {
    patterns: ["Death's Dance"],
    matchKey: "deaths-dance",
    color: GUIDE_CONQUEROR_ORANGE,
    icon: { kind: "item", id: "6333" },
  },
  {
    patterns: ["Immortal Shieldbow", "Shieldbows", "Shieldbow"],
    matchKey: "shieldbow",
    color: GUIDE_SHIELDBOW_RED,
    icon: { kind: "item", id: "6673" },
  },
  {
    patterns: ["Plated Steelcaps", "Steelcaps"],
    matchKey: "steelcaps",
    color: GUIDE_STEELCAPS_BROWN,
    icon: { kind: "item", id: "3047" },
  },
  {
    patterns: ["Armored Advance"],
    matchKey: "armored-advance",
    color: GUIDE_STEELCAPS_BROWN,
    icon: { kind: "item", id: "3174" },
  },
  {
    patterns: ["Kraken Slayer", "Kraken"],
    matchKey: "kraken",
    color: GUIDE_KRAKEN_GOLD,
    icon: { kind: "item", id: "6672" },
  },
  {
    patterns: ["The Collector", "Collector"],
    matchKey: "collector",
    color: GUIDE_COLLECTOR_BLUE,
    icon: { kind: "item", id: "6676" },
  },
  {
    patterns: ["Serrated Dirk", "Dirk"],
    matchKey: "dirk",
    icon: { kind: "item", id: "3134" },
  },
  {
    patterns: ["Youmuu's Ghostblade", "Youmuu's"],
    matchKey: "youmuus",
    icon: { kind: "item", id: "3142" },
  },
  {
    patterns: ["Seraph's Embrace", "Seraph's", "Seraphs"],
    matchKey: "seraphs",
    color: GUIDE_SERAPHS_BLUE,
    icon: { kind: "item", id: "3040" },
  },
  {
    patterns: ["Sterak's Gage", "Sterak's", "Steraks"],
    matchKey: "steraks",
    color: GUIDE_DARK_RED,
    icon: { kind: "item", id: "3053" },
  },
  {
    patterns: ["Locket of the Iron Solari", "Locket"],
    matchKey: "locket",
    color: "#CA8A04",
    icon: { kind: "item", id: "3190" },
  },
  {
    patterns: ["Guardian Angel"],
    matchKey: "guardian-angel",
    icon: { kind: "item", id: "3026" },
  },
  {
    patterns: ["Zhonya's Hourglass", "Zhonya's", "Zhonyas"],
    matchKey: "zhonyas",
    color: GUIDE_ZHONYAS_BLUE,
    icon: { kind: "item", id: "3157" },
  },
  {
    patterns: ["Frozen Heart"],
    matchKey: "frozen-heart",
    color: GUIDE_FROST_BLUE,
    icon: { kind: "item", id: "3110" },
  },
  {
    patterns: ["Control Ward"],
    matchKey: "control-ward",
    color: GUIDE_SHIELDBOW_RED,
    icon: { kind: "item", id: "2055" },
  },
  {
    patterns: ["Oracle Lens", "Sweeper", "sweeper"],
    matchKey: "sweeper",
    color: GUIDE_SHIELDBOW_RED,
    icon: { kind: "item", id: "3364" },
  },
  {
    patterns: ["Quicksilver Sash"],
    matchKey: "quicksilver-sash",
    icon: { kind: "item", id: "3140" },
  },
  {
    patterns: ["Infinity Edge"],
    matchKey: "infinity-edge",
    color: GUIDE_KRAKEN_GOLD,
    icon: { kind: "item", id: "3031" },
  },
  {
    patterns: ["Lord Dominik's Regards"],
    matchKey: "lord-dominiks",
    color: GUIDE_LDR_GRAY,
    icon: { kind: "item", id: "3036" },
  },
  { patterns: ["Hubris"], matchKey: "hubris", color: GUIDE_HUBRIS_BROWN, icon: { kind: "item", id: "6697" } },
  {
    patterns: ["Hail of Blades"],
    matchKey: "hail-of-blades",
    color: GUIDE_SHIELDBOW_RED,
    icon: { kind: "rune", id: 9923 },
    iconShape: "round",
  },
  { patterns: ["Conqueror", "Conq"], matchKey: "conqueror", color: GUIDE_CONQUEROR_ORANGE, icon: { kind: "rune", id: 8010 }, iconShape: "round" },
  {
    patterns: ["lethality"],
    matchKey: "lethality",
    color: GUIDE_SHIELDBOW_RED,
    weight: 800,
    icon: { kind: "stat", name: "lethality" },
  },
  {
    patterns: ["armorpen", "Armorpen", "Armor Pen", "Armor Penetration", "armor penetration"],
    matchKey: "armorpen",
    color: GUIDE_SHIELDBOW_RED,
    weight: 800,
    icon: { kind: "stat", name: "armor penetration" },
  },
  {
    patterns: ["%pen"],
    matchKey: "%pen",
    color: GUIDE_SHIELDBOW_RED,
    weight: 800,
    icon: { kind: "stat", name: "armor penetration" },
  },
  {
    patterns: ["\\bAD\\b"],
    matchKey: "ad",
    color: GUIDE_CONQUEROR_ORANGE,
    icon: { kind: "stat", name: "attack damage" },
  },
  { patterns: ["exposure"], matchKey: "exposure", boldOnly: true },
  { patterns: ["\\bHOB\\b"], matchKey: "hob", color: GUIDE_SHIELDBOW_RED, icon: { kind: "rune", id: 9923 }, iconShape: "round" },
  { patterns: ["\\bLDR\\b"], matchKey: "ldr", color: GUIDE_LDR_GRAY, icon: { kind: "item", id: "3036" } },
  {
    patterns: ["Cloak of Agility", "Cloak"],
    matchKey: "cloak-of-agility",
    icon: { kind: "item", id: "1018" },
  },
  { patterns: ["\\bIE\\b"], matchKey: "ie", color: GUIDE_KRAKEN_GOLD, icon: { kind: "item", id: "3031" } },
  { patterns: ["\\bDD\\b"], matchKey: "dd", color: GUIDE_CONQUEROR_ORANGE, icon: { kind: "item", id: "6333" } },
  { patterns: ["\\bGA\\b"], matchKey: "ga", icon: { kind: "item", id: "3026" } },
  { patterns: ["\\bQSS\\b"], matchKey: "qss", icon: { kind: "item", id: "3140" } },
  {
    patterns: ["\\bvision\\b"],
    matchKey: "vision",
    color: GUIDE_SHIELDBOW_RED,
    icon: { kind: "item", id: "2055" },
  },
  { patterns: ["Flash"], matchKey: "flash", color: "#FFE566", icon: { kind: "spell", id: 4 } },
  {
    patterns: ["Ignite"],
    matchKey: "ignite",
    color: GUIDE_CONQUEROR_ORANGE,
    icon: { kind: "spell", id: 14 },
  },
  {
    patterns: ["Green Smite", "Greensmite"],
    matchKey: "green-smite",
    color: "#4ADE80",
    icon: { kind: "item", id: "1103" },
  },
  { patterns: ["Smite"], matchKey: "smite", icon: { kind: "spell", id: 11 } },
  {
    patterns: ["Barrier"],
    matchKey: "barrier",
    color: "#FFE566",
    icon: { kind: "spell", id: 21 },
  },
];

export type FlatGuideTextTerm = {
  pattern: string;
  regex?: boolean;
  matchKey: string;
  icon?: GuideTextEntityIcon;
  iconShape?: "round" | "square";
  color?: string;
  weight?: number;
  boldOnly?: boolean;
};

export function flattenGuideTextEntities(): FlatGuideTextTerm[] {
  const terms: FlatGuideTextTerm[] = [];

  for (const entity of GUIDE_TEXT_ENTITIES) {
    for (const pattern of entity.patterns) {
      terms.push({
        pattern,
        regex: pattern.startsWith("\\b"),
        matchKey: entity.matchKey,
        icon: entity.icon,
        iconShape: entity.iconShape,
        color: entity.color,
        weight: entity.weight,
        boldOnly: entity.boldOnly,
      });
    }
  }

  return terms.sort((a, b) => b.pattern.length - a.pattern.length);
}

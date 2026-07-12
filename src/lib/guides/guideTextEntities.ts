export const GUIDE_CONQUEROR_ORANGE = "#F97316";
export const GUIDE_DARK_RED = "#B01212";
export const GUIDE_SHIELDBOW_RED = "#FF2222";
export const GUIDE_KRAKEN_GOLD = "#F5B800";
export const GUIDE_GA_BEIGE = "#F5E6D3";
export const GUIDE_STEELCAPS_BROWN = "#A67C4E";
export const GUIDE_HUBRIS_BROWN = "#C86B10";
export const GUIDE_SERPENTS_GRAY = "#C5DDD0";
export const GUIDE_LDR_GRAY = "#B4BEC8";
export const GUIDE_COLLECTOR_BLUE = "#3B82F6";
export const GUIDE_SERAPHS_BLUE = "#60A5FA";
export const GUIDE_ZHONYAS_BLUE = "#4478F0";
export const GUIDE_FROST_BLUE = "#67E8F9";
export const GUIDE_AP_PURPLE = "#A855F7";
export const GUIDE_AS_YELLOW = "#EAB308";
export const GUIDE_MS_GREEN = "#4ADE80";
export const GUIDE_PROTOPLASM_GREEN = "#16A34A";
export const GUIDE_MR_VIOLET = "#8B5CF6";
export const GUIDE_AH_CYAN = "#22D3EE";
export const GUIDE_TENACITY_AMBER = "#FB923C";
export const GUIDE_SMITE_AMBER = "#E8960C";

export type GuideTextEntityIcon =
  | { kind: "item"; id: string }
  | { kind: "rune"; id: number }
  | { kind: "spell"; id: number }
  | { kind: "stat"; name: string }
  | { kind: "camp"; id: string };

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
  /** Render matched text as this label (e.g. capitalize "smite" → "Smite"). */
  displayAs?: string;
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
    patterns: ["Protoplasm Harness", "Protoplasm"],
    matchKey: "protoplasm-harness",
    color: GUIDE_PROTOPLASM_GREEN,
    icon: { kind: "item", id: "2525" },
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
    color: GUIDE_GA_BEIGE,
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
    patterns: ["Control Wards", "Control Ward"],
    matchKey: "control-ward",
    color: GUIDE_SHIELDBOW_RED,
    icon: { kind: "item", id: "2055" },
  },
  {
    patterns: ["Oracle Lens", "Sweeper"],
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
    patterns: ["Mercury's Treads", "Mercs"],
    matchKey: "mercury-treads",
    icon: { kind: "item", id: "3111" },
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
    patterns: ["lethality", "Lethality"],
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
  {
    patterns: ["Ability Power", "\\bAP\\b"],
    matchKey: "ap",
    color: GUIDE_AP_PURPLE,
    icon: { kind: "stat", name: "ability power" },
  },
  {
    patterns: ["Attack Speed", "\\bAS\\b"],
    matchKey: "as",
    color: GUIDE_AS_YELLOW,
    icon: { kind: "stat", name: "attack speed" },
  },
  {
    patterns: ["Ability Haste", "\\bAH\\b"],
    matchKey: "ah",
    color: GUIDE_AH_CYAN,
    icon: { kind: "stat", name: "ability haste" },
  },
  {
    patterns: ["Critical Strike", "\\bCrit\\b", "\\bcrit\\b"],
    matchKey: "crit",
    color: GUIDE_KRAKEN_GOLD,
    icon: { kind: "stat", name: "crit" },
  },
  {
    patterns: ["\\bArmor\\b", "\\barmor\\b"],
    matchKey: "armor",
    color: GUIDE_STEELCAPS_BROWN,
    icon: { kind: "stat", name: "armor" },
  },
  {
    patterns: ["Magic Resistance", "Magic Resist", "\\bMR\\b"],
    matchKey: "mr",
    color: GUIDE_MR_VIOLET,
    icon: { kind: "stat", name: "magic resist" },
  },
  {
    patterns: ["Movement Speed", "Move Speed", "\\bMS\\b"],
    matchKey: "ms",
    color: GUIDE_MS_GREEN,
    icon: { kind: "stat", name: "movement speed" },
  },
  {
    patterns: ["Tenacity"],
    matchKey: "tenacity",
    color: GUIDE_TENACITY_AMBER,
    icon: { kind: "stat", name: "tenacity" },
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
  { patterns: ["\\bGA\\b"], matchKey: "ga", color: GUIDE_GA_BEIGE, icon: { kind: "item", id: "3026" } },
  { patterns: ["\\bQSS\\b"], matchKey: "qss", icon: { kind: "item", id: "3140" } },
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
  {
    patterns: ["\\b[Ss]mite\\b"],
    matchKey: "smite",
    displayAs: "Smite",
    color: GUIDE_SMITE_AMBER,
    icon: { kind: "spell", id: 11 },
  },
  {
    patterns: ["Blue Kayn"],
    matchKey: "blue-kayn",
    boldOnly: true,
  },
  {
    patterns: ["Murk Wolves", "Wolves"],
    matchKey: "wolves",
    displayAs: "Wolves",
    icon: { kind: "camp", id: "wolves" },
  },
  {
    patterns: ["Raptors", "Raptor"],
    matchKey: "raptors",
    displayAs: "Raptors",
    icon: { kind: "camp", id: "raptors" },
  },
  {
    patterns: ["Krugs"],
    matchKey: "krugs",
    displayAs: "Krugs",
    icon: { kind: "camp", id: "krugs" },
  },
  {
    patterns: ["Gromp"],
    matchKey: "gromp",
    displayAs: "Gromp",
    icon: { kind: "camp", id: "gromp" },
  },
  {
    patterns: ["Scuttle", "\\bscuttle\\b", "\\bcrab\\b"],
    matchKey: "scuttle",
    displayAs: "Scuttle",
    icon: { kind: "camp", id: "scuttle" },
  },
  {
    patterns: ["\\bBlue\\b"],
    matchKey: "blue",
    displayAs: "Blue",
    icon: { kind: "camp", id: "blue" },
  },
  {
    patterns: ["\\bRed\\b", "\\bred\\b"],
    matchKey: "red",
    displayAs: "Red",
    icon: { kind: "camp", id: "red" },
  },
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
  caseSensitive?: boolean;
  matchKey: string;
  icon?: GuideTextEntityIcon;
  iconShape?: "round" | "square";
  color?: string;
  weight?: number;
  boldOnly?: boolean;
};

/** Uppercase abbreviations (AS, AD) — not lowercase prose like "as". */
export function isCaseSensitiveGuideRegexPattern(pattern: string): boolean {
  if (!pattern.startsWith("\\b")) return false;
  if (/^\\b[a-z]/.test(pattern)) return false;
  return /^\\b[A-Z]{2,}\\b$/.test(pattern) || /^\\b[A-Z][a-z]+\\b$/.test(pattern);
}

export function flattenGuideTextEntities(): FlatGuideTextTerm[] {
  const terms: FlatGuideTextTerm[] = [];

  for (const entity of GUIDE_TEXT_ENTITIES) {
    for (const pattern of entity.patterns) {
      const regex = pattern.startsWith("\\b");
      terms.push({
        pattern,
        regex,
        caseSensitive: regex ? isCaseSensitiveGuideRegexPattern(pattern) : false,
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

import type { GuideItemSectionConfig } from "@/lib/guides/itemGuideTypes";

/** Turn off once the current itemization has been tested and builds are settled. */
export const BUILD_ITEMIZATION_REVIEW = {
  active: true,
  message: "Viego's itemization recently changed. Some builds are still being tested.",
} as const;

/** A build the picker can recommend. Items are Data Dragon item ids in build order. */
export type PickerBuildDef = {
  id: string;
  label: string;
  summary: string;
  /** Longer guide copy, shown in the picker breakdown when available. */
  description?: string;
  itemIds: number[];
  /** Where the build comes from in the guide, for display only. */
  source: "main" | "situational";
  /** Only displayed as an alternative, never in the primary build catalog. */
  alternativeOnly?: boolean;
};

/** Serialized for the client with resolved item names and icons. */
export type PickerBuild = Omit<PickerBuildDef, "itemIds"> & {
  items: PickerItem[];
};

export type PickerItem = {
  id: number;
  name: string;
  icon: string;
};

const MAIN_BUILDS: PickerBuildDef[] = [
  {
    id: "main-hubris",
    label: "Another Bloodrush",
    summary: "Mino's original hyper scaling build.",
    itemIds: [6697, 6676, 3036, 3031, 6699],
    source: "main",
  },
];

/** Picker-only builds that don't exist in the guide yet. */
const PICKER_ONLY_BUILDS: PickerBuildDef[] = [
  {
    id: "survivability-earlier-shieldbow",
    label: "Earlier Shieldbow",
    summary: "When it's fine to delay LDR because you're ahead.",
    description: "When it's fine to delay LDR because you're ahead.",
    itemIds: [6676, 6673, 3036, 3031, 6699],
    source: "situational",
    alternativeOnly: true,
  },
  {
    id: "survivability-earlier-shieldbow-ad",
    label: "Earlier Shieldbow",
    summary: "When it's fine to delay LDR because you're ahead.",
    description: "When it's fine to delay LDR because you're ahead.",
    itemIds: [6676, 6673, 3036, 3026, 3031],
    source: "situational",
    alternativeOnly: true,
  },
  {
    id: "sit-serpents-first",
    label: "Shieldbreaker's Edge",
    summary: "When you will always hit shields.",
    description: "This build is great when you pretty much always hit a shield because every enemy has one, or they have champions like Karma or Ivern.\nKeep in mind that it makes you a little bit weaker when there's no shield in combat, but since it's so cheap, it allows you to get to your LDR spike a little bit sooner as well.",
    itemIds: [6695, 6676, 3036, 3031, 6699],
    source: "situational",
  },
  {
    // TODO: confirm item order with Mino; placeholder is Serpent's third.
    id: "sit-serpents-late",
    label: "Shieldbreaker's Reckoning",
    summary: "Against delayed shields.",
    description: "This build is great when the enemies will build a lot of items that give them shields in the mid and late game. Shieldbow, Steraks, Seraphs, and Locket specifically.\nSerpent's Fang is not worth it at the start, but it gains a lot of value later.",
    itemIds: [6676, 3036, 6695, 3031, 6699],
    source: "situational",
  },
];

/**
 * The builds the decision tree chooses from: the flattened main build,
 * every variant in the guide's Situational tab, and picker-only builds.
 */
export function pickerBuildDefs(config: GuideItemSectionConfig): PickerBuildDef[] {
  const main = config.tabs.find((tab) => tab.id === "main")?.variants ?? [];
  const situational = config.tabs.find((tab) => tab.id === "situational")?.variants ?? [];
  const mainDescriptionById: Record<string, string | undefined> = {
    "main-hubris": main.find((variant) => variant.id === "hubris")?.description,
  };
  return [
    ...MAIN_BUILDS.map((build) => ({ ...build, description: mainDescriptionById[build.id] })),
    ...situational.map<PickerBuildDef>((variant) => ({
      id: variant.id,
      label: variant.label,
      summary: variant.summary ?? "",
      description: variant.description,
      itemIds: (variant.items ?? []).map((item) => item.id),
      source: "situational",
    })),
    ...PICKER_ONLY_BUILDS,
  ];
}

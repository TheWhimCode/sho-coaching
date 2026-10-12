import type { GuideItemSectionConfig } from "@/lib/guides/itemGuideTypes";

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
    id: "main-bastionbreaker",
    label: "Bread & Butter Carnage",
    summary: "Insane mid-game spike, scaling, and economy buildup.",
    itemIds: [2520, 6676, 3036, 3031, 6699],
    source: "main",
  },
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
    id: "sit-serpents-first",
    label: "Shieldbreaker's Edge",
    summary: "When you will always hit shields.",
    itemIds: [6695, 6676, 3036, 3031, 6699],
    source: "situational",
  },
  {
    // TODO: confirm item order with Mino; placeholder is Serpent's third.
    id: "sit-serpents-late",
    label: "Shieldbreaker's Reckoning",
    summary: "Collector, LDR, Serpent's Fang, Infinity Edge, Cyclosword.",
    itemIds: [6676, 3036, 6695, 3031, 6699],
    source: "situational",
  },
];

/**
 * The builds the decision tree chooses from: the two flattened main builds,
 * every variant in the guide's Situational tab, and picker-only builds.
 */
export function pickerBuildDefs(config: GuideItemSectionConfig): PickerBuildDef[] {
  const main = config.tabs.find((tab) => tab.id === "main")?.variants ?? [];
  const situational = config.tabs.find((tab) => tab.id === "situational")?.variants ?? [];
  const mainDescriptionById: Record<string, string | undefined> = {
    "main-bastionbreaker": main.find((variant) => variant.id === "bastionbreaker")?.description,
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

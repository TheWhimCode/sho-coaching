import type { GuideItemSectionConfig } from "@/lib/guides/itemGuideTypes";

/** A build the picker can recommend. Items are Data Dragon item ids in build order. */
export type PickerBuildDef = {
  id: string;
  label: string;
  summary: string;
  itemIds: number[];
  /** Where the build comes from in the guide, for display only. */
  source: "main" | "situational";
};

/** Serialized for the client with resolved item names and icons. */
export type PickerBuild = Omit<PickerBuildDef, "itemIds"> & {
  items: { id: number; name: string; icon: string }[];
};

const MAIN_BUILDS: PickerBuildDef[] = [
  {
    id: "main-bastionbreaker",
    label: "Bastionbreaker",
    summary: "Bastionbreaker, Collector, LDR, Infinity Edge, Cyclosword.",
    itemIds: [2520, 6676, 3036, 3031, 6699],
    source: "main",
  },
  {
    id: "main-hubris",
    label: "Hubris",
    summary: "Hubris, Collector, LDR, Infinity Edge, Cyclosword.",
    itemIds: [6697, 6676, 3036, 3031, 6699],
    source: "main",
  },
];

/** Picker-only builds that don't exist in the guide yet. */
const PICKER_ONLY_BUILDS: PickerBuildDef[] = [
  {
    id: "sit-serpents-first",
    label: "Serpent's Fang first",
    summary: "Serpent's Fang, Collector, LDR, Infinity Edge, Cyclosword.",
    itemIds: [6695, 6676, 3036, 3031, 6699],
    source: "situational",
  },
  {
    // TODO: confirm item order with Mino; placeholder is Serpent's third.
    id: "sit-serpents-late",
    label: "Delayed Serpent's Fang",
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
  const situational = config.tabs.find((tab) => tab.id === "situational")?.variants ?? [];
  return [
    ...MAIN_BUILDS,
    ...situational.map<PickerBuildDef>((variant) => ({
      id: variant.id,
      label: variant.label,
      summary: variant.summary ?? "",
      itemIds: (variant.items ?? []).map((item) => item.id),
      source: "situational",
    })),
    ...PICKER_ONLY_BUILDS,
  ];
}

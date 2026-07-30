import type { GuideRuneBuild, GuideRuneSectionConfig } from "@/lib/guides/runeGuideTypes";

const VIEGO_JUNGLE_BUILD: GuideRuneBuild = {
  primaryStyleId: 8100,
  primaryPerkIds: [
    9923, // Hail of Blades
    8143, // Sudden Impact
    8137, // Sixth Sense
    8135, // Treasure Hunter
  ],
  secondaryStyleId: 8000,
  secondaryPerkIds: [
    9111, // Triumph
    9104, // Legend: Alacrity
  ],
  statShards: {
    offense: 5005, // Attack Speed
    flex: 5008, // Adaptive Force
    defense: 5011, // Health
  },
  summonerSpells: {
    spellIds: [4, 11], // Flash, Smite
    note: "Flash and Smite every game.",
  },
  explanations: [
    {
      order: 1,
      perkId: 9923,
      title: "Insane burst setup",
      treeLabel: "DOMINATION",
      body:
        "This allows you to play without AS in your build. Essential. It makes your combo super fast (even Q animation scales with AS).",
    },
  ],
  secondarySection: {
    title: "Precision tree",
    body:
      "Triumph is just too good and Legend: Alacrity helps with clearing in the midgame. I used to run Cash Back, but this is just better.",
  },
};

const VIEGO_MID_BUILD: GuideRuneBuild = {
  primaryStyleId: 8100,
  primaryPerkIds: [
    9923, // Hail of Blades
    8143, // Sudden Impact
    8137, // Sixth Sense
    8135, // Treasure Hunter
  ],
  secondaryStyleId: 8400, // Resolve
  secondaryPerkIds: [
    8444, // Second Wind
    8473, // Bone Plating
    8451, // Overgrowth
  ],
  situationalPerkIds: [
    8444, // Second Wind
    8473, // Bone Plating
  ],
  statShards: {
    offense: 5008, // Adaptive Force
    flex: 5008, // Adaptive Force
    defense: 5011, // Health Scaling
  },
  summonerSpells: {
    spellIds: [4, 14], // Flash, Ignite
    note: "Flash and Ignite every game.",
  },
  explanations: [
    {
      order: 1,
      perkId: 9923,
      title: "Insane short trades",
      treeLabel: "DOMINATION",
      body:
        "Going full AD with HOB gives you insane short trade potential with E and W.",
    },
  ],
  secondarySection: {
    title: "Resolve tree",
    body:
      "Need some sustain and HP on mid. drop some cs and avoid harass, you need to find good short trades.",
  },
};

/** Viego — Domination primary; Precision (jungle) / Resolve (mid) secondary. */
export const VIEGO_RUNE_SECTION: GuideRuneSectionConfig = {
  heading: "The Runes",
  headerIconPerkId: 8010, // Conqueror
  defaultTabId: "jungle",
  tabs: [
    {
      id: "jungle",
      label: "Jungle",
      build: VIEGO_JUNGLE_BUILD,
    },
    {
      id: "mid",
      label: "Midlane",
      build: VIEGO_MID_BUILD,
    },
  ],
};

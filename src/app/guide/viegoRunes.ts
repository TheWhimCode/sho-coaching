import type { GuideRuneBuild } from "@/lib/guides/runeGuideTypes";

/** Viego jungle — Domination primary, Precision secondary (Skillcapped-style layout). */
export const VIEGO_RUNE_BUILD: GuideRuneBuild = {
  heading: "The Runes",
  headerIconPerkId: 8010, // Conqueror
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
  precisionSection: {
    title: "Precision tree",
    body:
      "Triumph is just too good and Legend: Alacrity helps with clearing in the midgame. I used to run Cash Back, but this is just better.",
  },
};

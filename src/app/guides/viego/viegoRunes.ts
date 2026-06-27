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
    defense: 5013, // Tenacity and Slow Resist
  },
  summonerSpells: {
    spellIds: [4, 11], // Flash, Smite
    note: "Flash and Smite every game.",
  },
  explanations: [
    {
      order: 1,
      perkId: 9923,
      title: "Fast Three-Hit Burst",
      treeLabel: "DOMINATION",
      body:
        "Loads attack speed into your first three hits — proc with W into Q for burst trades and quick kills.",
    },
  ],
  precisionSection: {
    title: "Precision Secondary",
    body:
      "Triumph heals on takedowns during reset chains. Legend: Alacrity adds bonus attack speed for snappier Q resets.",
  },
};

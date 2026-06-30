import type { GuideItemSectionConfig } from "@/lib/guides/itemGuideTypes";

const SITUATIONAL_COLLECTOR_EXPLANATION =
  "Best first item when you plan to adjust your build.";

const MAIN_SHIELDBOW_EXPLANATION =
  "Need 100% crit. We don't care about the defense. If there was an alternative we'd go with that.";

const IE_EXPLANATION =
  "Max damage option. IE is worse than LDR in almost every scenario, even against squishies because of item path, pricing, and how crit-reliant the item is.";

const SERPENTS_EXPLANATION =
  "Delayed Serpent's Fang vs high midgame shield comps.";

const CYCLO_EXPLANATION =
  "You started Serrated Dirk but want Cyclosword instead of Hubris.";

const SITUATIONAL_LDR_EXPLANATION =
  "Build this second vs supermassive frontline champs, to be able to deal enough damage to reset on them in midgame.";

const MAIN_LDR_EXPLANATION =
  "Your MEGA spike. This is what we've been scaling for. Kill anything. Anyone. Would be the love of my life if I didn't have Isolde.";

const MAIN_BUILD_STEPS: GuideItemSectionConfig["tabs"][number]["steps"] = [
  {
    type: "choice",
    items: [
      {
        id: 6699,
        title: "Voltaic Cyclosword",
        explanation: "Kraken-like early game spike to burst squishies.",
      },
      {
        id: 6697,
        title: "Hubris",
        explanation:
          "Highest scaling damage in the game. High AD + Crit + Armorpen is the key. Best baseline item, especially in low elo.",
      },
      {
        id: 6695,
        title: "Serpent's Fang",
        explanation: "Tons of shields. Item is cheap so you can get LDR faster as well.",
      },
    ],
  },
  {
    type: "fixed",
    items: [
      {
        id: 6676,
        explanation:
          "Always best second. Double lethality -> %pen. Insane item on Viego.",
      },
    ],
  },
  {
    type: "fixed",
    items: [
      {
        id: 3036,
        explanation: MAIN_LDR_EXPLANATION,
      },
    ],
  },
  {
    type: "fixed",
    items: [
      {
        id: 3031,
        explanation: IE_EXPLANATION,
      },
    ],
  },
  {
    type: "fixed",
    items: [
      {
        id: 6673,
        explanation: MAIN_SHIELDBOW_EXPLANATION,
      },
    ],
  },
];

const SITUATIONAL_SHARED_PATH: GuideItemSectionConfig["tabs"][number]["sharedPath"] = {
  origin: { id: 6676, explanation: SITUATIONAL_COLLECTOR_EXPLANATION },
  paths: [
    {
      items: [
        { id: 3036, explanation: SITUATIONAL_LDR_EXPLANATION },
        {
          id: 6673,
          explanation:
            "This is why we don't always rush Collector. Shieldbow 3rd is bad, we hate it. But we needed LDR second.",
        },
        { id: 3031, explanation: IE_EXPLANATION },
        {
          id: 6333,
          explanation:
            "We are full crit with extra item slot. DD is best, but you can also get GA/QSS/Cyclosword or Serpent's Fang vs lategame Shieldbow/Sterak's/Locket and such.",
        },
      ],
    },
    {
      diverge: [
        { id: 6695, title: "Serpent's Fang", explanation: SERPENTS_EXPLANATION },
        { id: 6699, title: "Voltaic Cyclosword", explanation: CYCLO_EXPLANATION },
      ],
      items: [
        { id: 3036, explanation: MAIN_LDR_EXPLANATION },
        { id: 3031, explanation: IE_EXPLANATION },
        { id: 6673, explanation: MAIN_SHIELDBOW_EXPLANATION },
      ],
    },
  ],
};

const VIEGO_PRE_BUILD: GuideItemSectionConfig["preBuild"] = {
  starting: [
    {
      id: 1103,
      title: "Mosstomper Seedling",
      explanation:
        "Best smite option and it's not even close. Free bonus health and sustain in between fights.",
    },
    {
      id: 3340,
      title: "Stealth Ward",
      explanation:
        "Since you're building scaling, you lack skirmishing power early levels. Wards help you deal with those early invades and smoothen the game when you crossmap. Swap to sweeper when you're strong enough to oneshot",
    },
  ],
  bootsBase: {
    id: 1001,
    title: "Boots",
    explanation:
      "Get these whenever. I usually finish first item and get them right after. Just how ever it lines up.",
  },
  bootsSubheading: "Don't upgrade boots until LDR unless Steelcaps are OP",
  boots: [
    {
      id: 3047,
      title: "Plated Steelcaps",
      explanation:
        "These are the most common boots that you get after LDR + Cloak of Agility or later. sometimes even earlier when the game is right.",
    },
    {
      id: 3008,
      title: "Gluttonous Greaves",
      explanation:
        "These are crazy good situationally. You can sustain back up between fights and cuz you do so much damage you heal a lot. You can even solo Baron (easily). But you need to stack them.",
    },
    {
      id: 3111,
      title: "Mercury's Treads",
      explanation:
        "You don't really want them, but sometimes there is too much CC to avoid. Generally not before LDR + Cloak of Agility.",
    },
    {
      id: 3009,
      title: "Boots of Swiftness",
      explanation:
        "Sometimes you get to fullbuild and didn't finish boots cuz nothing was good. Can go swifties here, before selling for Youmus. Rare.",
    },
  ],
  fullBuild: {
    sell: {
      id: 3047,
      title: "Plated Steelcaps",
      explanation: "Sell boots once you need a sixth combat item.",
    },
    buy: {
      id: 3142,
      title: "Youmuu's Ghostblade",
      explanation:
        "You still need MS but triple lethality gives you that extra damage that scales with the enemies defense, so you can keep Sukuna Sushi Slicing them.",
    },
  },
};

export const VIEGO_ITEM_SECTION: GuideItemSectionConfig = {
  heading: "The Build",
  guideChampion: "Viego",
  headerIcon: {
    id: 6672,
    title: "Kraken Slayer",
    explanation: "",
  },
  preBuild: VIEGO_PRE_BUILD,
  tabs: [
    {
      id: "main",
      label: "Main Build",
      steps: MAIN_BUILD_STEPS,
      defaultVariantId: "hubris",
      variants: [
        {
          id: "cyclo",
          label: "Cyclosword",
          header: "The twink crusher.",
          description:
            "This item hits HARD against low armor. Maximum lethality stronger first item spike and you can still oneshot squishies just the same. But only squishies.\nWhen you don't need the scaling or need earlygame power because you'll get invaded or fell behind hard, Cyclosword is great.",
          activeChoiceIds: [6699],
          teamComp: {
            ally: ["Volibear", "Viego", "Ahri", "Twitch", "Soraka"],
            enemy: ["Kayle", "Kha'Zix", "Syndra", "Tristana", "Senna"],
          },
          goodAgainst: ["Kha'Zix", "Talon", "Qiyana", "Kindred", "Quinn", "Hwei"],
        },
        {
          id: "hubris",
          label: "Hubris",
          header: "Max damage & scaling",
          description:
            "Hubris is the highest AD item in the game. It's not a snowball item, it scales. This is the build that allows you to oneshot Bruisers and Juggernauts in one combo.\nYou combine max AD and max crit with double lethality and %pen.",
          activeChoiceIds: [6697],
          teamComp: {
            ally: ["Garen", "Viego", "Lissandra", "Vayne", "Lulu"],
            enemy: ["Kled", "Jarvan IV", "Sylas", "Samira", "Camille"],
          },
          goodAgainst: ["Skarner", "Darius", "Nautilus", "Sylas", "Nunu", "Hecarim"],
        },
        {
          id: "serpents",
          label: "Serpent's Fang",
          header: "Early anti-shield",
          description:
            "They have tons of shield from the start. I'm saying like Karma AND Ivern... Serpent's Fang is a super efficient item that you should always prioritize against these champs. But often you don't need to get it first item.\nIt also works against Barrier, Shieldbow, Locket, Green Smite, Armored Advance...",
          activeChoiceIds: [6695],
          teamComp: {
            ally: ["Jax", "Viego", "Hwei", "Jinx", "Nautilus"],
            enemy: ["Sett", "Vi", "Leblanc", "Seraphine", "Karma"],
          },
          goodAgainst: ["Karma", "Ivern", "Riven", "Seraphine", "Lux", "Diana"],
        },
      ],
    },
    {
      id: "situational",
      label: "Situational",
      sharedPath: SITUATIONAL_SHARED_PATH,
      defaultVariantId: "survival",
      variants: [
        {
          id: "survival",
          label: "Death's Dance",
          header: "Multiple high armor fulltanks :(",
          description:
            "We don't like this build.\nIt's better than Kraken + Conqueror because you can't DPS against high CC high armor champs either way and it gives you surprisingly high midgame damage, but the Shieldbow 3rd hurts a lot and LDR costs a lot for a second item.",
          activeChoiceIds: [],
          activePathIndex: 0,
          teamComp: {
            ally: ["Renekton", "Viego", "Akali", "Zeri", "Lulu"],
            enemy: ["Jax", "Sejuani", "K'sante", "Ashe", "Leona"],
          },
          goodAgainst: ["Leona", "Ornn", "K'sante", "Braum", "Sejuani", "Malphite"],
        },
        {
          id: "sit-serpents",
          label: "Serpent's Fang",
          header: "Usual anti-shield build",
          description:
            "Serpent's Fang is amazing against shield users. Often those shields come delayed though.\nA toplaner who won't be in the game until midgame, Seraph's Shieldbow Sterak's Locket buyers... This is an amazing second item and super cheap, so you get your LDR asap :3",
          activeChoiceIds: [6695],
          activePathIndex: 1,
          teamComp: {
            ally: ["Gwen", "Viego", "Anivia", "Sivir", "Yuumi"],
            enemy: ["Gnar", "Ivern", "Akshan", "Kai'Sa", "Rell"],
          },
          goodAgainst: ["Ryze", "Ambessa", "Yasuo", "Kai'Sa", "Cassiopeia", "Camille"],
        },
        {
          id: "sit-cyclo",
          label: "Cyclosword",
          header: "IDK what I'm doing?!?!?",
          description:
            "You started with Serrated Dirk but realized that you actually want Cyclosword. Same reason as in main build. You are just dumb.\nHappens to me all the time.",
          activeChoiceIds: [6699],
          activePathIndex: 1,
          teamComp: {
            ally: ["Volibear", "Viego", "Ahri", "Twitch", "Soraka"],
            enemy: ["Kayle", "Kha'Zix", "Syndra", "Tristana", "Senna"],
          },
          goodAgainst: ["Kha'Zix", "Talon", "Qiyana", "Kindred", "Quinn", "Hwei"],
        },
      ],
    },
  ],
};

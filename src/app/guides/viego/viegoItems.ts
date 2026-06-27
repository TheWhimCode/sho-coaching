import type { GuideItemSectionConfig } from "@/lib/guides/itemGuideTypes";

const COLLECTOR_EXPLANATION =
  "Execute threshold on low-health targets. Perfect for Viego — you often finish fights during possession, and Collector closes out runners.";

const SHIELDBOW_EXPLANATION =
  "Survival without giving up damage. The shield lets you stay in extended fights and chain more possessions safely.";

const IE_EXPLANATION =
  "Crit scaling once your core is online. Big damage spike for mid-game skirmishes and late reset chains.";

const SERPENTS_EXPLANATION =
  "Into heavy shields — Karma, Lulu, Sterak's, etc. Cuts through protection so your reset target actually stays dead.";

const CYCLO_EXPLANATION =
  "When you need more burst upfront. The active and bonus damage help you one-shot squishies right after W in.";

const LDR_EXPLANATION =
  "When frontlines get tanky. Percent max-health damage keeps your resets relevant into bruisers and tanks.";

const MAIN_BUILD_STEPS: GuideItemSectionConfig["tabs"][number]["steps"] = [
  {
    type: "choice",
    items: [
      {
        id: 6699,
        title: "Voltaic Cyclosword",
        explanation:
          "When you need more burst upfront. The active and bonus damage help you one-shot squishies right after W in.",
      },
      {
        id: 6697,
        title: "Hubris",
        explanation:
          "Default when you can snowball. Takedowns after a reset stack AD and make your next possession even deadlier.",
      },
      {
        id: 6695,
        title: "Serpent's Fang",
        explanation:
          "Into heavy shields — Karma, Lulu, Sterak's, etc. Cuts through protection so your reset target actually stays dead.",
      },
    ],
  },
  {
    type: "fixed",
    items: [
      {
        id: 6676,
        explanation:
          "Execute threshold on low-health targets. Perfect for Viego — you often finish fights during possession, and Collector closes out runners.",
      },
    ],
  },
  {
    type: "fixed",
    items: [
      {
        id: 3036,
        explanation: LDR_EXPLANATION,
      },
    ],
  },
  {
    type: "fixed",
    items: [
      {
        id: 3031,
        explanation:
          "Crit scaling once your core is online. Big damage spike for mid-game skirmishes and late reset chains.",
      },
    ],
  },
  {
    type: "fixed",
    items: [
      {
        id: 6673,
        explanation:
          "Survival without giving up damage. The shield lets you stay in extended fights and chain more possessions safely.",
      },
    ],
  },
];

const SITUATIONAL_SHARED_PATH: GuideItemSectionConfig["tabs"][number]["sharedPath"] = {
  origin: { id: 6676, explanation: COLLECTOR_EXPLANATION },
  paths: [
    {
      items: [
        { id: 3036, explanation: LDR_EXPLANATION },
        { id: 6673, explanation: SHIELDBOW_EXPLANATION },
        { id: 3031, explanation: IE_EXPLANATION },
        {
          id: 6333,
          explanation:
            "When you need to stay alive through burst and extended fights. Delays damage taken so your resets aren't punished as hard.",
        },
      ],
    },
    {
      diverge: [
        { id: 6695, title: "Serpent's Fang", explanation: SERPENTS_EXPLANATION },
        { id: 6699, title: "Voltaic Cyclosword", explanation: CYCLO_EXPLANATION },
      ],
      items: [
        { id: 3036, explanation: LDR_EXPLANATION },
        { id: 3031, explanation: IE_EXPLANATION },
        { id: 6673, explanation: SHIELDBOW_EXPLANATION },
      ],
    },
  ],
};

const VIEGO_PRE_BUILD: GuideItemSectionConfig["preBuild"] = {
  starting: [
    {
      id: 1103,
      title: "Mosstomper Seedling",
      explanation: "Default jungle companion — extra sustain and clear speed for a healthy first clear.",
    },
    {
      id: 3340,
      title: "Stealth Ward",
      explanation: "Yellow trinket for early vision on invades and scuttle control.",
    },
  ],
  startingLink: {
    label: "Green smite TikTok",
    href: "https://www.tiktok.com/@itsMinooooo",
  },
  bootsBase: {
    id: 1001,
    title: "Boots",
    explanation: "300 gold — buy on first back for the movement speed to gank and clear faster.",
  },
  bootsSubheading: "Don't upgrade boots until LDR unless Steelcaps are OP",
  boots: [
    {
      id: 3047,
      title: "Plated Steelcaps",
      explanation: "Default into AD-heavy teams — reduces auto-attack damage during skirmishes.",
    },
    {
      id: 3008,
      title: "Gluttonous Greaves",
      explanation: "Sustain option when you can trade repeatedly and want extra omnivamp.",
    },
    {
      id: 3111,
      title: "Mercury's Treads",
      explanation: "Into AP and CC-heavy comps — tenacity and magic resist keep you resetting.",
    },
    {
      id: 3009,
      title: "Boots of Swiftness",
      explanation: "When you need to stick to targets and dodge skillshots — MS and slow resist.",
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
        "Sixth-item spike — MS and lethality to chase down carries after a reset or flank a backline target.",
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
          header: "Burst Squishies",
          description:
            "Voltaic Cyclosword when you need raw upfront burst to one-shot a carry right after W. Best when their backline is isolated and you can commit before they peel.",
          activeChoiceIds: [6699],
          teamComp: {
            ally: ["Nautilus", "Syndra", "Jinx", "Lulu"],
            enemy: ["Lux", "Ezreal", "Karma", "Gnar", "Amumu"],
          },
          goodAgainst: ["Lux", "Ezreal", "Karma", "Jinx", "Ashe"],
        },
        {
          id: "hubris",
          label: "Hubris",
          header: "Snowball Skirmisher",
          description:
            "Default when you can stack takedowns. Hubris AD stacks snowball reset fights — get a kill, possess, and your next target dies even faster.",
          activeChoiceIds: [6697],
          teamComp: {
            ally: ["Thresh", "Orianna", "Kai'Sa", "Renata"],
            enemy: ["Ahri", "Jhin", "Leona", "Gragas", "Vi"],
          },
          goodAgainst: ["Jhin", "Lux", "Syndra", "Veigar", "Zoe"],
        },
        {
          id: "serpents",
          label: "Serpent's Fang",
          header: "Anti-Shield",
          description:
            "Serpent's Fang when shields are the reason your targets survive your combo — Karma, Lulu, Sterak's, Immortal Shieldbow, etc.",
          activeChoiceIds: [6695],
          teamComp: {
            ally: ["Morgana", "Caitlyn", "Sona", "Ornn"],
            enemy: ["Karma", "Jinx", "Lulu", "Sion", "Maokai"],
          },
          goodAgainst: ["Karma", "Lulu", "Jinx", "Shen", "Sion"],
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
          header: "Into Burst & Extended Fights",
          description:
            "The top path when you need to survive burst and stay in the fight long enough to chain multiple possessions. Death's Dance delays damage so you don't die mid-reset.",
          activeChoiceIds: [],
          activePathIndex: 0,
          teamComp: {
            ally: ["Braum", "Viktor", "Ashe", "Soraka"],
            enemy: ["Syndra", "Zed", "Pyke", "Darius", "Elise"],
          },
          goodAgainst: ["Zed", "Pyke", "Syndra", "Elise", "Talon"],
        },
        {
          id: "sit-serpents",
          label: "Serpent's Fang",
          header: "Shield Stackers",
          description:
            "Bottom path with Serpent's Fang when the enemy team layers shields and your resets get negated. Cut through protection before LDR and IE spike your damage.",
          activeChoiceIds: [6695],
          activePathIndex: 1,
          teamComp: {
            ally: ["Leona", "Aphelios", "Lulu", "Graves"],
            enemy: ["Karma", "Samira", "Shen", "Jarvan IV", "Nunu"],
          },
          goodAgainst: ["Karma", "Lulu", "Shen", "Samira", "Ivern"],
        },
        {
          id: "sit-cyclo",
          label: "Cyclosword",
          header: "Pickoff & Flanks",
          description:
            "Bottom path with Cyclosword when you need to assassinate a squishy off a single W engage. Less tanky than the Death's Dance route but faster kills.",
          activeChoiceIds: [6699],
          activePathIndex: 1,
          teamComp: {
            ally: ["Rakan", "Ahri", "Varus", "Maokai"],
            enemy: ["Lux", "Miss Fortune", "Yuumi", "Gwen", "Lee Sin"],
          },
          goodAgainst: ["Lux", "Miss Fortune", "Yuumi", "Ashe", "Veigar"],
        },
      ],
    },
  ],
};

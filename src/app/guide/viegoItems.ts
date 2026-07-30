import type {
  GuideItemEntry,
  GuideItemSectionConfig,
  GuideItemVariant,
} from "@/lib/guides/itemGuideTypes";

const SITUATIONAL_COLLECTOR_EXPLANATION =
  "Best first item when you plan to adjust your build.";

const MAIN_SHIELDBOW_EXPLANATION =
  "Need 100% Crit. We don't care about the defense. If there was an alternative we'd go with that.";

const MAIN_COLLECTOR_EXPLANATION =
  "Always best second. Double Lethality -> %pen. Insane item on Viego.";

const IE_EXPLANATION =
  "Q and R scale with IE critdamage, but I found that even against squishies LDR does pretty much the same damage. The itempath is a lot worse on IE as well and it's more expensive, so I default to Noon -> LDR -> IE.";

const SERPENTS_EXPLANATION =
  "Delayed Serpent's Fang vs high midgame shield comps.";

const CYCLO_EXPLANATION =
  "You started Serrated Dirk but want Cyclosword instead of Hubris.";

const SITUATIONAL_LDR_EXPLANATION =
  "Build this second vs supermassive frontline champs, to be able to deal enough damage to reset on them in midgame.";

const MAIN_LDR_EXPLANATION =
  "Your MEGA spike. This is what we've been scaling for. Kill anything. Anyone. Would be the love of my life if I didn't have Isolde.";

const BASTIONBREAKER_PATH_ITEMS: GuideItemEntry[] = [
  {
    id: 2520,
    title: "Bastionbreaker",
    explanation:
      "Completely overbuffed, same damage as Cyclo without the passive. The passive helps you secure early Drakes/Grubs that you didn't have the time for before",
  },
  { id: 6676, explanation: MAIN_COLLECTOR_EXPLANATION },
  { id: 3036, explanation: MAIN_LDR_EXPLANATION },
  { id: 3031, explanation: IE_EXPLANATION },
  {
    id: 6699,
    title: "Voltaic Cyclosword",
    explanation:
      "Triple Lethality does insane damage against 75+ Armor targets. All champions have that at level 15. Can overcap with Youmus but it's lowkey fine.",
  },
];

const MAIN_SHARED_PATH: GuideItemSectionConfig["tabs"][number]["sharedPath"] = {
  paths: [
    {
      items: BASTIONBREAKER_PATH_ITEMS,
    },
    {
      diverge: [
        {
          id: 6697,
          title: "Hubris",
          explanation:
            "Highest scaling damage in the game. High AD + Crit + Armor Pen is the key. Best baseline item, especially in low elo.",
        },
        {
          id: 6695,
          title: "Serpent's Fang",
          explanation: "Tons of shields. Item is cheap so you can get LDR faster as well.",
        },
      ],
      items: [
        { id: 6676, explanation: MAIN_COLLECTOR_EXPLANATION },
        { id: 3036, explanation: MAIN_LDR_EXPLANATION },
        { id: 3031, explanation: IE_EXPLANATION },
        {
          id: 2520,
          title: "Bastionbreaker",
          explanation:
            "Same damage as Cyclo but you also get the passive. 3x Lethality is WAY more damage than Shieldbow.",
        },
      ],
    },
  ],
};

const MID_BUILD_STEPS: NonNullable<GuideItemSectionConfig["tabs"][number]["steps"]> =
  BASTIONBREAKER_PATH_ITEMS.map((item) => ({
    type: "fixed" as const,
    items: [item],
  }));

const BASTIONBREAKER_VARIANT: GuideItemVariant = {
  id: "bastionbreaker",
  label: "Bastionbreaker",
  header: "The twink crusher.",
  description:
    "This item hits HARD against low Armor. Maximum Lethality stronger first item spike and you can still oneshot squishies just the same. But only squishies.\nWhenever enemies are all squishy, you don't think you'll be able to stack Hubris, or you need earlygame power, Bastionbreaker is great.",
  activeChoiceIds: [],
  teamComp: {
    ally: ["Volibear", "Viego", "Ahri", "Twitch", "Soraka"],
    enemy: ["Kayle", "Kha'Zix", "Syndra", "Tristana", "Senna"],
  },
  goodAgainst: ["Kha'Zix", "Talon", "Qiyana", "Kindred", "Quinn", "Hwei"],
};

const SITUATIONAL_SHARED_PATH: GuideItemSectionConfig["tabs"][number]["sharedPath"] = {
  origin: { id: 6676, explanation: SITUATIONAL_COLLECTOR_EXPLANATION },
  paths: [
    {
      items: [
        { id: 3036, explanation: SITUATIONAL_LDR_EXPLANATION },
        { id: 3031, explanation: IE_EXPLANATION },
        { id: 6673, explanation: MAIN_SHIELDBOW_EXPLANATION },
        {
          id: 6333,
          explanation:
            "We are full Crit with extra item slot. DD is best, but you can also get GA/QSS/Cyclosword or Serpent's Fang vs lategame Shieldbow/Sterak's/Locket and such.",
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
        "Best Smite option and it's not even close. Free bonus health and sustain in between fights.",
    },
    {
      id: 3340,
      title: "Stealth Ward",
      explanation:
        "Since you're building scaling, you lack skirmishing power early levels. Wards help you deal with those early invades and smoothen the game when you crossmap. Swap to Sweeper when you're strong enough to oneshot",
    },
  ],
  startingLink: {
    label: "Green Smite TikTok",
    href: "https://www.tiktok.com/@itsminooooo/video/7658996812430249238",
  },
  bootsBase: {
    id: 1001,
    title: "Boots",
    explanation:
      "Get these whenever. I usually finish first item and get them right after. Just how ever it lines up.",
  },
  bootsSubheading: "Don't upgrade boots until LDR unless Steelcaps are OP",
  boots: [
    {
      id: 3008,
      title: "Gluttonous Greaves",
      isNew: true,
      explanation:
        "These are your go-to boots if you can stack them. Delaying your itemspikes can be greedy, but building them after LDR can make them difficult to stack.",
    },
    {
      id: 3047,
      title: "Plated Steelcaps",
      isNew: true,
      explanation:
        "These are your go-to against full AD comps. Generally don't finish them before LDR + Cloak.",
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
        "Sometimes you get to fullbuild and didn't finish boots cuz nothing was good. Can go swifties here, before selling for Youmuu's. Rare.",
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
        "You still need MS but triple Lethality gives you that extra damage that scales with the enemies defense, so you can keep Sukuna Sushi Slicing them.",
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
      sharedPath: MAIN_SHARED_PATH,
      defaultVariantId: "bastionbreaker",
      variants: [
        {
          ...BASTIONBREAKER_VARIANT,
          activePathIndex: 0,
        },
        {
          id: "hubris",
          label: "Hubris",
          header: "Max damage & scaling",
          description:
            "Hubris is the highest AD item in the game. It's not a snowball item, it scales. This is the build that allows you to oneshot Bruisers and Juggernauts in one combo.\nYou combine max AD and max Crit with double Lethality and %pen.",
          activeChoiceIds: [6697],
          activePathIndex: 1,
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
          activePathIndex: 1,
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
          label: "The Elekktro build",
          header: "The Elekktro build",
          isNew: true,
          description:
            "Build this when it would technically be a good Hubris game, but you don't think you'll be able to stack it. Bad early or really tough compositions.\nYou'll have a much stronger midgame spike against tanky champions, but lose the scaling Hubris offers. It's a strong build. Start Dirk and decide if you can afford Hubris on second base.",
          activeChoiceIds: [],
          activePathIndex: 0,
          teamComp: {
            ally: ["Renekton", "Viego", "Akali", "Zeri", "Lulu"],
            enemy: ["Jax", "Sejuani", "K'sante", "Ashe", "Janna"],
          },
          goodAgainst: ["Leona", "Ornn", "K'sante", "Braum", "Shen", "Zilean"],
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
    {
      id: "mid",
      label: "Midlane",
      steps: MID_BUILD_STEPS,
      defaultVariantId: "bastionbreaker",
      variants: [BASTIONBREAKER_VARIANT],
    },
  ],
};

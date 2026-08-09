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
  "This rounds out your crit build. With double Lethality start, LDR 3rd is always better, but IE 4th is definitely a requirement. It does CRAZY damage.";

const SERPENTS_EXPLANATION =
  "Delayed Serpent's Fang vs high midgame shield comps.";

const SITUATIONAL_LDR_EXPLANATION =
  "Build this second vs supermassive frontline champs, to be able to deal enough damage to reset on them in midgame.";

const MAIN_LDR_EXPLANATION =
  "Your MEGA spike. This is what we've been scaling for. Kill anything. Anyone. Would be the love of my life if I didn't have Isolde.";

const BASTIONBREAKER_START_ITEM: GuideItemEntry = {
  id: 2520,
  title: "Bastionbreaker",
  explanation:
    "Completely overbuffed, same damage as Cyclo without the passive. The passive helps you secure early Drakes/Grubs that you didn't have the time for before",
};

const HUBRIS_START_ITEM: GuideItemEntry = {
  id: 6697,
  title: "Hubris",
  explanation:
    "Best scaling AD item in the game. Makes your earlygame weaker, respect that. Play for 3 items.",
};

const MAIN_SHARED_CORE_ITEMS: GuideItemEntry[] = [
  { id: 6676, explanation: MAIN_COLLECTOR_EXPLANATION },
  { id: 3036, explanation: MAIN_LDR_EXPLANATION },
  { id: 3031, explanation: IE_EXPLANATION },
];

const BASTIONBREAKER_CYCLO_ITEM: GuideItemEntry = {
  id: 6699,
  title: "Voltaic Cyclosword",
  explanation:
    "Significantly more damage than Shieldbow if the enemy is between 88-140 armor. Care with overcapping armorpen when u buy Youmus later.",
};

const BASTIONBREAKER_SHIELDBOW_ITEM: GuideItemEntry = {
  id: 6673,
  title: "Immortal Shieldbow",
  explanation:
    "Build this when most enemies have more than 140 or less than 88 armor. And sometimes to survive unavoidable damage in teamfights.",
};

const MAIN_SERPENTS_ITEM: GuideItemEntry = {
  id: 6695,
  title: "Serpent's Fang",
  explanation:
    "Against shields that come online later. Seraphs, Steraks, Mountain Soul, Locket",
};

const MID_PROFANE_ITEM: GuideItemEntry = {
  id: 6698,
  title: "Profane Hydra",
  explanation:
    "Need this for waveclear. Still does high damage and helps in lane. Can cast it during W dash and after W -> Q for ranged poke.",
};

const MID_SHARED_PATH: GuideItemSectionConfig["tabs"][number]["sharedPath"] = {
  paths: [
    {
      items: [MID_PROFANE_ITEM, ...MAIN_SHARED_CORE_ITEMS, BASTIONBREAKER_CYCLO_ITEM],
    },
  ],
};

const MAIN_SHARED_PATH: GuideItemSectionConfig["tabs"][number]["sharedPath"] = {
  paths: [
    {
      diverge: [BASTIONBREAKER_START_ITEM, HUBRIS_START_ITEM],
      items: MAIN_SHARED_CORE_ITEMS,
      endDiverge: [
        BASTIONBREAKER_CYCLO_ITEM,
        BASTIONBREAKER_SHIELDBOW_ITEM,
        MAIN_SERPENTS_ITEM,
      ],
    },
  ],
};

const BASTIONBREAKER_VARIANT: GuideItemVariant = {
  id: "bastionbreaker",
  label: "Bastionbreaker",
  header: "The twink crusher.",
  description:
    "This item is broken right now, your baseline build when Hubris isn't good.\nThis item hits HARD against low Armor. Maximum Lethality stronger first item spike and you can still oneshot squishies just the same.\nThe passive allows you to rush early drakes or take plates, especially against the lower HP T2 turrets. But don't mess up your tempo to use the item.\nI build this 60% of games",
  activeChoiceIds: [2520, 6699, 6673, 6695],
  activePathIndex: 0,
  teamComp: {
    ally: ["Volibear", "Viego", "Ahri", "Twitch", "Soraka"],
    enemy: ["Kayle", "Kha'Zix", "Syndra", "Tristana", "Senna"],
  },
  goodAgainst: ["Kha'Zix", "Talon", "Qiyana", "Kindred", "Quinn", "Hwei"],
};

const MID_BASTIONBREAKER_VARIANT: GuideItemVariant = {
  ...BASTIONBREAKER_VARIANT,
  header: "Viego midlane works!!",
  activeChoiceIds: [],
  description:
    "Profane gives you the waveclear you need to get to rotate to all the skirmishes. Build boots after first item, usually Gluttonous.\nRespect until level 3, then abuse your high AD HOB short trades. With Ignite you can oneshot squishies, especially once you hit 6.\nThen use that tempo to crash your waves rotate around the map and look for skirmishes as much as possible until sidelane starts.",
  teamComp: {
    ally: ["Volibear", "Lee Sin", "Viego", "Viktor", "Rell"],
    enemy: ["Fiora", "Ekko", "Sylas", "Yunara", "Nautilus"],
  },
  goodAgainst: ["Sylas", "Yone", "Xerath", "Vladimir", "Diana", "Azir"],
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
          id: 3026,
          explanation:
            "We are full Crit with extra item slot. GA is best, but you can also get DD/QSS/Cyclosword or Serpent's Fang vs lategame Shieldbow/Sterak's/Locket and such.",
        },
      ],
    },
    {
      items: [
        { id: 6695, title: "Serpent's Fang", explanation: SERPENTS_EXPLANATION },
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
      explanation:
        "These are your go-to boots if you can stack them. Delaying your itemspikes can be greedy, but building them after LDR can make them difficult to stack.",
    },
    {
      id: 3047,
      title: "Plated Steelcaps",
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
        BASTIONBREAKER_VARIANT,
        {
          id: "hubris",
          label: "Hubris",
          header: "Max damage & scaling",
          description:
            "Build this when you face tankier champs and getting the first kill in a teamfight is not a problem.\nHubris is the highest AD item in the game. It's not a snowball item, it scales. Your early game will be weaker. This is the build that allows you to oneshot Bruisers and Juggernauts in one combo.\nYou combine max AD and max Crit with double Lethality and %pen.\nI build this 30% of games",
          descriptionLink: {
            label: "Full explanation",
            href: "https://www.reddit.com/r/ViegoMains/comments/1vdzgr9/1_viego_explaining_why_and_when_i_build_hubris/",
          },
          activeChoiceIds: [6697, 6699, 6673, 6695],
          activePathIndex: 0,
          teamComp: {
            ally: ["Garen", "Viego", "Lissandra", "Vayne", "Leona"],
            enemy: ["Kled", "Jarvan IV", "Sylas", "Samira", "Camille"],
          },
          goodAgainst: ["Skarner", "Darius", "Nautilus", "Sylas", "Nunu", "Hecarim"],
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
            "High shields on multiple targets. Think: \"will I pretty much always hit a shield when fighting?\"\nA toplaner who won't be in the game until midgame, Seraph's Shieldbow Sterak's Locket buyers... This is an amazing second item and super cheap, so you get your LDR asap :3",
          activeChoiceIds: [],
          activePathIndex: 1,
          teamComp: {
            ally: ["Gwen", "Viego", "Anivia", "Sivir", "Yuumi"],
            enemy: ["Gnar", "Ivern", "Akshan", "Kai'Sa", "Rell"],
          },
          goodAgainst: ["Shen", "Ambessa", "Yasuo", "Kai'Sa", "Cassiopeia", "Camille"],
        },
      ],
    },
    {
      id: "mid",
      label: "Midlane",
      sharedPath: MID_SHARED_PATH,
      defaultVariantId: "bastionbreaker",
      variants: [MID_BASTIONBREAKER_VARIANT],
    },
  ],
};

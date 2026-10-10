import type {
  GuideItemEntry,
  GuideItemSectionConfig,
  GuideItemVariant,
} from "@/lib/guides/itemGuideTypes";

const SITUATIONAL_COLLECTOR_EXPLANATION =
  "Best first item when you plan to adjust your build.";

const MAIN_COLLECTOR_EXPLANATION =
  "Always best second. Double Lethality -> %pen. Insane item on Viego.";

const IE_EXPLANATION =
  "This rounds out your crit build. With double Lethality start, LDR 3rd is always better, but IE 4th is definitely a requirement. It does CRAZY damage.";

const SERPENTS_EXPLANATION =
  "Delayed Serpent's Fang vs high midgame shield comps.";

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
    "Build this when most enemies have more than 140 or less than 85 armor. And sometimes to survive unavoidable damage in teamfights.",
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

const HUBRIS_GOOD_AGAINST = ["Skarner", "Darius", "Nautilus", "Sylas", "Nunu", "Hecarim"];

const BASTIONBREAKER_VARIANT: GuideItemVariant = {
  id: "bastionbreaker",
  label: "Bastionbreaker",
  header: "The twink crusher.",
  description:
    "This item hits HARD against low Armor. Maximum Lethality stronger first item spike and you can still oneshot squishies just the same. But only squishies.\nWhenever enemies are all squishy, you don't think you'll be able to stack Hubris, or you need earlygame power, Bastionbreaker is great.\nI build this 50% of games",
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
  goodAgainst: ["Aurelion Sol", "Yone", "Kassadin", "Vladimir", "Diana", "Ekko"],
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
            "Hubris is the highest AD item in the game. It's not a snowball item, it scales. This is the build that allows you to oneshot Bruisers and Juggernauts in one combo.\nYou combine max AD and max Crit with double Lethality and %pen.\nI build this 30% of games",
          activeChoiceIds: [6697, 6699, 6673, 6695],
          activePathIndex: 0,
          teamComp: {
            ally: ["Garen", "Viego", "Lissandra", "Vayne", "Leona"],
            enemy: ["Kled", "Jarvan IV", "Sylas", "Samira", "Camille"],
          },
          goodAgainst: HUBRIS_GOOD_AGAINST,
        },
      ],
    },
    {
      id: "situational",
      label: "Situational",
      layout: "list",
      variants: [
        {
          id: "bastionbreaker-cyclosword",
          label: "The twink crusher",
          header: "The twink crusher",
          summary: "Max burst against full squishies.",
          description:
            "This is the maximum burst possible.\nBuild this when the enemy has literally zero tanky champs and won't build any armor. We don't build LDR because we would overcap with armor penetration and do less damage.",
          items: [
            { id: 2520, explanation: "Start with Bastionbreaker." },
            { id: 6699, explanation: "Build second, after Bastionbreaker." },
            { id: 6676, explanation: "Build third, after Voltaic Cyclosword." },
            { id: 3031, explanation: "Build fourth, after The Collector." },
            { id: 6673, explanation: "Finish with Immortal Shieldbow." },
          ],
          activeChoiceIds: [],
          teamComp: { ally: [], enemy: [] },
          goodAgainst: ["Pyke", "Janna", "LeBlanc", "Kha'Zix", "Qiyana", "Vayne"],
        },
        {
          id: "umbral-collector",
          label: "Umbral pivot",
          header: "Umbral pivot",
          summary: "Umbral Glaive start, Cyclosword last.",
          description:
            "When you start building for Hubris but you fall behind, you can pivot into Umbral Glaive for more mid-game power.\nOr if you know that you won't be getting a lot of kills because your teammates have low volatility lanes and everyone is playing safe, you can go Umbral to provide other value to your team and get to your other items more quickly.",
          items: [
            { id: 3179, explanation: "Start with Umbral Glaive." },
            { id: 6676, explanation: "Build second, after Umbral Glaive." },
            { id: 3036, explanation: "Build third, after The Collector." },
            { id: 3031, explanation: "Build fourth, after Lord Dominik's Regards." },
            { id: 6699, explanation: "Finish with Voltaic Cyclosword." },
          ],
          activeChoiceIds: [],
          teamComp: { ally: [], enemy: [] },
          goodAgainst: [],
        },
        {
          id: "hubris-ldr",
          label: "Full scaling anti-tank",
          header: "Full scaling anti-tank",
          summary: "Maximum scaling DPS possible.",
          description:
            "Hubris is the best item in extended fights because it does the most damage when the first person dies.\nYun Tal fourth, because Collector loses a lot of value and we need a crit item to fill the slot. But be careful, sometimes you face compositions that cannot be killed realistically (Zilean, K'Sante, Kindred). You won't be able to activate your Hubris then.",
          items: [
            HUBRIS_START_ITEM,
            { id: 3036, explanation: "Build second, after Hubris." },
            { id: 3031, explanation: "Build third, after Lord Dominik's Regards." },
            { id: 3032, explanation: "Build fourth, after Infinity Edge." },
            { id: 6673, explanation: "Finish with Immortal Shieldbow." },
          ],
          activeChoiceIds: [],
          teamComp: { ally: [], enemy: [] },
          goodAgainst: HUBRIS_GOOD_AGAINST,
        },
        {
          id: "hubris-skip-anti-tank",
          label: "Hubris skip anti-tank",
          header: "Hubris skip anti-tank",
          summary: "Midgame power, anti-tank.",
          description:
            "If Hubris is too risky and you can't start B.F. Sword, this is what you need to run to be able to deal with tanky champions in the mid game. You sacrifice a lot of scaling running this, but sometimes it is necessary.",
          items: [
            { id: 6676, explanation: "Start with The Collector." },
            { id: 3036, explanation: "Build second, after The Collector." },
            { id: 3031, explanation: "Build third, after Lord Dominik's Regards." },
            { id: 6673, explanation: "Build fourth, after Infinity Edge." },
            { id: 6699, explanation: "Finish with Voltaic Cyclosword." },
          ],
          activeChoiceIds: [],
          teamComp: { ally: [], enemy: [] },
          goodAgainst: [],
        },
        {
          id: "collector-shieldbow",
          label: "Survivability maxxing",
          header: "Survivability maxxing",
          summary: "Only when you're really desperate.",
          description:
            "Only run this when the enemy team has unavoidable burst, won't build anti-shield, and building Steelcaps or Mercs second has incredibly high value.\nI usually build this only against Talon or Rengar when my team has no shields and they have three AD champions.",
          items: [
            { id: 6676, explanation: "Start with The Collector." },
            { id: 6673, explanation: "Build second, after The Collector." },
            { id: 3036, explanation: "Build third, after Immortal Shieldbow." },
            { id: 3031, explanation: "Build fourth, after Lord Dominik's Regards." },
            { id: 6699, explanation: "Finish with Voltaic Cyclosword." },
          ],
          activeChoiceIds: [],
          teamComp: { ally: [], enemy: [] },
          goodAgainst: ["Talon", "Rengar"],
        },
        {
          id: "sit-serpents",
          label: "Anti-shield",
          header: "Anti-shield",
          summary: "Early anti-shield damage against multiple shield-heavy targets.",
          items: [
            { id: 6676, explanation: SITUATIONAL_COLLECTOR_EXPLANATION },
            { id: 6695, title: "Serpent's Fang", explanation: SERPENTS_EXPLANATION },
            { id: 3036, explanation: MAIN_LDR_EXPLANATION },
            { id: 3031, explanation: IE_EXPLANATION },
            BASTIONBREAKER_CYCLO_ITEM,
          ],
          description:
            "High shields on multiple targets. Think: \"will I pretty much always hit a shield when fighting?\"\nA toplaner who won't be in the game until midgame, Seraph's Shieldbow Sterak's Locket buyers... This is an amazing second item and super cheap, so you get your LDR asap :3",
          activeChoiceIds: [],
          teamComp: {
            ally: ["Gwen", "Viego", "Anivia", "Sivir", "Yuumi"],
            enemy: ["Gnar", "Ivern", "Akshan", "Kai'Sa", "Rell"],
          },
          goodAgainst: ["Shen", "Ambessa", "Yasuo", "Kai'Sa", "Cassiopeia", "Camille"],
        },
        {
          id: "yun-tal-ldr",
          label: "Max midgame DPS",
          header: "Max midgame DPS",
          summary: "Against full tank, low damage compositions.",
          description:
            "Only run this build when you are confident that you will be able to DPS the enemy because they lack damage, and you have champions that will create enough space for you to auto-attack.\nWhen rushing Yun Tal, you need to get B.F. Sword on your first back. If you don't, switch into another build instead.\nYou can start Raptors into Krugs and clear them again on respawn. Combined with Triple Tonic, this gets you 1300 gold on your first back. Just make sure you can't get invaded on Raptors spawn if you plan this.",
          items: [
            { id: 3032, explanation: "Start with Yun Tal Wildarrows." },
            { id: 3036, explanation: "Build second, after Yun Tal Wildarrows." },
            { id: 3031, explanation: "Build third, after Lord Dominik's Regards." },
            { id: 6673, explanation: "Build fourth, after Infinity Edge." },
            { id: 3026, explanation: "Finish with Guardian Angel." },
          ],
          activeChoiceIds: [],
          teamComp: { ally: [], enemy: [] },
          goodAgainst: ["Singed", "Hecarim", "Ornn", "K'Sante", "Dr. Mundo", "Galio"],
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

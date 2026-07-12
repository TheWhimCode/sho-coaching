import type { GuidePossessionSectionConfig } from "@/lib/guides/possessionGuideTypes";

export const VIEGO_POSSESSIONS_SECTION: GuidePossessionSectionConfig = {
  heading: "Possessions",
  isNew: true,
  howItWorksHeading: "How possessions work",
  howItWorksNote:
    "If an enemy you damaged in the last 3 seconds dies, you can possess them.",
  flow: [
    {
      id: "secure",
      label:
        "W -> Q or Smite enemies your team is killing to secure the possessions (keep Smite for this).",
    },
    {
      id: "auto-timer",
      label:
        "Possessions trigger through auto attack timers. Your auto has to be ready. If you are a ranged champ, you can possess from far away.",
    },
    {
      id: "untargetable",
      label:
        "While possessing, you become untargetable. You dodge everything besides DoT.",
    },
    {
      id: "transform",
      label:
        "Use the time it takes to transform to think about what to do after.",
    },
  ],
  howItWorksDetails: [
    "When you transform, you receive all their items, level, and stats (one more reason not to finish boots). Abilities apply your passive marks, but you also have the possessions passive:",
    "You keep your own rune and you can't use their item actives. Passives like Seraph's, Shieldbow, Sterak's, and Protoplasm work though, keep that in mind (not GA though).",
    "If you transform into someone who is fed, you'll be fed. If you transform into the 1/8 Kha'Zix, don't expect to oneshot.",
  ],
  howItWorksPassiveExamples: ["Camille", "Anivia", "Shen"],
  bestToPossessHeading: "What champs are best to possess?",
  bestToPossessIntro: "There are 3 factors that make a possession good.",
  factors: [
    { id: "mobility", label: "Mobility", text: "to reach your next target" },
    {
      id: "survivability",
      label: "Survivability",
      text: "to not blow up immediately",
    },
    { id: "cc", label: "CC", text: "to guarantee your next ult" },
  ],
  bestToPossessNote:
    "In some situations, high-damage ranged champs or enchanters can also be useful.",
  possessionTiers: [
    {
      id: "perfect",
      label: "Perfect",
      champions: [
        {
          champion: "Sylas",
          explanation:
            "Super OP. You only lack the reliable R, but often you can just play Sylas for a while.\n\nInstantly E -> W the next target. Your abilities apply your marks and autos clear them.",
        },
        {
          champion: "Leona",
          explanation:
            "Become immortal inside the whole enemy team. Instantly W when you take damage.\n\nGuarantee your next ult with Q.",
        },
        {
          champion: "Camille",
          explanation:
            "Just fly on their carry and get a shield. You can W while you are in E to slow, in case you can't reach.\n\nIf she's behind or playing support, watch out a bit. She's squishy.",
        },
        {
          champion: "Ambessa",
          explanation:
            "No guaranteed CC, but her 4 dashes make up for that. Use W instantly if you're low. The E slows and the Q only works twice if you hit the first Q.\n\nW -> E -> Q -> Q",
        },
        {
          champion: "Galio",
          explanation:
            "Chase with E, charge W, free R. You even keep his W shield when you're done.",
        },
        {
          champion: "Rammus",
          explanation: "Just roll them down -> E -> R. Good luck.",
        },
        {
          champion: "Lee Sin",
          explanation:
            "Don't max range Q instantly if you can W on minions or teammates to get closer. You lack CC, but survivability and mobility are insane, kinda like Ambessa.\n\nAnd the positions in which you kill Lee Sin are usually perfect to chase after.",
        },
        {
          champion: "Zac",
          explanation:
            "Just fly on their carry, kinda like Camille. Q something that's easy to hit -> auto the carry, so they can't dodge it. If you die, you become a blob... LOL",
        },
        {
          champion: "Jarvan IV",
          explanation: "E -> Q + tanky. Nice.",
        },
      ],
    },
    {
      id: "great",
      label: "Great",
      champions: [
        {
          champion: "Kha'Zix",
          explanation:
            "If he's fed, you can instantly jump on another isolated squishy and oneshot. But often I end up playing with his evolved W and slow chasing the rest of the team.\n\nYou can use E to instantly reposition and play slow.",
        },
        {
          champion: "Shen",
          explanation:
            "You get his passive shield, tankiness, and CC setup. Shen E is not easy to hit reliably and the range isn't great.\n\nDon't forget to use W after possessing.",
        },
        {
          champion: "Vi",
          explanation:
            "Her Q is nice, but you can't really use her combo if you wanna guarantee your next R. So either it's Q -> R, or you play Vi for a bit and can't guarantee your R.",
        },
        {
          champion: "Leblanc",
          explanation:
            "Mobility, burst, CC, and you even get her passive for survivability.\n\nIf it's safe, W -> E to guarantee the chain in melee range. Then Q, wait for root, and R. You can also W back if the enemy isn't running to stay alive until the chain locks.",
        },
        {
          champion: "Twisted Fate",
          explanation: "Just Gold Card them. It's pretty good.",
        },
        {
          champion: "Rell",
          explanation:
            "Big engage range, shield on W, reliable CC. E to chase, Q first if you can, otherwise W -> R once your W connects.\n\nYou always start mounted.",
        },
        {
          champion: "Zed",
          explanation:
            "Can often instantly get on another carry. Especially if he's fed, there's a lot of damage.\n\nW -> Q -> E. Ideally they have to use mobility or Flash before you R.",
        },
        {
          champion: "Ekko",
          explanation:
            "Instantly E -> Q next target with Duskblade. Then use movement speed to reposition/chase.\n\nCan Q during E dash to cancel animation. Can also W during E instead to get the shield faster or chase someone out of range.",
        },
        {
          champion: "Lucian",
          explanation:
            "No CC, but instant reposition + burst in midgame. Only good if you can play Lucian though.\n\nAuto -> E + W -> Auto -> Q -> Auto -> E.\n\nDon't cancel autos, use spells after the first auto. The second one can't be cancelled.",
        },
      ],
    },
    {
      id: "meh",
      label: "Meh..",
      champions: [
        {
          champion: "Akali",
          explanation:
            "Her E and W are pretty strong and you have infinite energy, but she does feel underwhelming every time.\n\nHer W disappears when you transform out as well.",
        },
        {
          champion: "Anivia",
          explanation:
            "You get the egg which can be funny, but the rest of her kit is not as useful and kinda hard to use. Often, enemies just run.\n\nQ -> W to make it easy to hit, then R on that stun.",
        },
        {
          champion: "Aurora",
          explanation:
            "Her mobility and burst can sometimes be useful. Usually not though.",
        },
        {
          champion: "Zilean",
          explanation:
            "He has the most insane E -> W -> E gapcloser. Can also E slow -> double Q -> R sometimes.\n\nBut he's super squishy, so it's situational.",
        },
        {
          champion: "Bard",
          explanation:
            "E can be useful to chase or get around the map. Sometimes I kill Bard in the river and then E to bot to dive their ADC.\n\nSuper funny to use enemy Bard E and then make your own right after.",
        },
        {
          champion: "Ezreal",
          explanation:
            "Situationally great. High damage and mobility, but he's hard to play.\n\nYou can W -> R and the Ezreal W damage will apply.",
        },
        {
          champion: "Garen",
          explanation:
            "Gapcloser, tanky, and you can R during silence. But his gapcloser is usually too bad without Stridebreaker to actually reach without Flash.",
        },
        {
          champion: "Mordekaiser",
          explanation: "CAN'T... REACH... GRAAAAAH",
        },
        {
          champion: "Vladimir",
          explanation:
            "He just can't reach without sums. Remember to press and hold E before your W for extra damage.\n\nCan also W -> R and become an invulnerable Viego for a second to confuse enemies.",
        },
      ],
    },
    {
      id: "useless",
      label: "Useless",
      champions: [
        {
          champion: "Vel'Koz",
          explanation:
            "You instantly blow up. Slow, no item passives, no mobility, bad CC.",
        },
        {
          champion: "Malzahar",
          explanation: "Doesn't work without his ult.",
        },
        {
          champion: "Aphelios",
          explanation:
            "His weapons are bugged. If you use one Q you can't use the other or something, I don't know...",
        },
        {
          champion: "Milio",
          explanation:
            "Can only Q -> R and keep W after transforming. Not enough.",
        },
        {
          champion: "Sona",
          explanation:
            "Does nothing unless she's APC with Seraph's. Use E auto for slow.",
        },
        {
          champion: "Zoe",
          explanation: "Can't really line up bubbles without her R usually.",
        },
        {
          champion: "Nidalee",
          explanation: "Can't switch forms and both are useless.",
        },
        {
          champion: "Quinn",
          explanation:
            "Champ does nothing without R -> flank or a numbers advantage.\n\nYou can cancel her E backward dash with your R at least.",
        },
        {
          champion: "Gnar",
          explanation: "Transforming into mini Gnar sounds really useful 😭",
        },
      ],
    },
  ],
  whenNotToPossessHeading: "When not to possess?",
  whenNotToPossessIntro:
    "Sometimes possessions will instantly get you killed or simply be a waste of time.",
  whenNotToPossessDontLabel: "Don't",
  whenNotToPossessItems: [
    {
      id: "squishy-surrounded",
      text: "Transform into a squishy, immobile champ when you are surrounded",
    },
    {
      id: "stunlock-chase",
      text: "Stunlock yourself when you could chase/hit someone else who is in range (especially if HOB is still active)",
    },
    {
      id: "low-mobility-free-fight",
      text: "Pick up a low mobility champion when the fight is free. Just chase.",
    },
    {
      id: "no-cc-behind",
      text: "Possess a no CC and mobility champion that is behind",
    },
    {
      id: "guaranteed-cc",
      text: "Transform into a Caitlyn trap/other guaranteed CC",
    },
  ],
};

import type { GuideMatchupSectionConfig } from "@/lib/guides/matchupGuideTypes";

export const VIEGO_MATCHUP_SECTION: GuideMatchupSectionConfig = {
  columns: [
    {
      id: "hard",
      label: "Hardest Matchups",
      subtitle: "Viego struggles most against these champions",
      tone: "hard",
      matchups: [
        {
          champion: "Lee Sin",
          explanation:
            "Naafiri packs burst and sustain in short trades. She can turn a sloppy engage into a lost skirmish before you get a reset — respect her all-in and look to fight around objectives when her pack is on cooldown.",
        },
        {
          champion: "Talon",
          explanation:
            "Yi scales harder in extended fights and punishes missed W. If he gets ahead, you cannot match his DPS in a straight duel — chain CC with your team and save smite for objective steals instead of trying to 1v1.",
        },
        {
          champion: "Kha'Zix",
          explanation:
            "Poppy walls off your dashes and wins long trades with W passive. Avoid chasing into tight terrain and wait for her to burn cooldowns before committing to a gank or invade.",
        },
        {
          champion: "Rengar",
          explanation:
            "Nidalee pokes you down and kites with spears before you can get in range. Track her jungle path, dodge cougar form all-ins when you're low, and punish when she wastes pounce.",
        },
        {
          champion: "Kindred",
          explanation:
            "Kindred invades aggressively and wins extended fights with stacks. Don't coin-flip early scuttle fights — secure vision, fight on your terms, and save ult for when she commits without Lamb's Respite.",
        },
        {
          champion: "Qiyana",
          explanation:
            "Kayn's form spike changes the matchup completely. Before Rhaast or Shadow Assassin, trade carefully around walls — once he has ult and form, he outduels you unless you catch him without cooldowns.",
        },
      ],
    },
    {
      id: "easy",
      label: "Best Matchups",
      subtitle: "Viego performs well against these champions",
      tone: "easy",
      matchups: [
        {
          champion: "Sylas",
          explanation:
            "Lucian is squishy and wants short bursts. Hail of Blades plus W in lets you blow him up before he E's out — gank when his dash is down and track his jungle if he tries to invade.",
        },
        {
          champion: "Diana",
          explanation:
            "Ivern can't fight you directly and relies on shields and Daisy. Invade his camps, punish slow clear, and collapse when he tries to shield a carry — he has no tools to win a 1v1.",
        },
        {
          champion: "Jarvan IV",
          explanation:
            "Amumu needs his team to follow up on R. You can dodge bandage toss with W and win skirmishes before six — after ult, play around vision and reset chains instead of face-tanking the engage.",
        },
        {
          champion: "Vi",
          explanation:
            "Sejuani is slow to clear and weak early. Invade, fight before she stacks passive, and sidestep stun — once you're ahead, she can't match your mobility or burst in isolated picks.",
        },
        {
          champion: "Ivern",
          explanation:
            "Jarvan commits hard with EQ flag combo. Bait the engage, W out of the knockup if possible, and turn the fight when his cooldowns are spent — he struggles if you reset mid-fight.",
        },
        {
          champion: "Nunu",
          explanation:
            "Nautilus has long hook cooldown and loses extended trades. Dodge hook, punish missed CC with a full combo, and snowball before he gets tank items — his early clear is also vulnerable to invades.",
        },
      ],
    },
  ],
};

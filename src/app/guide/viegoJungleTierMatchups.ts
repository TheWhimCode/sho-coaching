import type { GuideJungleTierMatchupSectionConfig } from "@/lib/guides/matchupGuideTypes";

export const VIEGO_JUNGLE_TIER_MATCHUPS: GuideJungleTierMatchupSectionConfig = {
  title: "All matchups",
  tiers: [
    {
      id: "nightmare",
      label: "Nightmare",
      subtitle: "P-please don't hurt me >.<",
      tone: "nightmare",
      matchups: [
        {
          champion: "Qiyana", gameplayStyle: "Mid-game assassin",
          possessionValue: 8,
          banBadge: "Minos Ban",
          snapshot: { invadePressure: 5, oneVOneThreat: 3, tempo: 5 },
        },
        {
          champion: "Talon", gameplayStyle: "Scaling assassin",
          possessionValue: 5,
          banBadge: "Good Ban",
          snapshot: { invadePressure: 5, oneVOneThreat: 5, tempo: 4 },
        },
        {
          champion: "Kha'Zix", gameplayStyle: "Mid-game assassin",
          possessionValue: 8,
          banBadge: "Good Ban",
          snapshot: { invadePressure: 5, oneVOneThreat: 3, tempo: 5 },
        },
        {
          champion: "Rengar", gameplayStyle: "Mid-game assassin",
          possessionValue: 6,
          snapshot: { invadePressure: 5, oneVOneThreat: 3, tempo: 5 },
        },
      ],
    },
    {
      id: "difficult",
      label: "Difficult",
      subtitle: "It's winnable!!",
      tone: "difficult",
      matchups: [
        {
          champion: "Hecarim", gameplayStyle: "Snowball skirmisher",
          possessionValue: 7,
          banBadge: "Good Ban",
          snapshot: { invadePressure: 1, oneVOneThreat: 5, tempo: 3 },
        },
        {
          champion: "Lee Sin", gameplayStyle: "Mid-game skirmisher",
          possessionValue: 9,
          snapshot: { invadePressure: 3, oneVOneThreat: 2, tempo: 5 },
        },
        {
          champion: "Shyvana", gameplayStyle: "Mid-game skirmish",
          banBadge: "Good Ban",
          possessionValue: 5,
          explanation:
            "Gets surprisingly tanky, be careful fighting her alone. Especially her guaranteed fear means you have to respect her in a fight. You outscale and generally you like playing against bruisers that engage your team. Farm and wait for her to misstep.",
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 5 },
        },
        {
          champion: "Kindred", gameplayStyle: "Utility marksman",
          possessionValue: 4,
          snapshot: { invadePressure: 4, oneVOneThreat: 3, tempo: 3 },
        },
        {
          champion: "Graves", gameplayStyle: "Snowball skirmisher",
          possessionValue: 5,
          snapshot: { invadePressure: 3, oneVOneThreat: 4, tempo: 4 },
        },
        {
          champion: "Jax", gameplayStyle: "Mid-game skirmisher",
          possessionValue: 7,
          snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 5 },
        },
        {
          champion: "Kayn", gameplayStyle: "Scaling assassin / mid-game skirmisher",
          possessionValue: 5,
          snapshot: { invadePressure: 3, oneVOneThreat: 4, tempo: 3 },
        },
        {
          champion: "Shaco", gameplayStyle: "Mid-game assassin / disengage controller",
          possessionValue: 6,
          snapshot: { invadePressure: 5, oneVOneThreat: 1, tempo: 2 },
        },
        {
          champion: "Xin Zhao", gameplayStyle: "Mid-game skirmisher",
          possessionValue: 8,
          snapshot: { invadePressure: 2, oneVOneThreat: 2, tempo: 4 },
        },
        {
          champion: "Quinn",
          gameplayStyle: "Mid-game assassin",
          possessionValue: 4,
          explanation:
            "Surprisingly hard to deal with because she can always avoid getting caught with her W. Don't waste time trying to catch her. Clear your camps on spawn and focus on your own plays. She will always be in them because she's so fast, so keep her in mind.",
          snapshot: { invadePressure: 1, oneVOneThreat: 5, tempo: 3 },
        },
      ],
    },
    {
      id: "even",
      label: "Even",
      subtitle: "May the better kitten prevail!",
      tone: "even",
      matchups: [
        {
          champion: "Aatrox", gameplayStyle: "Mid-game skirmisher",
          possessionValue: 6,
          explanation:
            "He won't bother you early and farms up and plays around his itemspikes & ult cooldown. Don't underestimate how much he can heal. Engage him only with your team until you're scaled and can oneshot him.\n\nHis dash has a 7-9 second cooldown at the start but goes to like 3 seconds in lategame.",
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 4 },
        },
        {
          champion: "Amumu", gameplayStyle: "Mid-game engager",
          possessionValue: 6,
          explanation:
            "You never want to get engaged by him. His CC range is massive, and even ulting away won't help.\n\nEither play through sidelane or wait until he engages someone else. Don't obsess over him: set up a flank and go on the backline when he engages.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 },
        },
        {
          champion: "Bel'Veth",
          gameplayStyle: "Scaling skirmisher",
          possessionValue: 6,
          explanation:
            "This matchup is very boring because she plays a very similar game to you, and who wins mostly depends on how the team comps are structured around you two.\n\nSince the rework she's extremely weak until like level 7+. Try to not waste tempo in your first clear so that you can contest grubs on time. Since they give her a lot of stacks and accelerate her scaling, call your support to rotate preemptively.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 },
        },
        { champion: "Elise", gameplayStyle: "Mid-game assassin", possessionValue: 4, snapshot: { invadePressure: 2, oneVOneThreat: 1, tempo: 4 } },
        {
          champion: "Karthus",
          gameplayStyle: "Scaling mage",
          possessionValue: 1,
          explanation:
            "You can always one-shot him from first item, unless he has Exhaust. But then he'll get caught eventually.\n\nBe careful though, if he hits a Q as you go in, you might not be able to survive his passive. Don't possess him, he will get a free Q and you will probably die or take unnecessary damage.",
          upgradeItem: { id: 3008, title: "Gluttonous Greaves" },
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 1 },
        },
        { champion: "Maokai", gameplayStyle: "Mid-game engager", possessionValue: 5, snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 } },
        { champion: "Nocturne", gameplayStyle: "Mid-game skirmisher / pick", possessionValue: 5, snapshot: { invadePressure: 2, oneVOneThreat: 2, tempo: 4 } },
        { champion: "Poppy", gameplayStyle: "Mid-game warden", possessionValue: 6, snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 } },
        {
          champion: "Rammus", gameplayStyle: "Mid-game engager",
          possessionValue: 8,
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 5 },
        },
        { champion: "Sejuani", gameplayStyle: "Mid-game engager", possessionValue: 6, snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 } },
        {
          champion: "Taliyah",
          gameplayStyle: "Mid-game mage",
          possessionValue: 5,
          explanation:
            "If she gets caught, she dies. If you try to catch her and fail, you die. Just play your game normally. Watch out facechecking into the enemy jungle when you don't know where she is, and keep her ultimate in mind when you're going for plays.\n\nFrom three items, you can one-shot her pretty easily if she doesn't have Zhonya's. And if she does, she won't do nearly as much damage.",
          snapshot: { invadePressure: 2, oneVOneThreat: 4, tempo: 3 },
        },
        { champion: "Wukong", gameplayStyle: "Mid-game skirmisher", possessionValue: 6, snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 5 } },
        {
          champion: "Zac", gameplayStyle: "Mid-game engager",
          possessionValue: 8,
          explanation:
            "You can't punish his weak early, which sets him up for success for his insane midgame power.\n\nDon't get hit by his CC, don't forget about his crazy engage range and healing in fights. Surviving is his strength. Check the little wings next to his level to see if he has passive up.\n\nBut if he does mess up and you manage to burst him, his transformation is insane. You heal a lot, can instantly jump on your next target and guarantee your R. Even Zac passive works as Viego.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 4 },
        },
      ],
    },
    {
      id: "favorable",
      label: "Favored",
      subtitle: "Easy :3",
      tone: "favorable",
      matchups: [
        { champion: "Ambessa", gameplayStyle: "Mid-game skirmisher / pick", possessionValue: 8, snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 4 } },
        { champion: "Briar", gameplayStyle: "Isolation mid-game skirmisher", possessionValue: 8, snapshot: { invadePressure: 5, oneVOneThreat: 1, tempo: 5 } },
        {
          champion: "Cho'Gath",
          gameplayStyle: "Mid-game tank",
          possessionValue: 6,
          explanation:
            "He can definitely one-shot you pretty easily in the mid game, but you outscale him. Once you have LDR, just play fights slow and wait for him to overstep.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 4 },
        },
        { champion: "Dr. Mundo", gameplayStyle: "Scaling skirmisher", possessionValue: 5, snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 2 } },
        { champion: "Evelynn", gameplayStyle: "Mid-game assassin", possessionValue: 4, snapshot: { invadePressure: 2, oneVOneThreat: 1, tempo: 2 } },
        {
          champion: "Fiddlesticks",
          gameplayStyle: "Controller / counter-engage",
          possessionValue: 4,
          explanation:
            "If you run straight at him, he just fears and runs away. Don't become his first target.\n\nIf he ults your team, instantly W-R him if he doesn't have Zhonya's: he has no mobility to reposition.\n\nHe can't interfere with your clearing, so full clear.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 2 },
        },
        {
          champion: "Gragas",
          gameplayStyle: "Disengage skirmisher",
          possessionValue: 7,
          explanation:
            "In jungle, he usually ends up extremely squishy in the mid to late game. His disengaged CC is annoying, but just be patient and take the free kill when he gives you the angle.",
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 2 },
        },
        {
          champion: "Gwen",
          gameplayStyle: "Scaling skirmisher",
          possessionValue: 6,
          explanation:
            "At 3 items you can kill her easily with your team and oneshot her if she facechecks a fully charged W. You can R into her W or even dash into it with your W.\n\nRespect her level 6 all-in.",
          snapshot: { invadePressure: 1, oneVOneThreat: 4, tempo: 3 },
        },
        {
          champion: "Lillia",
          gameplayStyle: "Snowball skirmisher",
          possessionValue: 5,
          explanation:
            "Don't chase her through the jungle. Keep fights short and wait for her to commit before you burst.",
          snapshot: { invadePressure: 1, oneVOneThreat: 3, tempo: 2 },
        },
        { champion: "Naafiri", gameplayStyle: "Mid-game assassin", possessionValue: 6, snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 3 } },
        {
          champion: "Nidalee",
          gameplayStyle: "Snowball skirmisher",
          possessionValue: 2,
          explanation:
            "Nida doesn't really have the damage to kill you in midgame and has no CC to lock you down.\n\nIn teamfights she's not a threat; if she facechecks, burst her. She is slippery though and will buy Zhonya's eventually, so don't get baited out of position for a low-value reset.",
          snapshot: { invadePressure: 2, oneVOneThreat: 4, tempo: 2 },
        },
        { champion: "Olaf", gameplayStyle: "Isolation mid-game skirmisher", possessionValue: 5, snapshot: { invadePressure: 2, oneVOneThreat: 1, tempo: 3 } },
        { champion: "Rek'Sai", gameplayStyle: "Isolation mid-game skirmisher", possessionValue: 6, snapshot: { invadePressure: 4, oneVOneThreat: 2, tempo: 4 } },
        { champion: "Skarner", gameplayStyle: "Mid-game engager", possessionValue: 6, snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 2 } },
        {
          champion: "Trundle",
          gameplayStyle: "Mid-game isolation skirmisher",
          possessionValue: 6,
          explanation:
            "Don't underestimate his Trinity Force spike and his ultimate: they make him extremely tanky.\n\nHe's very immobile, and your team can kill him easily later.",
          snapshot: { invadePressure: 3, oneVOneThreat: 1, tempo: 4 },
        },
        {
          champion: "Volibear",
          gameplayStyle: "Mid-game skirmisher",
          possessionValue: 7,
          explanation:
            "Don't become his target. Every fight he engages too early, you can kill him with your team, possess, and kill the rest.\n\nWatch out for Randuin's.",
          snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 3 },
        },
        {
          champion: "Warwick",
          gameplayStyle: "Mid-game isolation skirmisher",
          possessionValue: 7,
          explanation:
            "Very easy to kill lategame. Warwick always has to go in with E and Q, so he exposes himself to a full combo. That combo oneshots him with LDR.\n\nBut his ultimate can be annoying in teamfights, you don't wanna get hit by that. Just be patient, wait for him to disrespect, burst him, snowball the fight.\n\nAnd watch out for his early invades. Especially in low elo, Warwicks like to lv 1,2 or 3 cheese invade you. Just ward your Raptors entrance and you should be good.",
          snapshot: { invadePressure: 4, oneVOneThreat: 1, tempo: 4 },
        },
        { champion: "Zed", possessionValue: 8, snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 2 } },
      ],
    },
    {
      id: "free",
      label: "Free food",
      subtitle: "Awwwwwwwwwwh I'm gonna get ya hehehe",
      tone: "free",
      matchups: [
        { champion: "Sylas", possessionValue: 10, snapshot: { invadePressure: 2, oneVOneThreat: 1, tempo: 4 } },
        { champion: "Diana", possessionValue: 8, snapshot: { invadePressure: 1, oneVOneThreat: 3, tempo: 3 } },
        { champion: "Jarvan IV", possessionValue: 8, snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 3 } },
        { champion: "Vi", possessionValue: 8, snapshot: { invadePressure: 3, oneVOneThreat: 3, tempo: 3 } },
        { champion: "Ivern", possessionValue: 6, snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 1 } },
        { champion: "Nunu", possessionValue: 7, snapshot: { invadePressure: 4, oneVOneThreat: 3, tempo: 2 } },
        { champion: "Ekko", possessionValue: 8, snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 2 } },
        { champion: "Master Yi", possessionValue: 5, snapshot: { invadePressure: 3, oneVOneThreat: 2, tempo: 4 } },
        {
          champion: "Udyr",
          possessionValue: 6,
          explanation:
            "Once he's taken some damage, you can oneshot him from LDR—sometimes from full if you're ahead.\n\nCheck his build. AP tank has less kill pressure but gets tankier; AD can oneshot you, but blows up in midgame until DD.\n\nYou can't use Phoenix, so if he's AP you're gonna empower W or E every time.",
          snapshot: { invadePressure: 2, oneVOneThreat: 4, tempo: 3 },
        },
      ],
    },
  ],
};

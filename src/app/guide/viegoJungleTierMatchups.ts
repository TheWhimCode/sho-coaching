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
        { champion: "Lee Sin", possessionValue: 9 },
        { champion: "Talon", possessionValue: 5 },
        { champion: "Kha'Zix", possessionValue: 8 },
        { champion: "Rengar", possessionValue: 6 },
      ],
    },
    {
      id: "difficult",
      label: "Difficult",
      subtitle: "It's winnable!!",
      tone: "difficult",
      matchups: [
        { champion: "Kindred", possessionValue: 4 },
        { champion: "Graves", possessionValue: 5 },
        { champion: "Jax", possessionValue: 7 },
        { champion: "Kayn", possessionValue: 5 },
        { champion: "Qiyana", possessionValue: 6 },
        { champion: "Rammus", possessionValue: 8 },
        { champion: "Shaco", possessionValue: 5 },
        { champion: "Xin Zhao", possessionValue: 8, isNew: true },
      ],
    },
    {
      id: "even",
      label: "Even",
      subtitle: "May the better kitten prevail!",
      tone: "even",
      matchups: [
        {
          champion: "Aatrox",
          possessionValue: 6,
          isNew: true,
          explanation:
            "He won't bother you early and farms up and plays around his itemspikes & ult cooldown. Don't underestimate how much he can heal. Engage him only with your team until you're scaled and can oneshot him.\n\nHis dash has a 7-9 second cooldown at the start but goes to like 3 seconds in lategame.",
        },
        {
          champion: "Amumu",
          possessionValue: 6,
          isNew: true,
          explanation:
            "You never want to get engaged by him. He's pretty tanky and his CC range is massive, even ulting away won't help you. But he is still an engager that you can burst down with your team once scaled.\n\nHe won't invade you, so scale up, respect teamfights, don't obsess over him. Either play through sidelane or wait until he engages someone else.\n\nAnd you don't really WANT to focus him, maybe just set up a flank and go on the backline when he engages.",
        },
        { champion: "Elise", possessionValue: 4 },
        { champion: "Fiddlesticks", possessionValue: 5 },
        { champion: "Karthus", possessionValue: 5 },
        { champion: "Maokai", possessionValue: 5 },
        { champion: "Nasus", possessionValue: 5 },
        { champion: "Nocturne", possessionValue: 5 },
        { champion: "Poppy", possessionValue: 6 },
        { champion: "Sejuani", possessionValue: 6 },
        {
          champion: "Shyvana",
          possessionValue: 5,
          isNew: true,
          explanation:
            "Gets surprisingly tanky, be careful fighting her alone. Especially her guaranteed fear means you have to respect her in a fight. You outscale and generally you like playing against bruisers that engage your team. Farm and wait for her to misstep.",
        },
        { champion: "Wukong", possessionValue: 6 },
        {
          champion: "Zac",
          possessionValue: 8,
          explanation:
            "You can't punish his weak early, which sets him up for success for his insane midgame power.\n\nDon't get hit by his CC, don't forget about his crazy engage range and healing in fights. Surviving is his strength. Check the little wings next to his level to see if he has passive up.\n\nBut if he does mess up and you manage to burst him, his transformation is insane. You heal a lot, can instantly jump on your next target and guarantee your R. Even Zac passive works as Viego.",
        },
      ],
    },
    {
      id: "favorable",
      label: "Favored",
      subtitle: "Easy :3",
      tone: "favorable",
      matchups: [
        { champion: "Ambessa", possessionValue: 8 },
        { champion: "Briar", possessionValue: 8 },
        { champion: "Dr. Mundo", possessionValue: 5 },
        { champion: "Evelynn", possessionValue: 4 },
        { champion: "Gragas", possessionValue: 5 },
        {
          champion: "Gwen",
          possessionValue: 6,
          isNew: true,
          explanation:
            "It's super hard for Gwen to play into 3 item Viego. She's supposed to be a scaling pick like Yi or Ekko, but when she finally hits her 3 items you can kill her super easily with your team and oneshot her if she ever facechecks a fully charged W. You can R into her W or even dash into it with your W.\n\nBut respect her level 6 all in. You're not supposed to 1v1 her in midgame.",
        },
        { champion: "Hecarim", possessionValue: 7 },
        { champion: "Lillia", possessionValue: 5 },
        { champion: "Naafiri", possessionValue: 6 },
        {
          champion: "Nidalee",
          possessionValue: 2,
          explanation:
            "She's super strong early. Almost always gets a lead in the beginning, thanks to her extremely high tempo and powerful neutral game. But struggles a lot with invading you.\n\nNida doesn't really have the damage to kill you in midgame and has no CC to lock you down.\n\nIn teamfights she's not a threat and if she ever facechecks into you, burst her. You outscale her and if she missteps on your spikes, she gets oneshot.\n\nShe is slippery though and will buy Zhonya's eventually. Don't get baited out of position for a low value reset.",
        },
        { champion: "Olaf", possessionValue: 5 },
        { champion: "Rek'Sai", possessionValue: 6 },
        { champion: "Skarner", possessionValue: 6 },
        { champion: "Trundle", possessionValue: 5 },
        {
          champion: "Udyr",
          possessionValue: 7,
          isNew: true,
          explanation:
            "Similar to Nunu, he has a really hard time staying out of your full combo range. He will fullclear early, just scale against him. In midgame he will take fights and tank some damage from your team. Once he's lost like 30% of his health, you can just oneshot him from LDR. Even from full if you get ahead.\n\nCheck what build he's running. Also, know how to play after transforming. AP tank has less kill pressure but he gets more tanky. AD can oneshot you, but he blows up in midgame until he gets DD.\n\nYou can't use Phoenix, so if he's AP you're gonna empower W or E every time.",
        },
        {
          champion: "Volibear",
          possessionValue: 7,
          isNew: true,
          explanation:
            "He's strong early, but he gets outscaled and never gets tanky enough to survive once you hit LDR. Don't become his target, respect the 1v1s. He will outgank you and secure early objectives.\n\nEvery fight he engages too early, you can kill him with your team, possess, kill the rest. And if you get ahead early you can basically kill him on repeat with LDR.\n\nWatch out for Randuin's.",
        },
        {
          champion: "Warwick",
          possessionValue: 7,
          explanation:
            "Very easy to kill lategame. Warwick always has to go in with E and Q, so he exposes himself to a full combo. That combo oneshots him with LDR.\n\nBut his ultimate can be annoying in teamfights, you don't wanna get hit by that. Just be patient, wait for him to disrespect, burst him, snowball the fight.\n\nAnd watch out for his early invades. Especially in low elo, Warwicks like to lv 1,2 or 3 cheese invade you. Just ward your Raptors entrance and you should be good.",
        },
        { champion: "Zed", possessionValue: 8 },
      ],
    },
    {
      id: "free",
      label: "Free food",
      subtitle: "Awwwwwwwwwwh I'm gonna get ya hehehe",
      tone: "free",
      matchups: [
        { champion: "Sylas", possessionValue: 10 },
        { champion: "Diana", possessionValue: 8 },
        { champion: "Jarvan IV", possessionValue: 8 },
        { champion: "Vi", possessionValue: 8 },
        { champion: "Ivern", possessionValue: 6 },
        { champion: "Nunu", possessionValue: 7 },
        { champion: "Ekko", possessionValue: 8 },
        { champion: "Master Yi", possessionValue: 5 },
      ],
    },
  ],
};

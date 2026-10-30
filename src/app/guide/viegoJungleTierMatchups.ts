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
          champion: "Hecarim", gameplayStyle: "Snowball skirmisher",
          banBadge: "Minos Ban",
          snapshot: { invadePressure: 1, oneVOneThreat: 5, tempo: 3 },
          dangerHint: { title: "Bad tempo", detail: "losing your camps" },
          upgradeItem: { id: 3032, title: "Yun Tal Wildarrows" },
        },
        {
          champion: "Talon", gameplayStyle: "Scaling assassin",
          banBadge: "Good Ban",
          snapshot: { invadePressure: 5, oneVOneThreat: 5, tempo: 4 },
          upgradeItem: { id: 3047, title: "Plated Steelcaps" },
          dangerHint: { title: "Bad tempo", detail: "losing your camps" },
        },
        {
          champion: "Kha'Zix", gameplayStyle: "Mid-game assassin",
          banBadge: "Good Ban",
          snapshot: { invadePressure: 5, oneVOneThreat: 3, tempo: 5 },
          dangerHint: { title: "1v1s", detail: "from level 6 with his ultimate" },
        },
        {
          champion: "Rengar", gameplayStyle: "Mid-game assassin",
          snapshot: { invadePressure: 4, oneVOneThreat: 3, tempo: 5 },
          dangerHint: { title: "Catching you alone", detail: "in the midgame" },
          upgradeItem: { id: 3047, title: "Plated Steelcaps" },
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
          champion: "Qiyana", gameplayStyle: "Mid-game assassin",
          snapshot: { invadePressure: 4, oneVOneThreat: 3, tempo: 5 },
          dangerHint: { title: "Getting caught", detail: "from level 6" },
        },
        {
          champion: "Elise", gameplayStyle: "Mid-game assassin",
          snapshot: { invadePressure: 2, oneVOneThreat: 1, tempo: 4 },
        },
        {
          champion: "Lee Sin", gameplayStyle: "Mid-game skirmisher",
          snapshot: { invadePressure: 3, oneVOneThreat: 2, tempo: 5 },
          dangerHint: { title: "Getting caught", detail: "from level 6" },
        },
        {
          champion: "Shyvana", gameplayStyle: "Mid-game skirmish",
          banBadge: "Good Ban",
          explanation:
            "Surprisingly, you don't really outscale her because she just becomes too tanky. Usually in these types of matchups, you want to play with your team and try to surprise her with how much damage you deal once you have LDR.\n\nBut her possession is so useless that that doesn't even feel rewarding. Avoid 1v1s and skirmishes and try to play the game around her.\n\nIf you see her use ultimate, sometimes you get a window to be proactive against her.",
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 5 },
          upgradeItem: { id: 3036, title: "LDR", purchaseOrder: "2nd" },
          dangerHint: { title: "Her ultimate", detail: "in skirmishes" },
        },
        {
          champion: "Kindred", gameplayStyle: "Utility marksman",
          snapshot: { invadePressure: 4, oneVOneThreat: 3, tempo: 3 },
          dangerHint: { title: "Overextending", detail: "into their ultimate" },
        },
        {
          champion: "Jax", gameplayStyle: "Mid-game skirmisher",
          snapshot: { invadePressure: 2, oneVOneThreat: 2, tempo: 5 },
          upgradeItem: { id: 3036, title: "LDR", purchaseOrder: "2nd" },
          dangerHint: { title: "His E & ult", detail: "make him immortal" },
        },
        {
          champion: "Kayn", gameplayStyle: "Scaling assassin / mid-game skirmisher",
          snapshot: { invadePressure: 1, oneVOneThreat: 4, tempo: 4 },
          dangerHint: { title: "His ultimate", detail: "catching you out" },
        },
        {
          champion: "Shaco", gameplayStyle: "Mid-game assassin / disengage controller",
          snapshot: { invadePressure: 5, oneVOneThreat: 1, tempo: 2 },
          dangerHint: { title: "His boxes", detail: "don't get baited" },
          upgradeItem: { id: 3179, title: "Umbral Glaive" },
        },
        {
          champion: "Xin Zhao", gameplayStyle: "Mid-game skirmisher",
          snapshot: { invadePressure: 2, oneVOneThreat: 2, tempo: 4 },
          dangerHint: { title: "Overextending", detail: "into his ultimate" },
          upgradeItem: { id: 3032, title: "Yun Tal Wildarrows" },
        },
        {
          champion: "Quinn",
          gameplayStyle: "Mid-game assassin",
          explanation:
            "Surprisingly hard to deal with because she can always avoid getting caught with her W. Don't waste time trying to catch her.\n\nClear your camps on spawn and focus on your own plays. She will always be in them because she's so fast, so keep her in mind.",
          snapshot: { invadePressure: 1, oneVOneThreat: 5, tempo: 3 },
          dangerHint: { title: "Bad tempo", detail: "losing your camps" },
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
          explanation:
            "He won't bother you early and farms up and plays around his itemspikes & ult cooldown. Don't underestimate how much he can heal. Engage him only with your team until you're scaled and can oneshot him.\n\nHis dash has a 7-9 second cooldown at the start but goes to like 3 seconds in lategame.",
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 4 },
          upgradeItem: { id: 3036, title: "LDR", purchaseOrder: "2nd" },
        },
        {
          champion: "Amumu", gameplayStyle: "Mid-game engager",
          explanation:
            "You never want to get engaged by him. His CC range is massive, and even ulting away won't help.\n\nEither play through sidelane or wait until he engages someone else. Don't obsess over him: set up a flank and go on the backline when he engages.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 },
        },
        {
          champion: "Bel'Veth",
          gameplayStyle: "Scaling skirmisher",
          explanation:
            "This matchup is very boring because she plays a very similar game to you, and who wins mostly depends on how the team comps are structured around you two.\n\nSince the rework she's extremely weak until like level 7+. Try to not waste tempo in your first clear so that you can contest grubs on time. Since they give her a lot of stacks and accelerate her scaling, call your support to rotate preemptively.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 },
        },
        {
          champion: "Graves", gameplayStyle: "Snowball skirmisher",
          snapshot: { invadePressure: 3, oneVOneThreat: 4, tempo: 4 },
          dangerHint: { title: "His stat check", detail: "early to mid game" },
        },
        {
          champion: "Karthus",
          gameplayStyle: "Scaling mage",
          explanation:
            "You can always one-shot him from first item, unless he has Exhaust. But then he'll get caught eventually.\n\nBe careful though, if he hits a Q as you go in, you might not be able to survive his passive. Don't possess him, he will get a free Q and you will probably die or take unnecessary damage.",
          upgradeItem: { id: 3008, title: "Gluttonous Greaves" },
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 1 },
        },
        { champion: "Maokai", gameplayStyle: "Mid-game engager", snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 } },
        { champion: "Nocturne", gameplayStyle: "Mid-game skirmisher / pick", snapshot: { invadePressure: 2, oneVOneThreat: 2, tempo: 4 } },
        { champion: "Poppy", gameplayStyle: "Mid-game warden", snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 } },
        {
          champion: "Rammus", gameplayStyle: "Mid-game engager",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 5 },
          upgradeItem: { id: 3036, title: "LDR", purchaseOrder: "2nd" },
        },
        {
          champion: "Sejuani", gameplayStyle: "Mid-game engager",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 3 },
          upgradeItem: { id: 3036, title: "LDR", purchaseOrder: "2nd" },
        },
        {
          champion: "Skarner", gameplayStyle: "Mid-game engager",
          explanation:
            "Watch out for his Heartsteel spike: he can one-shot you from that point. Don't become his target. If his W connects, you're always dead from the CC chain. If he ever tries to ult you without stunning you first, you can just press R and his ult disappears.\n\nHe becomes surprisingly tanky, so play fights a little slower and rely on your team to deal some damage to him. You need LDR for this guy.",
          snapshot: { invadePressure: 1, oneVOneThreat: 4, tempo: 1 },
          upgradeItem: { id: 3036, title: "LDR", purchaseOrder: "2nd" },
        },
        {
          champion: "Taliyah",
          gameplayStyle: "Mid-game mage",
          explanation:
            "If she gets caught, she dies. If you try to catch her and fail, you die. Just play your game normally. Watch out facechecking into the enemy jungle when you don't know where she is, and keep her ultimate in mind when you're going for plays.\n\nFrom three items, you can one-shot her pretty easily if she doesn't have Zhonya's. And if she does, she won't do nearly as much damage.",
          snapshot: { invadePressure: 2, oneVOneThreat: 4, tempo: 3 },
        },
        {
          champion: "Wukong",
          gameplayStyle: "Mid-game skirmisher",
          explanation:
            "Respect his ultimate and Trinity Force spike. You outscale him really hard, so mitigate losses in the midgame.\n\nOffset from your team so you don't get caught out in skirmishes.",
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 5 },
          upgradeItem: { id: 3036, title: "LDR", purchaseOrder: "2nd" },
        },
        {
          champion: "Zac", gameplayStyle: "Mid-game engager",
          explanation:
            "You can't punish his weak early, which sets him up for success for his insane midgame power.\n\nDon't get hit by his CC, don't forget about his crazy engage range and healing in fights. Surviving is his strength. Check the little wings next to his level to see if he has passive up.\n\nBut if he does mess up and you manage to burst him, his possession is insane. You heal a lot, can instantly jump on your next target and guarantee your R. Even Zac passive works as Viego.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 4 },
          upgradeItem: { id: 3036, title: "LDR", purchaseOrder: "2nd" },
        },
      ],
    },
    {
      id: "favorable",
      label: "Favored",
      subtitle: "Easy :3",
      tone: "favorable",
      matchups: [
        { champion: "Ambessa", gameplayStyle: "Mid-game skirmisher / pick", snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 4 }, upgradeItem: { id: 6697, title: "Hubris" } },
        { champion: "Briar", gameplayStyle: "Isolation mid-game skirmisher", snapshot: { invadePressure: 5, oneVOneThreat: 1, tempo: 5 }, upgradeItem: { id: 6697, title: "Hubris" } },
        {
          champion: "Cho'Gath",
          gameplayStyle: "Mid-game tank",
          explanation:
            "He can definitely one-shot you pretty easily in the mid game, but you outscale him. Once you have LDR, just play fights slow and wait for him to overstep.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 4 },
        },
        { champion: "Dr. Mundo", gameplayStyle: "Scaling skirmisher", snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 2 } },
        { champion: "Evelynn", gameplayStyle: "Mid-game assassin", snapshot: { invadePressure: 2, oneVOneThreat: 1, tempo: 2 } },
        {
          champion: "Fiddlesticks",
          gameplayStyle: "Controller / counter-engage",
          explanation:
            "If you run straight at him, he just fears and runs away. Don't become his first target.\n\nIf he ults your team, instantly W-R him if he doesn't have Zhonya's: he has no mobility to reposition.\n\nHe can't interfere with your clearing, so full clear.",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 2 },
        },
        {
          champion: "Gragas",
          gameplayStyle: "Disengage skirmisher",
          explanation:
            "In jungle, he usually ends up extremely squishy in the mid to late game. His disengaged CC is annoying, but just be patient and take the free kill when he gives you the angle.",
          snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 2 },
        },
        {
          champion: "Gwen",
          gameplayStyle: "Scaling skirmisher",
          explanation:
            "At 3 items you can kill her easily with your team and oneshot her if she facechecks a fully charged W. You can R into her W or even dash into it with your W.\n\nRespect her level 6 all-in.",
          snapshot: { invadePressure: 1, oneVOneThreat: 4, tempo: 3 },
        },
        {
          champion: "Lillia",
          gameplayStyle: "Snowball skirmisher",
          explanation:
            "Don't chase her through the jungle. Keep fights short and wait for her to commit before you burst.",
          snapshot: { invadePressure: 1, oneVOneThreat: 3, tempo: 2 },
        },
        { champion: "Naafiri", gameplayStyle: "Mid-game assassin", snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 3 } },
        {
          champion: "Nidalee",
          gameplayStyle: "Snowball skirmisher",
          explanation:
            "Nida doesn't really have the damage to kill you in midgame and has no CC to lock you down.\n\nIn teamfights she's not a threat; if she facechecks, burst her. She is slippery though and will buy Zhonya's eventually, so don't get baited out of position for a low-value reset.",
          snapshot: { invadePressure: 2, oneVOneThreat: 4, tempo: 2 },
        },
        { champion: "Olaf", gameplayStyle: "Isolation mid-game skirmisher", snapshot: { invadePressure: 2, oneVOneThreat: 1, tempo: 3 } },
        { champion: "Rek'Sai", gameplayStyle: "Isolation mid-game skirmisher", snapshot: { invadePressure: 4, oneVOneThreat: 2, tempo: 4 } },
        {
          champion: "Trundle",
          gameplayStyle: "Mid-game isolation skirmisher",
          explanation:
            "Don't underestimate his Trinity Force spike and his ultimate: they make him extremely tanky.\n\nHe's very immobile, and your team can kill him easily later.",
          snapshot: { invadePressure: 3, oneVOneThreat: 1, tempo: 4 },
        },
        {
          champion: "Volibear",
          gameplayStyle: "Mid-game skirmisher",
          explanation:
            "Don't become his target. Every fight he engages too early, you can kill him with your team, possess, and kill the rest.\n\nWatch out for Randuin's.",
          snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 3 },
        },
        {
          champion: "Warwick",
          gameplayStyle: "Mid-game isolation skirmisher",
          explanation:
            "Very easy to kill lategame. Warwick always has to go in with E and Q, so he exposes himself to a full combo. That combo oneshots him with LDR.\n\nBut his ultimate can be annoying in teamfights, you don't wanna get hit by that. Just be patient, wait for him to disrespect, burst him, snowball the fight.\n\nAnd watch out for his early invades. Especially in low elo, Warwicks like to lv 1,2 or 3 cheese invade you. Just ward your Raptors entrance and you should be good.",
          snapshot: { invadePressure: 4, oneVOneThreat: 1, tempo: 4 },
        },
        { champion: "Zed", snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 2 } },
      ],
    },
    {
      id: "free",
      label: "Free food",
      subtitle: "Awwwwwwwwwwh I'm gonna get ya hehehe",
      tone: "free",
      matchups: [
        { champion: "Sylas", gameplayStyle: "Mid-game skirmisher", snapshot: { invadePressure: 2, oneVOneThreat: 1, tempo: 4 } },
        { champion: "Diana", gameplayStyle: "Mid-game skirmisher", snapshot: { invadePressure: 1, oneVOneThreat: 3, tempo: 3 } },
        {
          champion: "Jarvan IV",
          gameplayStyle: "Mid-game skirmisher",
          snapshot: { invadePressure: 2, oneVOneThreat: 3, tempo: 3 },
          upgradeItem: { id: 6697, title: "Hubris" },
        },
        { champion: "Vi", gameplayStyle: "Mid-game skirmisher", snapshot: { invadePressure: 3, oneVOneThreat: 3, tempo: 3 } },
        {
          champion: "Ivern",
          gameplayStyle: "Mid-game enchanter",
          snapshot: { invadePressure: 1, oneVOneThreat: 1, tempo: 1 },
          upgradeItem: { id: 6695, title: "Serpent's Fang" },
        },
        { champion: "Nunu", gameplayStyle: "Mid-game engager", snapshot: { invadePressure: 4, oneVOneThreat: 3, tempo: 2 } },
        { champion: "Ekko", gameplayStyle: "Scaling assassin", snapshot: { invadePressure: 1, oneVOneThreat: 2, tempo: 2 } },
        { champion: "Master Yi", gameplayStyle: "Scaling skirmisher", snapshot: { invadePressure: 3, oneVOneThreat: 2, tempo: 4 } },
        {
          champion: "Udyr",
          gameplayStyle: "Mid-game skirmisher",
          explanation:
            "Once he's taken some damage, you can oneshot him from LDR—sometimes from full if you're ahead.\n\nCheck his build. AP tank has less kill pressure but gets tankier; AD can oneshot you, but blows up in midgame until DD.\n\nYou can't use Phoenix, so if he's AP you're gonna empower W or E every time.",
          snapshot: { invadePressure: 2, oneVOneThreat: 4, tempo: 3 },
        },
      ],
    },
  ],
};

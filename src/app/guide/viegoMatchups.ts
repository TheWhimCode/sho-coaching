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
            "A good Lee Sin is impossible to deal with, which is why I ban him every game. He can oneshot you in one combo and disengage you with R unless you time your R on it (which is super difficult).\nBut most importantly, you can't really kill him, especially after he gets DD third. He's just too mobile and always hops out. If you DO kill him, you get a crazy powerful reset, but idk, I just can't get it done...",
        },
        {
          champion: "Talon",
          explanation:
            "A real headache. Maybe your worst matchup. Once he hits level 6, he can oneshot you from full if he has Ignite or some lead. He can just find you in your jungle, attacc, and you explode.\nIf you ever waste tempo, he will instantly snatch up all your camps. So I always do my camps on spawn, buy a Control Ward, and pray he doesn't know how easily he can kill me. To be fair, often they don't, and if you hit a fully charged stun you can W > auto > Q > R > auto him and he dies.",
        },
        {
          champion: "Kha'Zix",
          explanation:
            "Once he hits level 6, he can invade you at any point. You need vision against Kha — if he facechecks you, he explodes, and resetting on him is insane in teamfights.\nBut the fact that you always die if he finds you first means that you have to constantly be on your toes.",
        },
        {
          champion: "Rengar",
          explanation:
            "He can always oneshot you with his ult. He won't invade you as much as other champions, but from midgame onwards you always gotta consider that he can just randomly press R and kill you. It can also be hard to kill him until your 3rd item, so early skirmishes are a coin flip. Watch out for his level 3 invade.",
        },
        {
          champion: "Kindred",
          explanation:
            "Kindred is very annoying in some games. Others she's fine. Depending on the draft, she can make teamfighting completely impossible for you, so you need to find picks or pray your team does some work.\nThey often early invade as well, which can disrupt your scaling a little. But I'm really most worried about her ult.",
        },
        {
          champion: "Qiyana",
          explanation:
            "Qiyana can instantly kill you with R. You have to always think about her once she's level 6. You can't facecheck — be careful when fighting in the jungle as well, and she will E through you when you press R.\nWhat I do in this matchup is take some cocaine and then react to every ult by ulting out myself. That way she never has R. Since she's super squishy, you can also onetap her later with W > auto > Q > auto/R unless she goes DD\nBut if she does, she will usually play stupidly aggro and int. The 0-death, full damage Qiyanas are the scary ones.",
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
            "Best reset in the game. You pick him up and you go crazy. He has to go fight your team and you always have enough damage to oneshot him from level 6.\nJust don't let him engage on you in early fights and wait until LDR if he gets random kills.",
        },
        {
          champion: "Diana",
          explanation:
            "Insane reset and Dianas don't really buy Zhonyas in their first 3 items anymore, which makes her a super easy target. Serpents, Hubris, and LDR are all insane against her.",
        },
        {
          champion: "Jarvan IV",
          explanation:
            "Insane reset — he has to go in, and below GM every Jarvan disrespects you and randomly ints. The real GOAT Jarvan will play only to deny you resets, but y'all don't have to worry about that.",
        },
        {
          champion: "Vi",
          explanation:
            "They always underestimate your damage, no matter how often you kill them. Don't forget you can just R her R if she goes for you.",
        },
        {
          champion: "Ivern",
          explanation:
            "You're an amazing Serpents builder and you can always reach him. If he has no Flash, he always dies.\nAnd his reset is actually the best enchanter reset because you can Q > E yourself before transforming out, guaranteeing your next ult and giving you survivability.",
        },
        {
          champion: "Nunu",
          explanation:
            "Very hard for him to not just die to you instantly. You transform, become tanky, eat a minion or bottom laner, snowball into their Viktor and ult his face. It's hard for Nunu, even if he gets Frozen Heart second.",
        },
      ],
    },
  ],
};

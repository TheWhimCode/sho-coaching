import type { GuideGameStageSectionConfig } from "@/lib/guides/gameStageGuideTypes";
import { guideVimeoEmbed } from "@/lib/guides/guideEmbeds";

export const VIEGO_GAME_STAGES_SECTION: GuideGameStageSectionConfig = {
  heading: "Game Plan",
  categories: [
    {
      id: "early",
      label: "Early",
      subtitle:
        "Before first item: fullclear, scale, don't waste your tempo, prevent invades.",
      topics: [
        {
          id: "early-gameplan",
          label: "Gameplan",
          summary:
            "Your main priority is to get to 3 items as quickly as possible.",
          steps: [
            {
              label: "Step 1",
              text: "Get yourself a lead. You need to get to your spikes.",
            },
            {
              label: "Step 2",
              text: "Take over the map. Invade, play for your wincon, secure objectives.",
            },
          ],
          body: [
            "As a carry jungler, there are two steps to winning:",
            "Start with step 1 every game. Path to whatever side is most likely to get you an advantage. CC setup, volatile matchups, prio if you're high elo, etc.",
            "Most plays you're going for should happen when your camps are all cleared. If you waste time or lose HP, you open yourself up to getting invaded way too early into the game.",
            "Mute all at the start. Your teammates will want you to do drakes and gank, but if you make bad decisions and fall behind, your champion stops functioning.",
          ].join("\n\n"),
        },
        {
          id: "first-clear",
          label: "First clear",
          isNew: true,
          summary:
            "You should always be on Scuttle before it spawns, especially with Blue start.",
          body: [
            "To fullclear, level Q -> W -> Q -> E.",
            "Don't put the point in until you reach your fourth camp. If you got invaded, you need your E.",
          ].join("\n\n"),
          externalLink: {
            label: "Watch this TikTok",
            href: "https://www.tiktok.com/@saizolol/video/7628770867605933345?q=viego%20clear&t=1783854069604",
          },
          bodyAfterExternalLink: [
            "If you started Blue and know the enemy will 100% get Scuttle on the same side OR is 100% pathing away, do Krugs before Red. It's slower, but better on second clear.",
            "Since you won't contest the enemy on the Scuttle, we can waste some time.",
          ].join("\n\n"),
        },
        {
          id: "getting-invaded",
          label: "Getting invaded",
          isNew: true,
          summary: "You are pretty weak early. Think about and react well to invades.",
          body: [
            "Watch out for invades, you're pretty weak in early 1v1s. Think about what the enemy is playing.",
            "Champions like Bel'Veth or Kayn love to go for a level 1 Raptors cheese to then fight you at your Red. Ward for that or check by kiting your Red out a little bit.",
            "Usually, I start the game by warding the opposite buff of the side I start, to see if I'm getting cheesed.",
            "The most important piece of advice I have for getting invaded is that you stay calm and rational. If you can't win the 1v1, give up your camps. If you can't take their camps in return because the enemies will stop you, don't die trying.",
          ].join("\n\n"),
          invaderList: [
            { id: "warwick", champion: "Warwick", label: "Warwick" },
            { id: "shaco", champion: "Shaco", label: "HOB Shaco" },
            { id: "briar", champion: "Briar", label: "Briar" },
            { id: "rengar", champion: "Rengar", label: "Rengar" },
            { id: "belveth", champion: "Bel'Veth", label: "Bel'Veth" },
            { id: "kindred", champion: "Kindred", label: "Kindred" },
            { id: "unusual-ignite-hob", champions: ["Master Yi", "Kayn", "Vi"], label: "Unusual Ignite/HOB users" },
          ],
          videos: [
            {
              label: "Handling an invade.",
              embedUrl: guideVimeoEmbed("1209013157"),
            },
          ],
          bodyAfterVideos:
            "Your enemy decided to walk halfway across the map multiple times. They are not getting any meaningful advantage, they're just making both of you fall behind.",
        },
        {
          id: "how-to-gank",
          label: "How to gank",
          disabled: true,
          summary: "Early Viego wins by showing up with a real threat, not by hovering every lane forever.",
          body: [
            "Gank when a lane has CC or setup, when the wave is pushing toward you, or when the enemy has burned a key defensive. If none of that is true, farming is almost always correct — your level 6 spike is your real power spike, not level 3.",
            "If you gank and don't get a kill, take something else: plates if top has prio, Scuttle if mid is stable, or invade one camp if you know where the enemy jungler is not.",
            "Ping before you path. Laners play differently when they know you're coming, and you avoid the classic 'I ganked but my mid was frozen under tower with no mana' situation.",
          ].join("\n\n"),
        },
      ],
    },
    {
      id: "mid",
      label: "Mid",
      subtitle: "During items 1-2: adjust to the gamestate!",
      topics: [
        {
          id: "mid-from-ahead",
          label: "From ahead",
          isNew: true,
          summary: "Like other scaling assassins, if you got a lead early, you can start playing proactively.",
          body: [
            "Especially if you didn't buy Hubris (but even if you did), you can move on to step 2. Read the map. Where can you snowball the hardest?",
            "Can you invade? Stack drakes? Snowball your winning laners or stabilize a losing matchup? Getting ahead opens up a ton of options. Just don't greed and throw.",
            "Keep scaling.",
          ].join("\n\n"),
          videos: [
            {
              label: "Look at the map, find winning fights",
              embedUrl: guideVimeoEmbed("1209012987"),
            },
          ],
        },
        {
          id: "mid-from-behind",
          label: "From behind",
          summary: "Focus on coming back. Don't obsess over objectives or fed enemies.",
          body: [
            "We didn't get a lead in the early game.",
            "Your main priority is still step 1, getting into the game. Which of your laners are winning? Where can you win a fight? Often the best option is to give up an objective and look for crossmap plays, farm a lot, and wait for a mistake.",
            "Don't worry, the enemies always throw. Keep up your tempo and be ready for that.",
          ].join("\n\n"),
        },
      ],
    },
    {
      id: "late",
      label: "Late",
      subtitle:
        "From LDR onwards: Find picks and high-value fights around enemy camps and objectives",
      topics: [
        {
          id: "late-finding-picks",
          label: "Finding picks",
          isNew: true,
          summary: "You are an assassin. You thrive when you can get your single target burst off on isolated targets. Look at the map.",
          body: [
            "Ideally, you want to find picks in between fights. The more split up your enemies are, the easier your game is. Less alive enemies = more isolated targets.",
            "But finding picks is difficult. Assassin macro is among the hardest in the game, because you need to understand your enemies' macro and vision setup to sneak to where they are gonna facecheck.",
          ].join("\n\n"),
          bodyBetweenVideos:
            "Play through sidelanes a lot. Keep track of which enemies tend to overextend and which ones respect you. Check which turrets are broken, so you can wrap around your targets.",
          bodyAfterVideos:
            "Every laner wants farm. Every jungler wants camps. Every support wants to provide vision. Think in between fights. The faster you identify where to go, the earlier you'll be there and potentially win the next fight without relying on your team at all.",
          videos: [
            {
              label: "Understanding the map",
              embedUrl: guideVimeoEmbed("1209018193"),
            },
          ],
          videosAfterBody: [
            {
              label: "Solo winning through pick setup.",
              embedUrl: guideVimeoEmbed("1207112926"),
            },
          ],
        },
        {
          id: "late-using-e",
          label: "Using E",
          isNew: true,
          summary: "Viego's E is his most underrated ability. Use it well.",
          body: [
            "Every assassin needs a tool to get in range. To sneak up to their opponents. Talon e, Qiyana w. Viego's tool is his E.",
            "Since you're building full burst, this ability is transformed into an extremely high pressure zone. Squishy champions can never disrespect you. They can't bait you. You'll oneshot them.",
            "Before teamfights, you use this ability to create space. Walk up to the furthest wall near the enemies and E it. They will spam abilities into the mist, praying you're an inter. Don't be an inter.",
          ].join("\n\n"),
          videos: [
            {
              label: "Creating space with E",
              embedUrl: guideVimeoEmbed("1209020142"),
            },
          ],
          bodyAfterVideos: [
            "While your E is active, you avoid all vision besides Control Wards. You can use this to sneak into bushes way deeper than people expect, or walk up to a disrespecting carry and oneshot them.",
            "Watch out when facechecking bushes or corners. Enemies can have Sweeper active. You can also turn on your Sweeper though, it has more range than your stealth. It's really useful to prepare objectives or win fights.",
          ].join("\n\n"),
        },
      ],
    },
    {
      id: "teamfights",
      label: "Teamfights",
      subtitle:
        "Play like an assassin. Set up, be patient, wait for your angle. Then burst & reset.",
      topics: [
        {
          id: "tf-patience",
          label: "Patience",
          isNew: true,
          summary: "The high elo tiger can restrain himself.",
          body: [
            "You need an angle. It doesn't matter if your team will lose the fight or the objective. If there is no angle, your champion can't work.",
            "This is why we run 2x Lethality + HOB. So that you can punish effectively when the enemy messes up.",
            "Wait for that.",
          ].join("\n\n"),
        },
        {
          id: "tf-target-focus",
          label: "Target focus",
          isNew: true,
          summary:
            "Pick your targets wisely, or you'll end up like Viper from Game of Thrones.",
          body: [
            "Time-to-kill is your defensive tool. HOB is your damage. Pick targets that you can kill quickly or safely.",
            "Reach squishy carries with your W tap burst or focus isolated frontliners that overextend. But don't try to be Thanos. You can't beat Rammus or Warwick in a fair 1v1. That's not the point.",
            "Frontliners that move into your team are good matchups, because they expose themselves to your team's damage and CC, and your engage range.",
            "That doesn't mean you can't find picks 1v1, especially with fully charged Ws. But once it gets to the 5v5s, you gotta be more brainy.",
          ].join("\n\n"),
        },
        {
          id: "tf-fog-of-war",
          label: "Fog of war",
          isNew: true,
          summary:
            "You are an assassin. Initiative & striking first are your biggest advantage. Be sneaky.",
          body: [
            "Your highest priority targets will try to position safely behind their frontliners. As an assassin, you can't just charge through all of the king's guard. You need to wrap around, undetected.",
          ].join("\n\n"),
          bodyAfterBanner:
            "Ideally you find a pick before the fight, but often this is not possible. Use fog of war, your E, and good pre-fight positioning to set yourself up for success.",
          quote: {
            lead: "I always tell people:",
            text: "What would Ezio do?",
          },
          bannerImageSrc: "https://videos.its-mino.com/guide/gameplan/Ezio.jpg",
          bannerImageAlt: "Ezio from Assassin's Creed",
          videos: [
            {
              label: "Using fog of war & positioning to set up a fight",
              embedUrl: guideVimeoEmbed("1209019491"),
            },
          ],
        },
      ],
    },
  ],
};

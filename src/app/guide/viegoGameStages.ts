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
            "Mute all at the start. Your team mates will want you to do drakes and gank, but if you make bad decisions and fall behind your champion stops functioning.",
          ].join("\n\n"),
        },
        {
          id: "first-clear",
          label: "First clear",
          disabled: true,
          summary: "Your first route sets up your first gank window and your first recall timing.",
          body: [
            "Standard full clear into scuttle is fine when you don't have free gankable lanes. If bot has hard CC and push, or mid has level 2 kill pressure, adjust your path so you arrive with camps still up on the opposite side — you want options, not a rigid route you saw on a tier list.",
            "Track the enemy jungler's start if you can. If they started opposite side, you know which scuttle is contested and which lane is vulnerable to a delayed gank.",
            "Don't die for scuttle on Viego. The crab is tempo, not a win condition. A bad trade into a level 3 skirmish costs you more than one camp ever will.",
          ].join("\n\n"),
        },
        {
          id: "getting-invaded",
          label: "Getting invaded",
          summary: "You are pretty weak early. Think about and react well to invades.",
          body: [
            "Watch out for invades, you're pretty weak in early 1v1s.",
            "Think about what the enemy is playing. Warwick, HOB Shaco, Briar or Rengar players love to invade. Sometimes enemies run Ignite randomly. Or HOB on champs that usually don't. Respect that.",
            "Champions like Bel'Veth or Kayn love to go for a level 1 Raptor cheese, to then fight you at your red. Ward for that or check by kiting your Red out a little bit.",
            "Usually, I start the game by warding the opposite buff of the side I start, to see if I'm getting cheesed.",
            "The most important piece of advice I have for getting invaded, is that you stay calm and rational. If you can't win the 1v1, give up your camps. If you can't take their camps in return cuz the enemies will stop you, don't die trying.",
            "Your enemy decided to walk halfway across the map multiple times. They are not getting any meaningful advantage, they're just making both of your fall behind.",
          ].join("\n\n"),
        },
        {
          id: "how-to-gank",
          label: "How to gank",
          disabled: true,
          summary: "Early Viego wins by showing up with a real threat, not by hovering every lane forever.",
          body: [
            "Gank when a lane has CC or setup, when the wave is pushing toward you, or when the enemy has burned a key defensive. If none of that is true, farming is almost always correct — your level 6 spike is your real power spike, not level 3.",
            "If you gank and don't get a kill, take something else: plates if top has prio, crab if mid is stable, or invade one camp if you know where the enemy jungler is not.",
            "Ping before you path. Laners play differently when they know you're coming, and you avoid the classic 'I ganked but my mid was frozen under tower with no mana' situation.",
          ].join("\n\n"),
        },
      ],
    },
    {
      id: "mid",
      label: "Mid",
      subtitle: "During item 1-2: adjust to the gamestate!",
      topics: [
        {
          id: "mid-from-ahead",
          label: "From ahead",
          summary: "Like other scaling assassins, if you got a lead early you can start playing proactively.",
          body: [
            "Especially if you didn't buy Hubris (but even if you did), you can move onto step 2. Read the map. Where can you snowball the hardest?",
            "Can you invade? Stack drakes? Snowball your winning laners or stabilize a losing matchup? Getting ahead opens up a ton of options, just don't greed and throw.",
            "Keep scaling.",
          ].join("\n\n"),
        },
        {
          id: "mid-from-behind",
          label: "From behind",
          summary: "Focus on coming back, don't obsess over objectives or fed enemies.",
          body: [
            "We didn't get a lead in the early game.",
            "Your main priority is still step 1, getting into the game. Which of your laners are winning? Where can you win a fight? Often the best option is to give up an objective and look for crossmap plays, farm a lot and wait for a mistake.",
            "Don't worry, the enemies always throw. Keep up your tempo and be ready for that.",
          ].join("\n\n"),
        },
      ],
    },
    {
      id: "late",
      label: "Late",
      subtitle:
        "From LDR onwards: Find picks and high value fights around enemy camps and objectives",
      topics: [
        {
          id: "late-finding-picks",
          label: "Finding picks",
          summary: "You are an assassin. You thrive when you can get your single target burst off on isolated targets. Look at the map.",
          body: [
            "Ideally, you want to find picks in between fights. The more split up your enemies are, the easier your game is. Less alive enemies = more isolated targets.",
            "But finding picks is difficult. Assassin macro is among the hardest in the game, because you need to understand your enemies macro and vision setup to sneak to where they are gonna facecheck.",
            "Play through sidelanes a lot. Keep track of which enemies tend to overextend and which respect. Check which turrets are broken, so you can wrap around your targets.",
            "Every laner wants farm. Every jungler wants camps. Every support wants to provide vision. Think in between fights, the faster you identify where to go, the earlier you'll be there and potentially win the next fight without relying on your team at all.",
          ].join("\n\n"),
          videos: [
            {
              label: "Example — solo winning through pick setup.",
              embedUrl: guideVimeoEmbed("1207112926"),
            },
          ],
        },
        {
          id: "late-using-e",
          label: "Using E",
          summary: "Viego's E is his most underrated ability. Use it well.",
          body: [
            "Every assassin needs a tool to get in range. To sneak up to their opponents. Talon E, Qiyana W. Viego's tool is his E.",
            "Since you're building full burst, this ability is transformed into an extremely high pressure zone. Squishy champions can never disrespect you. They can't bait you. You'll oneshot them.",
            "Before teamfights, you use this ability to create space. Walk up to the furthest wall near the enemies and E it. They will spam abilities into the mist, praying you're an inter. Don't be an inter.",
            "While your E is active, you avoid all vision besides Control Wards. You can use this to sneak into bushes way deeper than people expect, or walk up to a disrespecting carry and oneshot them.",
            "Watch out when facechecking bushes or corners, enemies can have Sweeper active. You can also turn on your Sweeper though, it has more range than your stealth. It's really useful to prepare objectives or win fights.",
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
          disabled: true,
          summary: "Your job is usually not to go in first — it's to make the carry panic after the fight starts.",
          body: [
            "Wait for engage or for a key cooldown to get burned. If Malphite just R'd and the enemy team is clumped, that's your window — not before.",
            "If you can't reach the carry without flashing through three people, hold W for peel or a follow-up reset instead of suicide running.",
            "After the first kill, decide instantly: can you R reset into another carry, or should you W out and wait for cooldowns?",
          ].join("\n\n"),
        },
        {
          id: "tf-target-focus",
          label: "Target focus",
          disabled: true,
          summary: "Know who dies to one combo — and who becomes a useful body after you take them.",
          body: [
            "Before the fight, know your R targets. Who dies to one combo? Who becomes a useful body after you take them? Bad resets lose fights; good ones turn 5v5s into 5v3s.",
            "Save W for the moment after R lands if you need to stick or stun the next target. Don't blow everything on the first body if the fight isn't over.",
            "If your team is losing the front line, reset onto a bruiser with damage and survivability — sometimes taking their jungler or mid with GA up is better than dying for the ADC.",
          ].join("\n\n"),
        },
        {
          id: "tf-fog-of-war",
          label: "Fog of war",
          disabled: true,
          summary: "Viego teamfights are won from angles the enemy didn't clear — not from running in first.",
          body: [
            "Path with E through minions or use fog to get angle. If you can't reach the carry without flashing through three people, hold W for peel or a follow-up reset instead of suicide running.",
            "Establish vision on one side of the pit before the fight starts. The team that knows where you are less afraid to walk up; the team that doesn't gives you free W connects.",
            "Use W from fog on the player trying to end, not on the full tank line. Late game Viego still deletes carries — you just need one angle they didn't respect.",
          ].join("\n\n"),
        },
      ],
    },
  ],
};

import type { GuideGameStageSectionConfig } from "@/lib/guides/gameStageGuideTypes";
import { guideVimeoEmbed } from "@/lib/guides/guideEmbeds";

export const VIEGO_GAME_STAGES_SECTION: GuideGameStageSectionConfig = {
  heading: "Game Plan",
  subtitle: "What to prioritize at each stage — and how to actually execute it.",
  categories: [
    {
      id: "early",
      label: "Early",
      subtitle: "Before first item: survive, path efficiently, and don't donate your tempo to bad fights.",
      topics: [
        {
          id: "early-invades",
          label: "How to deal with early invades",
          summary: "Most early invades are won or lost before anyone clicks — by information and pathing, not mechanics.",
          body: [
            "If the enemy jungler shows on the opposite side of the map, you do not need to match them scuttle for scuttle. Take your camps, track their timer, and punish with a gank or a counter-jungle window once you know where they started.",
            "When they invade you, the worst thing you can do is facecheck the river on autopilot. Ping your laners, hold your W for the choke point, and only commit if you have priority or numbers. Viego wins extended skirmishes early only when you force them into a bad angle — not when you run straight at five people.",
            "If you're behind after an invade, reset your mental and your path. Full clear, grab the safest scuttle you can, and look for a free kill on a pushed lane instead of trying to hero fight for river control you already lost.",
          ].join("\n\n"),
          videos: [
            {
              label: "Example — responding to an early invade",
              embedUrl: guideVimeoEmbed("1207112926"),
            },
          ],
        },
        {
          id: "first-clear",
          label: "First clear priorities",
          summary: "Your first route sets up your first gank window and your first recall timing.",
          body: [
            "Standard full clear into scuttle is fine when you don't have free gankable lanes. If bot has hard CC and push, or mid has level 2 kill pressure, adjust your path so you arrive with camps still up on the opposite side — you want options, not a rigid route you saw on a tier list.",
            "Track the enemy jungler's start if you can. If they started opposite side, you know which scuttle is contested and which lane is vulnerable to a delayed gank.",
            "Don't die for scuttle on Viego. The crab is tempo, not a win condition. A bad trade into a level 3 skirmish costs you more than one camp ever will.",
          ].join("\n\n"),
        },
        {
          id: "early-gank-timing",
          label: "When to gank vs keep farming",
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
      subtitle: "First items online through second drake: convert leads before you need perfect teamfight execution.",
      topics: [
        {
          id: "mid-drake-setup",
          label: "Drake setup as Viego",
          summary: "You don't win drakes by starting them early — you win them by making the enemy afraid to walk up.",
          body: [
            "Before drake spawns, clear vision from river and establish fog on one side. Viego loves fighting from brush or over walls where your W connects first.",
            "If your team has no prio lanes, don't force a 4v5 around pit at spawn. Trade something on the map — a pick, a side tower, or enemy jungle camps — and come back when you have numbers or item spikes.",
            "When you do fight, decide pre-fight whether you're flanking for a carry or playing front-to-back for picks. Midgame Viego with one lethality item can delete a mispositioned ADC, but you die instantly if you walk in first.",
          ].join("\n\n"),
        },
        {
          id: "mid-side-lane",
          label: "Side lane pressure & picks",
          summary: "Mid game is about creating a threat on side lanes that forces bad responses.",
          body: [
            "When ahead, push a side wave and hide in fog. The enemy has to answer the wave or give plates — either way you get information or a fight on your terms.",
            "Don't ARAM mid unless an objective is actually spawning in the next minute. Viego scales with gold and resets; standing in mid wave for nothing is how you lose your lead.",
            "If you're even or behind, play with your strongest side laner or support roams. One pick into a reset fight is worth more than farming three extra camps while the enemy groups.",
          ].join("\n\n"),
        },
      ],
    },
    {
      id: "late",
      label: "Late",
      subtitle: "Two items+, baron/elder territory: one mistake ends the game.",
      topics: [
        {
          id: "late-close-out",
          label: "Closing out games",
          summary: "Late Viego wins by ending before the enemy outscales you in a 5v5 stat check.",
          body: [
            "When you're ahead, force objectives with vision control instead of chasing kills in their jungle for nothing. Baron pressure with a side wave makes them walk into your fog — that's your win condition.",
            "If you get a pick, take something permanent: inhibitor, elder, or baron. Reset chains feel good, but a tower or baron buff closes games; a stylish triple kill in jungle often doesn't.",
            "Watch for stopwatch, GA, and Zhonya's timers on key targets. Your burst window is narrow — commit when those are down, not when the enemy mid has every defensive ready.",
          ].join("\n\n"),
        },
        {
          id: "late-defending",
          label: "Defending when behind",
          summary: "You can still win fights from behind — but only if you stop giving free picks.",
          body: [
            "Defend waves first, fights second. One dead ADC before baron spawn loses you the game even if you got a kill earlier.",
            "Use W from fog on the player trying to end, not on the full tank line. Late game Viego still deletes carries — you just need one angle.",
            "If elder is impossible, trade baron for something you can hold: inner turret, farm safely, or pick on their carry catching a side wave.",
          ].join("\n\n"),
        },
      ],
    },
    {
      id: "teamfights",
      label: "Teamfights",
      subtitle: "Where Viego is either the best champion in the game or inting in 0.4 seconds.",
      topics: [
        {
          id: "tf-assassination",
          label: "Backline assassination",
          summary: "Your job is usually not to go in first — it's to make the carry panic after the fight starts.",
          body: [
            "Wait for engage or for a key cooldown to get burned. If Malphite just R'd and the enemy team is clumped, that's your window — not before.",
            "Path with E through minions or use fog to get angle. If you can't reach the carry without flashing through three people, hold W for peel or a follow-up reset instead of suicide running.",
            "After the first kill, decide instantly: can you R reset into another carry, or should you W out and wait for cooldowns? Greed is how 1-for-1 trades become lost teamfights.",
          ].join("\n\n"),
        },
        {
          id: "tf-reset-chains",
          label: "Reset chains",
          summary: "The fantasy — and the part that actually wins games when you plan it.",
          body: [
            "Before the fight, know your R targets. Who dies to one combo? Who becomes a useful body after you take them? Bad resets lose fights; good ones turn 5v5s into 5v3s.",
            "Save W for the moment after R lands if you need to stick or stun the next target. Don't blow everything on the first body if the fight isn't over.",
            "If your team is losing the front line, reset onto a bruiser with damage and survivability — sometimes taking their jungler or mid with GA up is better than dying for the ADC.",
          ].join("\n\n"),
        },
      ],
    },
  ],
};

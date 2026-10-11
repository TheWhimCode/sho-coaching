import { NextRequest, NextResponse } from "next/server";
import {
  champSquareUrlById,
  getChampionsByKey,
  resolveChampionId,
} from "@/lib/datadragon/champions";
import { ensureLiveDDragonPatch } from "@/lib/datadragon/patch";
import {
  ensureSummonerSpellsAssets,
  summonerSpellIconById,
  summonerSpellKeyById,
} from "@/lib/datadragon/summonerspells";
import { runDecisionTree, type ChampionTraits, type TreeParticipant } from "@/lib/guides/buildPicker/decisionTree";
import type {
  BuildRecommendation,
  LiveGameLookup,
  LiveGameParticipant,
  LiveGameSpell,
  LiveGameTeamSide,
} from "@/lib/guides/buildPicker/types";
import { prisma } from "@/lib/prisma";
import {
  findPlatformForPuuid,
  normalizePlatform,
  resolveAccountByRiotTag,
  type Regional,
} from "@/lib/riot/core";
import { activeGameByPuuid, NotInGameError, queueName } from "@/lib/riot/spectator";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function spell(id: number): LiveGameSpell {
  return {
    id,
    key: summonerSpellKeyById(id) ?? String(id),
    icon: summonerSpellIconById(id) ?? "",
  };
}

/** Match participants to `ChampionProfile` rows by Data Dragon id so name spelling doesn't matter. */
async function recommend(
  allies: LiveGameParticipant[],
  enemies: LiveGameParticipant[]
): Promise<BuildRecommendation> {
  const profiles = await prisma.championProfile.findMany();
  const byChampionId = new Map<string, ChampionTraits>();
  for (const row of profiles) {
    byChampionId.set(resolveChampionId(row.name), {
      name: row.name,
      durability: row.durability,
      shields: row.shields,
      damageType: row.damageType,
      damageThreat: row.damageThreat,
      deniesResets: row.deniesResets,
      cc: row.cc,
    });
  }

  const missingProfiles: string[] = [];
  const traitsFor = (team: LiveGameParticipant[]): TreeParticipant[] =>
    team.flatMap((participant) => {
      const traits = byChampionId.get(participant.championId);
      if (!traits) {
        missingProfiles.push(participant.championName);
        return [];
      }
      return [
        {
          ...traits,
          championId: participant.championId,
          spellIds: participant.spells.map((entry) => entry.id),
        },
      ];
    });

  const result = runDecisionTree({ allies: traitsFor(allies), enemies: traitsFor(enemies) });
  return { ...result, missingProfiles };
}

/* ------------------------------------------------------------------ */
/* Sample game (?mock=1) for working on the UI without being in game   */
/* ------------------------------------------------------------------ */

const SAMPLE_DELAY_MS = 1400;

const SAMPLE_BLUE: { champion: string; spells: [number, number]; isPlayer?: boolean }[] = [
  { champion: "Garen", spells: [4, 12] },
  { champion: "Viego", spells: [4, 11], isPlayer: true },
  { champion: "Lissandra", spells: [4, 14] },
  { champion: "Vayne", spells: [4, 7] },
  { champion: "Leona", spells: [4, 14] },
];

const SAMPLE_RED: { champion: string; spells: [number, number] }[] = [
  { champion: "Kled", spells: [4, 12] },
  { champion: "Jarvan IV", spells: [4, 11] },
  { champion: "Sylas", spells: [4, 14] },
  { champion: "Samira", spells: [4, 7] },
  { champion: "Camille", spells: [4, 3] },
];

function sampleParticipant(
  entry: { champion: string; spells: [number, number]; isPlayer?: boolean },
  riotId: string
): LiveGameParticipant {
  const championId = resolveChampionId(entry.champion);
  return {
    championName: entry.champion,
    championId,
    championIcon: champSquareUrlById(championId),
    spells: entry.spells.map(spell),
    isSearchedPlayer: Boolean(entry.isPlayer),
    riotId: entry.isPlayer ? riotId : undefined,
  };
}

async function sampleGame(riotId: string, platform: string): Promise<LiveGameLookup> {
  await new Promise((resolve) => setTimeout(resolve, SAMPLE_DELAY_MS));
  const blue = SAMPLE_BLUE.map((entry) => sampleParticipant(entry, riotId));
  const red = SAMPLE_RED.map((entry) => sampleParticipant(entry, riotId));
  return {
    status: "in_game",
    mock: true,
    riotId,
    platform: platform === "auto" ? "euw1" : platform,
    queue: "Ranked Solo/Duo",
    gameStartedAt: Date.now() - 1000 * 60 * 2,
    playerSide: "blue",
    blue,
    red,
    recommendation: await recommend(blue, red),
  };
}

/* ------------------------------------------------------------------ */
/* Real lookup                                                         */
/* ------------------------------------------------------------------ */

async function liveGame(riotId: string, platformInput: string): Promise<LiveGameLookup> {
  // 1. Riot ID → PUUID. A chosen server tries its routing region first, then the rest.
  const chosen = platformInput !== "auto" ? normalizePlatform(platformInput) : null;
  const preferredRegion: Regional | undefined = chosen?.region;
  const preferredPlatform = preferredRegion ? chosen?.platform : undefined;

  let account;
  try {
    account = await resolveAccountByRiotTag(
      riotId,
      preferredRegion ? { preferredRegion } : undefined,
    );
  } catch (error) {
    if (error instanceof Error && /Riot API 404|not_found/.test(error.message)) {
      return { status: "not_found", riotId };
    }
    throw error;
  }

  // 2. Which platform shard hosts this player's LoL account.
  //    Auto keeps the usual order. A chosen server is moved to the front.
  const platform = await findPlatformForPuuid(account.puuid, account.regional, preferredPlatform);
  if (!platform) return { status: "not_found", riotId };

  // 3. Active game.
  let game;
  try {
    game = await activeGameByPuuid(platform, account.puuid);
  } catch (error) {
    if (error instanceof NotInGameError) return { status: "not_in_game", riotId };
    throw error;
  }

  // 4. Map participants to Data Dragon champions and summoner spells.
  const championsByKey = await getChampionsByKey();
  const toParticipant = (p: (typeof game.participants)[number]): LiveGameParticipant => {
    const champion = championsByKey.get(p.championId);
    const championId = champion?.id ?? String(p.championId);
    const isSearchedPlayer = p.puuid === account.puuid;
    return {
      championName: champion?.name ?? championId,
      championId,
      championIcon: champSquareUrlById(championId),
      spells: [spell(p.spell1Id), spell(p.spell2Id)],
      isSearchedPlayer,
      riotId: isSearchedPlayer ? `${account.gameName}#${account.tagLine}` : p.riotId,
    };
  };

  const blue = game.participants.filter((p) => p.teamId === 100).map(toParticipant);
  const red = game.participants.filter((p) => p.teamId === 200).map(toParticipant);
  const me = game.participants.find((p) => p.puuid === account.puuid);
  const playerSide: LiveGameTeamSide = me?.teamId === 200 ? "red" : "blue";
  const allies = playerSide === "blue" ? blue : red;
  const enemies = playerSide === "blue" ? red : blue;

  return {
    status: "in_game",
    riotId: `${account.gameName}#${account.tagLine}`,
    platform,
    queue: queueName(game.gameQueueConfigId),
    gameStartedAt: game.gameStartTime || null,
    playerSide,
    blue,
    red,
    recommendation: await recommend(allies, enemies),
  };
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const riotId = (req.nextUrl.searchParams.get("riotId") ?? "").trim();
  const platform = (req.nextUrl.searchParams.get("platform") ?? "auto").trim();
  const mock = req.nextUrl.searchParams.get("mock") === "1";

  if (!riotId.includes("#")) {
    const body: LiveGameLookup = { status: "error", message: 'Enter your Riot ID as "Name#TAG".' };
    return NextResponse.json(body, { status: 400 });
  }

  await Promise.all([ensureLiveDDragonPatch(), ensureSummonerSpellsAssets()]);

  try {
    const body = mock ? await sampleGame(riotId, platform) : await liveGame(riotId, platform);
    return NextResponse.json(body);
  } catch (error) {
    console.error("[live-game]", error);
    const body: LiveGameLookup = {
      status: "error",
      message: error instanceof Error ? error.message : "Riot lookup failed.",
    };
    return NextResponse.json(body, { status: 502 });
  }
}

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
import { compositionFacts } from "@/lib/guides/buildPicker/compositionFacts";
import { loadPickerBuilds } from "@/lib/guides/buildPicker/loadBuilds";
import { VIEGO_ITEM_SECTION } from "@/app/guide/viegoItems";
import { runDecisionTree, type ChampionTraits, type TreeParticipant } from "@/lib/guides/buildPicker/decisionTree";
import type {
  BuildRecommendation,
  LiveGameLookup,
  LiveGameParticipant,
  LiveGameSpell,
  LiveGameTeamSide,
} from "@/lib/guides/buildPicker/types";
import { pickerProfiles } from "@/lib/guides/buildPicker/profiles.server";
import { unstable_cache } from "next/cache";
import { enforceRequestLimit, RequestLimitError, visitorBucket } from "@/lib/security/requestLimit";
import { SingleFlight } from "@/lib/security/singleFlight";
import { withRiotLookupDeadline } from "@/lib/riot/fetch";
import {
  findPlatformForPuuid,
  normalizePlatform,
  resolveAccountByRiotTag,
  type Regional,
} from "@/lib/riot/core";
import {
  matchByIdAcrossRegions,
  MatchNotFoundError,
  parseMatchId,
  participantRiotId,
  perkIdsFromMatch,
} from "@/lib/riot/match";
import { activeGameByPuuid, NotInGameError, queueName } from "@/lib/riot/spectator";
import { isSupportedPickerGame, UNSUPPORTED_GAME_MESSAGE } from "@/lib/guides/buildPicker/supportedGame";

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
  const profiles = await pickerProfiles();
  const byChampionId = new Map<string, ChampionTraits & {
    durabilityScore: number | null;
    damageScore: number | null;
    ccScore: number | null;
    shieldScore: number | null;
    shieldTiming: string | null;
    mercuryTreadsScore: number | null;
    canBuildSteelcaps: boolean | null;
  }>();
  for (const row of profiles) {
    byChampionId.set(resolveChampionId(row.name), {
      name: row.name,
      shields: row.shields,
      damageType: row.damageType,
      damageThreat: row.damageThreat,
      deniesResets: row.deniesResets,
      cc: row.cc,
      durabilityScore: row.durabilityScore,
      damageScore: row.damageScore,
      ccScore: row.ccScore,
      shieldScore: row.shieldScore,
      shieldTiming: row.shieldTiming,
      mercuryTreadsScore: row.mercuryTreadsScore,
      canBuildSteelcaps: row.canBuildSteelcaps,
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
          perkIds: participant.perkIds ?? [],
        },
      ];
    });

  const result = runDecisionTree({ allies: traitsFor(allies), enemies: traitsFor(enemies) });
  const factChamp = (participant: LiveGameParticipant) => {
    const row = byChampionId.get(participant.championId);
    return {
      name: participant.championName,
      championId: participant.championId,
      championIcon: participant.championIcon,
      damageType: row?.damageType,
      damageScore: row?.damageScore ?? participant.damageScore,
      ccScore: row?.ccScore,
      canBuildSteelcaps: row?.canBuildSteelcaps,
      deniesResets: row?.deniesResets,
    };
  };
  return {
    ...result,
    builds: await loadPickerBuilds(VIEGO_ITEM_SECTION),
    missingProfiles,
    facts: compositionFacts(allies.map(factChamp), enemies.map(factChamp)),
  };
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

async function withProfileScores(blue: LiveGameParticipant[], red: LiveGameParticipant[]) {
  const profiles = await pickerProfiles();
  const byChampionId = new Map(
    profiles.map((row) => [resolveChampionId(row.name), row] as const)
  );
  const apply = (team: LiveGameParticipant[]) =>
    team.map((participant) => {
      const row = byChampionId.get(participant.championId);
      return {
        ...participant,
        durabilityScore: row?.durabilityScore ?? null,
        damageScore: row?.damageScore ?? null,
      };
    });
  return { blue: apply(blue), red: apply(red) };
}

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

async function sampleGame(
  riotId: string,
  platform: string,
  extras?: { source?: "live" | "match"; matchId?: string }
): Promise<LiveGameLookup> {
  await new Promise((resolve) => setTimeout(resolve, SAMPLE_DELAY_MS));
  const blue = SAMPLE_BLUE.map((entry) => sampleParticipant(entry, riotId));
  const red = SAMPLE_RED.map((entry) => sampleParticipant(entry, riotId));
  const scored = await withProfileScores(blue, red);
  return {
    status: "in_game",
    mock: true,
    source: extras?.source ?? "live",
    matchId: extras?.matchId,
    riotId,
    platform: platform === "auto" ? "euw1" : platform,
    queue: "Ranked Solo/Duo",
    gameStartedAt: Date.now() - 1000 * 60 * 2,
    playerSide: "blue",
    ...scored,
    recommendation: await recommend(scored.blue, scored.red),
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

  if (!isSupportedPickerGame({ ...game, queueId: game.gameQueueConfigId })) {
    return { status: "unsupported_mode", message: UNSUPPORTED_GAME_MESSAGE };
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
      perkIds: p.perks?.perkIds ?? [],
      isSearchedPlayer,
      riotId: isSearchedPlayer ? `${account.gameName}#${account.tagLine}` : p.riotId,
    };
  };

  const blue = game.participants.filter((p) => p.teamId === 100).map(toParticipant);
  const red = game.participants.filter((p) => p.teamId === 200).map(toParticipant);
  const scored = await withProfileScores(blue, red);
  const me = game.participants.find((p) => p.puuid === account.puuid);
  const playerSide: LiveGameTeamSide = me?.teamId === 200 ? "red" : "blue";
  const allies = playerSide === "blue" ? scored.blue : scored.red;
  const enemies = playerSide === "blue" ? scored.red : scored.blue;

  return {
    status: "in_game",
    source: "live",
    riotId: `${account.gameName}#${account.tagLine}`,
    platform,
    queue: queueName(game.gameQueueConfigId),
    gameStartedAt: game.gameStartTime || null,
    playerSide,
    ...scored,
    recommendation: await recommend(allies, enemies),
  };
}

const VIEGO_KEY = 234;
const SMITE = 11;

function isViego(participant: { championId: number; championName?: string }) {
  return participant.championId === VIEGO_KEY || participant.championName === "Viego";
}

async function matchGame(rawMatchId: string): Promise<LiveGameLookup> {
  const parsed = parseMatchId(rawMatchId);
  if (!parsed) {
    return { status: "error", message: "Enter a match ID like EUW1_1234567890." };
  }

  let match;
  try {
    match = await matchByIdAcrossRegions(parsed.matchId, parsed.region);
  } catch (error) {
    if (error instanceof MatchNotFoundError) return { status: "match_not_found", matchId: parsed.matchId };
    throw error;
  }

  if (!isSupportedPickerGame(match.info)) {
    return { status: "unsupported_mode", message: UNSUPPORTED_GAME_MESSAGE };
  }

  const participants = match.info.participants ?? [];
  const viegos = participants.filter(isViego);
  const viego =
    viegos.find((participant) => participant.summoner1Id === SMITE || participant.summoner2Id === SMITE) ??
    viegos[0];
  if (!viego) return { status: "no_viego", matchId: match.metadata.matchId };

  const championsByKey = await getChampionsByKey();
  const toParticipant = (p: (typeof participants)[number]): LiveGameParticipant => {
    const champion = championsByKey.get(p.championId);
    const championId = champion?.id ?? String(p.championId);
    const isSearchedPlayer = p.puuid === viego.puuid;
    return {
      championName: champion?.name ?? p.championName ?? championId,
      championId,
      championIcon: champSquareUrlById(championId),
      spells: [spell(p.summoner1Id), spell(p.summoner2Id)],
      perkIds: perkIdsFromMatch(p),
      isSearchedPlayer,
      riotId: participantRiotId(p),
    };
  };

  const blue = participants.filter((p) => p.teamId === 100).map(toParticipant);
  const red = participants.filter((p) => p.teamId === 200).map(toParticipant);
  if (!blue.length || !red.length) {
    return { status: "error", message: "This picker works on 5v5 games." };
  }

  const scored = await withProfileScores(blue, red);
  const playerSide: LiveGameTeamSide = viego.teamId === 200 ? "red" : "blue";
  const allies = playerSide === "blue" ? scored.blue : scored.red;
  const enemies = playerSide === "blue" ? scored.red : scored.blue;
  const platform = (match.info.platformId || parsed.platform || "euw1").toLowerCase();
  const viegoRiotId = participantRiotId(viego) ?? "Viego";

  return {
    status: "in_game",
    source: "match",
    matchId: match.metadata.matchId,
    riotId: viegoRiotId,
    platform,
    queue: queueName(match.info.queueId ?? 0),
    gameStartedAt: match.info.gameStartTimestamp || match.info.gameCreation || null,
    playerSide,
    ...scored,
    recommendation: await recommend(allies, enemies),
  };
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

const lookupFlights = new SingleFlight();
const cachedLiveGame = unstable_cache((riotId: string, platform: string) => withRiotLookupDeadline(() => liveGame(riotId, platform)), ["picker-live-secured-v1"], { revalidate: 15 });
const cachedMatchGame = unstable_cache((matchId: string) => withRiotLookupDeadline(() => matchGame(matchId)), ["picker-match-secured-v1"], { revalidate: 300 });

function lookupError(error: unknown) {
  const limited = error instanceof RequestLimitError;
  if (!limited) console.error("[live-game]", error);
  return NextResponse.json({ status: "error", message: limited ? error.message : "Game lookup is temporarily unavailable. Please try again shortly." } satisfies LiveGameLookup, {
    status: limited ? 429 : 503,
    headers: { "Cache-Control": "no-store", ...(limited ? { "Retry-After": String(error.retryAfter) } : {}) },
  });
}

export async function GET(req: NextRequest) {
  // Reject malformed/oversized inputs before contacting the database or Riot.
  if (req.nextUrl.search.length > 512) return NextResponse.json({ status: "error", message: "Lookup input is too long." }, { status: 400 });
  try {
    await enforceRequestLimit("picker:global", 600, 60_000);
    await enforceRequestLimit(`picker:ip:${visitorBucket(req.headers)}`, 20, 60_000);
    return await handleLookup(req);
  } catch (error) { return lookupError(error); }
}

async function handleLookup(req: NextRequest) {
  const matchId = (req.nextUrl.searchParams.get("matchId") ?? "").trim();
  const riotId = (req.nextUrl.searchParams.get("riotId") ?? "").trim();
  const platformInput = (req.nextUrl.searchParams.get("platform") ?? "auto").trim().toLowerCase();
  const normalized = normalizePlatform(platformInput);
  if (platformInput !== "auto" && !normalized.region) {
    return NextResponse.json({ status: "error", message: "Choose a supported server." }, { status: 400 });
  }
  const platform = platformInput === "auto" ? "auto" : normalized.platform;
  const mock = process.env.NODE_ENV === "development" && req.nextUrl.searchParams.get("mock") === "1";
  if (process.env.NODE_ENV !== "development" && req.nextUrl.searchParams.has("mock")) {
    return NextResponse.json({ status: "error", message: "Use the random game button to try the picker." }, { status: 400 });
  }

  if (matchId) {
    const parsed = parseMatchId(matchId, platform);
    if (!parsed?.platform) {
      const body: LiveGameLookup = {
        status: "error",
        message: "Enter the match number and pick a server, or paste a full id like EUW1_1234567890.",
      };
      return NextResponse.json(body, { status: 400 });
    }

    await Promise.all([ensureLiveDDragonPatch(), ensureSummonerSpellsAssets()]);

    try {
      const body = mock
        ? await sampleGame("Viego#EUW", parsed.platform ?? "euw1", {
            source: "match",
            matchId: parsed.matchId,
          })
        : await lookupFlights.run(`match:${parsed.matchId}`, () => cachedMatchGame(parsed.matchId));
      return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return lookupError(error);
    }
  }

  if (!/^[^#]{3,16}#[^#]{3,5}$/.test(riotId)) {
    const body: LiveGameLookup = { status: "error", message: 'Enter your Riot ID as "Name#TAG".' };
    return NextResponse.json(body, { status: 400 });
  }

  await Promise.all([ensureLiveDDragonPatch(), ensureSummonerSpellsAssets()]);

  try {
    const body = mock ? await sampleGame(riotId, platform) : await lookupFlights.run(`live:${platform}:${riotId.toLowerCase()}`, () => cachedLiveGame(riotId, platform));
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return lookupError(error);
  }
}

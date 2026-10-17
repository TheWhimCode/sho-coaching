import { ACCOUNT_ROUTING_REGIONS, normalizePlatform, type Regional } from "./core";
import { riotFetchJSON } from "./fetch";
import { composeMatchId } from "./matchId";

/** Subset of Match-v5 `ParticipantDto` the build picker needs. */
export type MatchParticipant = {
  puuid: string;
  teamId: number;
  championId: number;
  championName?: string;
  summoner1Id: number;
  summoner2Id: number;
  riotIdGameName?: string;
  riotIdTagline?: string;
  riotIdName?: string;
  summonerName?: string;
  perks?: {
    statPerks?: { defense?: number; flex?: number; offense?: number };
    styles?: { selections?: { perk?: number }[] }[];
  };
};

export type MatchDto = {
  metadata: { matchId: string };
  info: {
    mapId?: number;
    gameMode?: string;
    gameCreation?: number;
    gameStartTimestamp?: number;
    queueId?: number;
    platformId: string;
    participants: MatchParticipant[];
  };
};

export class MatchNotFoundError extends Error {
  constructor() {
    super("match_not_found");
    this.name = "MatchNotFoundError";
  }
}

export type ParsedMatchId = {
  matchId: string;
  platform: string | null;
  region: Regional | null;
};

/** `EUW1_1234567890` from match history. A platform hint prefixes a bare game id. */
export function parseMatchId(raw: string, platformInput?: string): ParsedMatchId | null {
  const matchId = composeMatchId(raw, platformInput);
  if (!matchId) return null;
  const prefix = matchId.slice(0, matchId.indexOf("_"));
  const { platform, region } = normalizePlatform(prefix);
  return {
    matchId,
    platform: region ? platform : null,
    region: region ?? null,
  };
}

export function perkIdsFromMatch(participant: MatchParticipant): number[] {
  const ids: number[] = [];
  for (const style of participant.perks?.styles ?? []) {
    for (const selection of style.selections ?? []) {
      if (typeof selection.perk === "number") ids.push(selection.perk);
    }
  }
  const stats = participant.perks?.statPerks;
  if (stats?.offense) ids.push(stats.offense);
  if (stats?.flex) ids.push(stats.flex);
  if (stats?.defense) ids.push(stats.defense);
  return ids;
}

export function participantRiotId(participant: MatchParticipant): string | undefined {
  const name = participant.riotIdGameName || participant.riotIdName;
  const tag = participant.riotIdTagline;
  if (name && tag) return `${name}#${tag}`;
  return participant.summonerName || undefined;
}

/**
 * Match-v5 is regional. The platform prefix on the id usually picks the host;
 * unknown prefixes still walk the usual routers.
 */
export async function matchByIdAcrossRegions(
  matchId: string,
  preferred?: Regional | null
): Promise<MatchDto> {
  const regions: Regional[] = preferred
    ? [preferred, ...ACCOUNT_ROUTING_REGIONS.filter((region) => region !== preferred)]
    : [...ACCOUNT_ROUTING_REGIONS];

  let saw404 = false;
  for (const regional of regions) {
    try {
      return await riotFetchJSON<MatchDto>(
        `https://${regional}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`
      );
    } catch (error) {
      if (error instanceof Error && /Riot API 404/.test(error.message)) {
        saw404 = true;
        continue;
      }
      throw error;
    }
  }
  if (saw404) throw new MatchNotFoundError();
  throw new MatchNotFoundError();
}

import { riotFetchJSON } from "./fetch";

/** Subset of Spectator-v5 `CurrentGameInfo` the build picker needs. */
export type ActiveGameParticipant = {
  puuid: string;
  teamId: 100 | 200;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  perks?: {
    perkIds: number[];
    perkStyle: number;
    perkSubStyle: number;
  };
  riotId?: string;
  summonerId?: string;
};

export type ActiveGame = {
  mapId: number;
  gameMode: string;
  gameId: number;
  gameQueueConfigId: number;
  gameStartTime: number;
  platformId: string;
  participants: ActiveGameParticipant[];
};

export class NotInGameError extends Error {
  constructor() {
    super("not_in_game");
    this.name = "NotInGameError";
  }
}

/**
 * Active game for a PUUID on a platform shard. Throws `NotInGameError` on 404.
 * Riot's current "no game" body is
 * `{"httpStatus":404,"errorCode":"NOT_FOUND","implementationDetails":"filtered"}`.
 */
export async function activeGameByPuuid(platform: string, puuid: string): Promise<ActiveGame> {
  try {
    return await riotFetchJSON<ActiveGame>(
      `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`
    );
  } catch (error) {
    if (error instanceof Error && /Riot API 404/.test(error.message)) throw new NotInGameError();
    throw error;
  }
}

const QUEUE_NAMES: Record<number, string> = {
  0: "Custom",
  400: "Normal Draft",
  420: "Ranked Solo/Duo",
  430: "Normal Blind",
  440: "Ranked Flex",
  450: "ARAM",
  490: "Quickplay",
  700: "Clash",
  720: "ARAM Clash",
  1700: "Arena",
  1900: "URF",
};

export function queueName(queueId: number) {
  return QUEUE_NAMES[queueId] ?? `Queue ${queueId}`;
}

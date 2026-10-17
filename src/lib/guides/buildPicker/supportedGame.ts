// Standard PvP Summoner's Rift queues. Unknown/new queues fail closed.
// https://static.developer.riotgames.com/docs/lol/queues.json
const STANDARD_RIFT_QUEUES = new Set([400, 420, 430, 440, 490, 700]);

export const UNSUPPORTED_GAME_MESSAGE = "This picker supports standard 5v5 Summoner's Rift games: Ranked Solo/Duo, Ranked Flex, normals, and Clash. Other modes aren't supported.";

export function isSupportedPickerGame(game: {
  mapId?: number;
  gameMode?: string;
  queueId?: number;
  participants: { teamId: number }[];
}): boolean {
  return game.mapId === 11
    && game.gameMode === "CLASSIC"
    && game.queueId !== undefined
    && STANDARD_RIFT_QUEUES.has(game.queueId)
    && game.participants.length === 10
    && game.participants.filter((participant) => participant.teamId === 100).length === 5
    && game.participants.filter((participant) => participant.teamId === 200).length === 5;
}

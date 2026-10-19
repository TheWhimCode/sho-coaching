// Standard PvP Summoner's Rift queues. Unknown/new queues fail closed.
// https://static.developer.riotgames.com/docs/lol/queues.json
const STANDARD_RIFT_QUEUES = new Set([400, 420, 430, 440, 480, 490, 700]);

export const UNSUPPORTED_GAME_MESSAGE = "This one's for 5v5 Summoner's Rift: ranked, normals, Swiftplay, and Clash. It won't work for ARAM, Arena, or other modes.";

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

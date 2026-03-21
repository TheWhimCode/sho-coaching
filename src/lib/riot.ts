// src/lib/riot.ts

import { riotFetchJSON } from "@/lib/riot/fetch";

type Regional = "americas" | "europe" | "asia" | "sea";

/** Map a platform server (euw1, na1, kr, …) to its regional cluster */
export function regionalForServer(server: string): Regional {
  const s = (server || "").toLowerCase();
  if (["na1", "br1", "la1", "la2", "oc1"].includes(s)) return "americas";
  if (["euw1", "eun1", "tr1", "ru"].includes(s)) return "europe";
  if (["kr", "jp1"].includes(s)) return "asia";
  if (["ph2", "sg2", "th2", "tw2", "vn2"].includes(s)) return "sea";
  // default safely to Europe
  return "europe";
}

/** Parse "GameName#TAG" (game name can contain spaces). */
export function parseRiotTag(riotTag: string): { gameName: string; tagLine: string } {
  const tag = (riotTag || "").trim();
  const i = tag.indexOf("#");
  if (i <= 0 || i === tag.length - 1) throw new Error('riotTag must be "GameName#TAG"');
  return { gameName: tag.slice(0, i).trim(), tagLine: tag.slice(i + 1).trim() };
}

/** Riot ID -> PUUID via account-v1 (regional) — uses shared app rate limiter */
export async function accountByRiotTag(
  serverHint: string,
  riotTag: string,
): Promise<{ puuid: string; gameName?: string; tagLine?: string }> {
  const { gameName, tagLine } = parseRiotTag(riotTag);
  const regional = regionalForServer(serverHint || "euw1");
  const url = `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName,
  )}/${encodeURIComponent(tagLine)}`;
  return riotFetchJSON<{ puuid: string; gameName?: string; tagLine?: string }>(url);
}

export type SoloQRank = { tier: string; division?: string | null; lp: number };

/** SoloQ entry by PUUID — uses shared app rate limiter */
export async function soloQueueEntry(
  server: string,
  puuid: string,
): Promise<SoloQRank | null> {
  const url = `https://${server}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(
    puuid,
  )}`;
  const entries = await riotFetchJSON<Array<Record<string, unknown>>>(url);
  const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
  if (!solo) return null;
  return {
    tier: solo.tier as string,
    division: (solo.rank as string | null) ?? null,
    lp: (solo.leaguePoints as number) ?? 0,
  };
}

// ----------- Diagnostic helpers -----------

const ALL_CLUSTERS: Record<string, string[]> = {
  americas: ["na1", "br1", "la1", "la2", "oc1"],
  europe: ["euw1", "eun1", "tr1", "ru"],
  asia: ["kr", "jp1"],
  sea: ["ph2", "sg2", "th2", "tw2", "vn2"],
};

/** Probe all servers for a summoner, with full attempt logs */
export async function probeSummonerEverywhere(puuid: string) {
  const attempts: Array<{ server: string; status: number; message?: string }> = [];

  for (const cluster of Object.values(ALL_CLUSTERS)) {
    for (const server of cluster) {
      const url = `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(
        puuid,
      )}`;
      try {
        const j = await riotFetchJSON<{ name: string }>(url);
        return { found: { server, name: j.name as string }, attempts };
      } catch (e: any) {
        attempts.push({
          server,
          status: 0,
          message: String(e?.message ?? e),
        });
      }
    }
  }

  return { found: null, attempts };
}

/** Get summoner profile by PUUID — uses shared app rate limiter */
export async function summonerByPuuid(
  server: string,
  puuid: string,
): Promise<{ name: string }> {
  const url = `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
  const j = await riotFetchJSON<{ name: string }>(url);
  return { name: j.name as string };
}

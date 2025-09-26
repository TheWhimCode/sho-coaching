import { riotFetchJSON } from "@/lib/riot/fetch";

export type Regional = "americas" | "europe" | "asia" | "sea";

const ALIAS_TO_PLATFORM: Record<string, string> = {
  euw: "euw1", eu: "euw1", euw1: "euw1",
  eune: "eun1", eun: "eun1", eun1: "eun1",
  na: "na1", na1: "na1", oce: "oc1", oc1: "oc1",
  lan: "la1", la1: "la1", las: "la2", la2: "la2",
  br: "br1", br1: "br1", tr: "tr1", tr1: "tr1",
  ru: "ru", kr: "kr", jp: "jp1", jp1: "jp1",
  ph: "ph2", ph2: "ph2", sg: "sg2", sg2: "sg2",
  th: "th2", th2: "th2", tw: "tw2", tw2: "tw2",
  vn: "vn2", vn2: "vn2",
};

const PLATFORM_TO_REGION: Record<string, Regional> = {
  na1: "americas", br1: "americas", la1: "americas", la2: "americas", oc1: "americas",
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe",
  kr: "asia", jp1: "asia",
  ph2: "sea", sg2: "sea", th2: "sea", tw2: "sea", vn2: "sea",
};

export function normalizePlatform(input: string) {
  const key = (input || "").trim().toLowerCase();
  const platform = ALIAS_TO_PLATFORM[key] || key || "";
  const region = PLATFORM_TO_REGION[platform];
  return { platform, region };
}

export function regionalForServer(server: string): Regional {
  const { region } = normalizePlatform(server);
  if (!region) throw new Error(`Unknown/unsupported server "${server}"`);
  return region;
}

export function parseRiotTag(tag: string) {
  const i = tag.lastIndexOf("#");
  if (i <= 0 || i === tag.length - 1) throw new Error('riotTag must be "Game#TAG"');
  return { gameName: tag.slice(0, i), tagLine: tag.slice(i + 1) };
}

/* ---- High-level calls (PUUID-first) ---- */
export async function resolveAccount(regional: Regional, riotTag: string) {
  const { gameName, tagLine } = parseRiotTag(riotTag);
  return riotFetchJSON<{ puuid: string; gameName: string; tagLine: string }>(
    `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
}

export async function recentSoloMatchIds(regional: Regional, puuid: string, count: number) {
  const u = new URL(`https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`);
  u.searchParams.set("queue", "420");
  u.searchParams.set("start", "0");
  u.searchParams.set("count", String(Math.max(1, Math.min(20, count))));
  return riotFetchJSON<string[]>(u.toString());
}

export async function matchById(regional: Regional, id: string) {
  return riotFetchJSON<any>(`https://${regional}.api.riotgames.com/lol/match/v5/matches/${id}`);
}

export async function leagueEntriesByPuuid(platform: string, puuid: string) {
  return riotFetchJSON<any[]>(
    `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`
  );
}

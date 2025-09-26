// src/lib/riot.ts

// Grab API key from env
const RIOT_KEY = process.env.RIOT_API_KEY ?? "";

// Helper for headers, throws lazily so it doesn’t break build
function riotHeaders(): Record<string, string> {
  if (!RIOT_KEY) throw new Error("Missing RIOT_API_KEY");
  return { "X-Riot-Token": RIOT_KEY };
}

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

export function parseRiotTag(riotTag: string): { gameName: string; tagLine: string } {
  const [gameName, tagLine] = (riotTag || "").split("#");
  if (!gameName || !tagLine) throw new Error('riotTag must be "Name#TAG"');
  return { gameName, tagLine };
}

async function expectOk(res: Response, label: string) {
  if (res.ok) return;
  const text = await res.text().catch(() => "");
  console.error(`${label} error →`, res.status, res.statusText, text);
  throw new Error(`${label}: ${res.status} ${res.statusText} ${text}`.trim());
}

/** Riot ID -> PUUID via account-v1 (regional) */
export async function accountByRiotTag(
  serverHint: string,
  riotTag: string,
): Promise<{ puuid: string; gameName?: string; tagLine?: string }> {
  const { gameName, tagLine } = parseRiotTag(riotTag);
  const regional = regionalForServer(serverHint || "euw1");
  const url = `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName,
  )}/${encodeURIComponent(tagLine)}`;
  const res = await fetch(url, { headers: riotHeaders(), cache: "no-store" });
  await expectOk(res, "accountByRiotTag");
  return (await res.json()) as any;
}

export type SoloQRank = { tier: string; division?: string | null; lp: number };

/** SoloQ entry by PUUID */
export async function soloQueueEntry(
  server: string,
  puuid: string,
): Promise<SoloQRank | null> {
  const url = `https://${server}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(
    puuid,
  )}`;
  const res = await fetch(url, { headers: riotHeaders(), cache: "no-store" });
  await expectOk(res, "leagueEntriesByPuuid");
  const entries = (await res.json()) as Array<any>;
  const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
  if (!solo) return null;
  return { tier: solo.tier, division: solo.rank ?? null, lp: solo.leaguePoints ?? 0 };
}

// ----------- Diagnostic helpers -----------

const ALL_CLUSTERS: Record<string, string[]> = {
  americas: ["na1", "br1", "la1", "la2", "oc1"],
  europe: ["euw1", "eun1", "tr1", "ru"],
  asia: ["kr", "jp1"],
  sea: ["ph2", "sg2", "th2", "tw2", "vn2"],
};

async function jsonOrText(res: Response) {
  try {
    return await res.json();
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}

/** Probe all servers for a summoner, with full attempt logs */
export async function probeSummonerEverywhere(puuid: string) {
  const attempts: Array<{ server: string; status: number; message?: string }> = [];

  for (const cluster of Object.values(ALL_CLUSTERS)) {
    for (const server of cluster) {
      const url = `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(
        puuid,
      )}`;
      const res = await fetch(url, { headers: riotHeaders(), cache: "no-store" });

      if (res.ok) {
        const j = await res.json();
        return { found: { server, name: j.name as string }, attempts };
      }

      const body = (await jsonOrText(res)) as any;
      attempts.push({ server, status: res.status, message: body?.status?.message ?? undefined });
    }
  }

  return { found: null, attempts };
}

/** Get summoner profile by PUUID */
export async function summonerByPuuid(
  server: string,
  puuid: string,
): Promise<{ name: string }> {
  const url = `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
  const res = await fetch(url, { headers: riotHeaders(), cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`summonerByPuuid ${server} failed: ${res.status} ${res.statusText} ${text}`);
  }
  const j = await res.json();
  return { name: j.name as string };
}

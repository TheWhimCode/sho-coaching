/**
 * Sample master+ games via Riot API to find the most popular keystone for a champion.
 * Designed for low rate-limit keys: throttled requests and detailed logging.
 */

import {
  regionalForServer,
  masterLeagueByQueue,
  grandmasterLeagueByQueue,
  challengerLeagueByQueue,
  summonerBySummonerId,
  recentSoloMatchIds,
  matchById,
  type Regional,
} from "@/lib/riot/core";

const QUEUE = "RANKED_SOLO_5x5";
const MIN_GAME_DURATION_SEC = 180; // exclude remakes
const DEFAULT_PLATFORM = "euw1";
/** Delay between Riot API calls to avoid rate limits (ms). */
const RIOT_DELAY_MS = 1800;
/** Max summoners to resolve to PUUID (each = 1 call). */
const MAX_SUMMONERS = 10;
/** Match IDs to request per summoner (each = 1 call). */
const MATCH_IDS_PER_PUUID = 5;
/** Max match detail fetches (shared across all matches). */
const MAX_MATCH_DETAILS = 40;
/** Phase 2: if we find players who played the champ, fetch more of their matches (champion-heavy). */
const MAX_CHAMPION_PLAYER_PUUIDS = 5;
const PHASE2_MATCH_IDS_PER_PUUID = 10;
const MAX_PHASE2_MATCH_DETAILS = 30;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type KeystoneSampleResult = {
  keystoneId: number;
  sampleSize: number;
  log: string[];
};

export type KeystoneSampleError = {
  error: string;
  log: string[];
};

/**
 * Fetch champion key -> Riot numeric id from Data Dragon.
 * Match participant uses championId (number); we need to match our champion key.
 */
export async function getChampionKeyToRiotId(
  patch: string,
  locale: string = "en_US"
): Promise<Record<number, string>> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/champion.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`champion.json fetch failed: ${res.status}`);
  const json = await res.json();
  const data = json?.data;
  if (!data || typeof data !== "object") throw new Error("champion.json invalid");
  const out: Record<number, string> = {};
  for (const [key, champ] of Object.entries(data) as [string, any][]) {
    const num = champ?.key != null ? Number(champ.key) : NaN;
    if (Number.isFinite(num)) out[num] = key;
  }
  return out;
}

/**
 * Extract keystone perk id from match participant perks.
 * Keystone = first selection of primary style.
 */
function getKeystoneFromPerks(perks: unknown): number | null {
  if (!perks || typeof perks !== "object") return null;
  const styles = (perks as { styles?: { description?: string; selections?: { perk: number }[] }[] })
    ?.styles;
  if (!Array.isArray(styles)) return null;
  const primary =
    styles.find((s) => s?.description === "primaryStyle") ?? styles[0];
  const sel = primary?.selections?.[0];
  return sel?.perk ?? null;
}

/**
 * Sample master+ games and return the most common keystone for the given champion.
 * Uses throttling and returns a log array for debugging.
 */
export async function sampleKeystoneForChampion(
  championKey: string,
  options?: {
    platform?: string;
    delayMs?: number;
    maxSummoners?: number;
    matchIdsPerPuuid?: number;
    maxMatchDetails?: number;
  }
): Promise<KeystoneSampleResult | KeystoneSampleError> {
  const platform = options?.platform ?? DEFAULT_PLATFORM;
  const delayMs = options?.delayMs ?? RIOT_DELAY_MS;
  const maxSummoners = options?.maxSummoners ?? MAX_SUMMONERS;
  const matchIdsPerPuuid = options?.matchIdsPerPuuid ?? MATCH_IDS_PER_PUUID;
  const maxMatchDetails = options?.maxMatchDetails ?? MAX_MATCH_DETAILS;

  const log: string[] = [];
  const ts = () => new Date().toISOString();

  try {
    const region = regionalForServer(platform);
    log.push(`[${ts()}] platform=${platform} region=${region} champion=${championKey}`);

    // Resolve champion key -> Riot numeric id (from DDragon, no Riot key)
    const patch =
      process.env.NEXT_PUBLIC_DDRAGON_PATCH ?? "15.19.1";
    const keyToRiotId = await getChampionKeyToRiotId(patch);
    const championRiotId = Object.entries(keyToRiotId).find(
      ([_, key]) => key === championKey
    )?.[0];
    if (championRiotId == null) {
      log.push(`[${ts()}] ERROR: champion not found in DDragon: ${championKey}`);
      return { error: `Champion not in DDragon: ${championKey}`, log };
    }
    const champIdNum = Number(championRiotId);
    log.push(`[${ts()}] champion Riot id=${champIdNum}`);

    // 1) Get master+ entries (master -> grandmaster -> challenger)
    // League v4 returns { entries: LeagueItemDTO[] }; each entry has summonerId
    log.push(`[${ts()}] fetching master league list`);
    const masterRaw = await masterLeagueByQueue(platform, QUEUE);
    await sleep(delayMs);
    let entries: any[] = Array.isArray(masterRaw?.entries) ? masterRaw.entries : [];

    if (!entries.length) {
      log.push(`[${ts()}] WARN: no MASTER entries, trying GRANDMASTER`);
      const gm = await grandmasterLeagueByQueue(platform, QUEUE);
      await sleep(delayMs);
      entries = Array.isArray(gm?.entries) ? gm.entries : [];
    }

    if (!entries.length) {
      log.push(`[${ts()}] WARN: no GRANDMASTER entries, trying CHALLENGER`);
      const ch = await challengerLeagueByQueue(platform, QUEUE);
      await sleep(delayMs);
      entries = Array.isArray(ch?.entries) ? ch.entries : [];
    }

    if (!entries.length) {
      log.push(`[${ts()}] ERROR: no master+ entries`);
      return { error: "No master+ entries from Riot", log };
    }

    // Entries may have puuid (newer API) or summonerId (resolve to puuid)
    function puuidFromEntry(e: any): string | null {
      if (e == null) return null;
      const id = e.puuid ?? e.summonerId ?? e.summoner_id ?? (typeof e === "string" ? e : null);
      return typeof id === "string" && id.length > 0 ? id : null;
    }

    let puuids = entries
      .map(puuidFromEntry)
      .filter((id): id is string => Boolean(id))
      .slice(0, maxSummoners * 3);

    // If entries only have summonerId, resolve to PUUID
    if (puuids.length === 0) {
      const summonerIds = entries
        .map((e: any) => e?.summonerId ?? e?.summoner_id)
        .filter(Boolean)
        .slice(0, maxSummoners);
      log.push(`[${ts()}] resolving ${summonerIds.length} summoners to PUUID`);
      for (const sid of summonerIds) {
        try {
          const sum = await summonerBySummonerId(platform, sid);
          if (sum?.puuid) puuids.push(sum.puuid);
          await sleep(delayMs);
        } catch (e: any) {
          log.push(`[${ts()}] WARN summoner ${sid}: ${e?.message ?? e}`);
        }
      }
    }

    // Shuffle lightly so we don't always hit same players
    for (let i = puuids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [puuids[i], puuids[j]] = [puuids[j], puuids[i]];
    }
    puuids = puuids.slice(0, maxSummoners);

    if (puuids.length === 0) {
      log.push(`[${ts()}] ERROR: no PUUIDs available`);
      return { error: "Failed to get any PUUIDs from master+ entries", log };
    }
    log.push(`[${ts()}] got ${puuids.length} PUUIDs`);

    // 3) Match IDs per PUUID (N calls)
    const allMatchIds = new Set<string>();
    for (const puuid of puuids) {
      try {
        const ids = await recentSoloMatchIds(
          region,
          puuid,
          matchIdsPerPuuid
        );
        ids?.forEach((id) => allMatchIds.add(id));
        await sleep(delayMs);
      } catch (e: any) {
        log.push(`[${ts()}] WARN match ids ${puuid.slice(0, 8)}...: ${e?.message ?? e}`);
      }
    }

    const matchIdList = Array.from(allMatchIds).slice(0, maxMatchDetails);
    log.push(`[${ts()}] phase 1: fetching ${matchIdList.length} match details`);

    // 4) Phase 1: match details + collect PUUIDs of players who played this champion
    const keystoneCounts = new Map<number, number>();
    const championPlayerPuuids = new Set<string>();

    function processMatch(match: any): void {
      const info = match?.info;
      const participants = info?.participants ?? [];
      const duration = Number(info?.gameDuration ?? 0);
      if (duration < MIN_GAME_DURATION_SEC) return;
      for (const p of participants) {
        if (Number(p?.championId) !== champIdNum) continue;
        const kid = getKeystoneFromPerks(p?.perks);
        if (kid != null) {
          keystoneCounts.set(kid, (keystoneCounts.get(kid) ?? 0) + 1);
        }
        if (p?.puuid) championPlayerPuuids.add(p.puuid);
      }
    }

    for (const matchId of matchIdList) {
      try {
        const match = await matchById(region, matchId);
        await sleep(delayMs);
        processMatch(match);
      } catch (e: any) {
        log.push(`[${ts()}] WARN match ${matchId}: ${e?.message ?? e}`);
      }
    }

    // 5) Phase 2: fetch more matches from players who played this champion (more champ-specific games per call)
    const phase2Puuids = Array.from(championPlayerPuuids).slice(0, MAX_CHAMPION_PLAYER_PUUIDS);
    if (phase2Puuids.length > 0) {
      log.push(`[${ts()}] phase 2: ${phase2Puuids.length} champion-player PUUIDs, fetching more of their matches`);
      const phase2MatchIds = new Set<string>();
      for (const puuid of phase2Puuids) {
        try {
          const ids = await recentSoloMatchIds(region, puuid, PHASE2_MATCH_IDS_PER_PUUID);
          ids?.forEach((id) => phase2MatchIds.add(id));
          await sleep(delayMs);
        } catch (e: any) {
          log.push(`[${ts()}] WARN phase2 match ids: ${e?.message ?? e}`);
        }
      }
      const phase2List = Array.from(phase2MatchIds).filter((id) => !allMatchIds.has(id)).slice(0, MAX_PHASE2_MATCH_DETAILS);
      log.push(`[${ts()}] phase 2: fetching ${phase2List.length} extra match details`);
      for (const matchId of phase2List) {
        try {
          const match = await matchById(region, matchId);
          await sleep(delayMs);
          processMatch(match);
        } catch (e: any) {
          log.push(`[${ts()}] WARN match ${matchId}: ${e?.message ?? e}`);
        }
      }
    }

    const sampleSize = Array.from(keystoneCounts.values()).reduce(
      (a, b) => a + b,
      0
    );
    if (sampleSize === 0) {
      log.push(`[${ts()}] ERROR: no games found for champion in sampled matches`);
      return {
        error: `No ${championKey} games in sampled master+ matches`,
        log,
      };
    }

    let bestId = 0;
    let bestCount = 0;
    for (const [id, count] of keystoneCounts) {
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
      }
    }
    log.push(`[${ts()}] done keystoneId=${bestId} sampleSize=${sampleSize}`);
    return { keystoneId: bestId, sampleSize, log };
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    log.push(`[${ts()}] ERROR: ${msg}`);
    return { error: msg, log };
  }
}

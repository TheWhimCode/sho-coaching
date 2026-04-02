import "server-only";

import {
  findPlatformForPuuid,
  leagueEntriesByPuuid,
  normalizePlatform,
  resolveAccountByRiotTag,
  type Regional,
} from "@/lib/riot/core";

export type SessionPaidRank = {
  /** Ranked tier, e.g. GOLD, MASTER (Riot `tier`). */
  league: string | null;
  /** Division I–IV when applicable (Riot `rank`). */
  division: string | null;
  /** LoL platform host, e.g. euw1 */
  platform: string | null;
};

function entriesToRank(platform: string, entries: unknown): SessionPaidRank {
  const solo = Array.isArray(entries)
    ? entries.find((e: { queueType?: string }) => e.queueType === "RANKED_SOLO_5x5")
    : undefined;
  if (!solo) return { league: null, division: null, platform };
  return {
    league: String((solo as { tier?: string }).tier ?? ""),
    division:
      (solo as { rank?: string | null }).rank != null
        ? String((solo as { rank?: string | null }).rank)
        : null,
    platform,
  };
}

/**
 * Resolves riot#tag → regional PUUID, finds LoL shard, returns Solo/Duo rank (or null fields if unranked).
 */
export async function fetchSoloRankForRiotTag(riotTag: string): Promise<SessionPaidRank> {
  const tag = riotTag.trim();
  if (!tag) return { league: null, division: null, platform: null };

  let puuid: string;
  let regional: Regional;
  try {
    const acct = await resolveAccountByRiotTag(tag);
    puuid = acct.puuid;
    regional = acct.regional;
  } catch {
    return { league: null, division: null, platform: null };
  }

  const platform = await findPlatformForPuuid(puuid, regional);
  if (!platform) return { league: null, division: null, platform: null };

  try {
    const entries = await leagueEntriesByPuuid(platform, puuid);
    return entriesToRank(platform, entries);
  } catch {
    return { league: null, division: null, platform };
  }
}

type StudentRankHint = { puuid: string | null; server: string | null };

/**
 * Prefer DB puuid + server (same path as /api/riot/rank); otherwise riot#tag → Riot APIs.
 */
export async function resolveRankForPaidSession(
  riotTag: string,
  student: StudentRankHint | null | undefined,
): Promise<SessionPaidRank> {
  const st = student;
  if (st?.puuid && st?.server) {
    try {
      const { platform } = normalizePlatform(st.server);
      const entries = await leagueEntriesByPuuid(platform, st.puuid);
      return entriesToRank(platform, entries);
    } catch {
      /* fall through to riot-tag resolution */
    }
  }
  return fetchSoloRankForRiotTag(riotTag);
}

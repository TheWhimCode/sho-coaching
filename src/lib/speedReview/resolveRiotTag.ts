import type { Regional } from "@/lib/riot/core";
import { resolveAccount } from "@/lib/riot/core";

const REGIONS: readonly Regional[] = ["europe", "americas", "asia"] as const;

/** Resolve Riot ID to PUUID; same region-try pattern as /api/riot/resolve */
export async function resolveRiotTagToPuuid(riotTag: string): Promise<string | null> {
  const tag = riotTag.trim();
  if (!tag) return null;
  for (const regional of REGIONS) {
    try {
      const acct = await resolveAccount(regional, tag);
      return acct.puuid;
    } catch {
      continue;
    }
  }
  return null;
}

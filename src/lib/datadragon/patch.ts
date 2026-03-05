/** Only used when env is set or when the versions API fails. */
export const FALLBACK_PATCH =
  process.env.NEXT_PUBLIC_DDRAGON_PATCH ?? "16.5.1";

export let currentPatch = FALLBACK_PATCH;
export let patchReady = false;

const VERSIONS_URL =
  "https://ddragon.leagueoflegends.com/api/versions.json";

let patchInit: Promise<void> | null = null;

/**
 * Fetches the latest Data Dragon patch from the versions API and sets
 * currentPatch. When Riot updates DDragon, the next call gets the new patch.
 * Falls back to FALLBACK_PATCH only if the request fails.
 */
export function ensureLiveDDragonPatch() {
  if (patchInit) return patchInit;

  patchInit = fetch(VERSIONS_URL, { cache: "no-store" })
    .then((r) => r.json())
    .then((versions: string[]) => {
      if (Array.isArray(versions) && versions.length > 0) {
        currentPatch = versions[0];
      }
      patchReady = true;
    })
    .catch(() => {
      patchReady = true;
    });

  return patchInit;
}

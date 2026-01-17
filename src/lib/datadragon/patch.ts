import type { DDragonRealm } from "./types";

export const FALLBACK_PATCH =
  process.env.NEXT_PUBLIC_DDRAGON_PATCH ?? "15.19.1";

export let currentPatch = FALLBACK_PATCH;
export let patchReady = false;

let patchInit: Promise<void> | null = null;

export function ensureLiveDDragonPatch(realm: string = "euw") {
  if (patchInit) return patchInit;

  patchInit = fetch(
    `https://ddragon.leagueoflegends.com/realms/${realm}.json`
  )
    .then((r) => r.json())
    .then((j: DDragonRealm) => {
      if (j?.n?.champion) {
        currentPatch = j.n.champion;
      }
      patchReady = true;
    })
    .catch(() => {
      // fallback patch is already set
      patchReady = true;
    });

  return patchInit;
}

import { currentPatch, ensureLiveDDragonPatch, DDRAGON_FETCH_REVALIDATE_SECONDS } from "./patch";

let spellsInit: Promise<void> | null = null;
const spellIdToKey: Record<number, string> = {};

export function summonerSpellIconUrl(
  spellKey: string,
  patch = currentPatch
) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${spellKey}.png`;
}

export function areSummonerSpellsReady() {
  return Object.keys(spellIdToKey).length > 0;
}

export function ensureSummonerSpellsAssets(locale: string = "en_US") {
  if (spellsInit) return spellsInit;

  spellsInit = ensureLiveDDragonPatch().then(() =>
    fetch(
      `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/${locale}/summoner.json`,
      { next: { revalidate: DDRAGON_FETCH_REVALIDATE_SECONDS } }
    )
  )
    .then(r => r.json())
    .then(j => {
      const data = j?.data ?? {};
      for (const k of Object.keys(data)) {
        const s = data[k];
        const id = Number(s?.key);
        const key = String(s?.id || "");
        if (!Number.isNaN(id) && key) spellIdToKey[id] = key;
      }
    })
    .catch(() => {});

  return spellsInit;
}

export function summonerSpellIconById(id: number | string, patch = currentPatch) {
  const key = spellIdToKey[Number(id)];
  return key ? summonerSpellIconUrl(key, patch) : null;
}

export function summonerSpellKeyById(id: number | string) {
  return spellIdToKey[Number(id)] ?? null;
}

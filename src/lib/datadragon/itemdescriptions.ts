import { currentPatch } from "./patch";

/* ---------------------------- Types ---------------------------- */

type DDragonItemEntry = {
  name: string;
  description: string; // HTML-ish
  plaintext?: string;
  gold?: { total?: number; base?: number };
  from?: string[];
};

type DDragonItemResponse = {
  data: Record<string, DDragonItemEntry>;
};

/* ------------------------- State ------------------------- */

let ddragItemsInit: Promise<void> | null = null;
let ddragItems: Record<string, DDragonItemEntry> = {};

/* ------------------------- Patch utils ------------------------- */
// DDragon uses full patch (e.g. 14.16.1). If yours is already that, no-op.
function normalizeDDragonPatch(patch: string) {
  return patch;
}

/* --------------------- Load item.json once --------------------- */

export function ensureDDragonItems(locale: string = "en_US") {
  if (ddragItemsInit) return ddragItemsInit;

  const patch = normalizeDDragonPatch(currentPatch);

  const urlFor = (p: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${p}/data/${locale}/item.json`;

  ddragItemsInit = (async () => {
    const urls = [urlFor(patch), urlFor("latest")];
    let lastError: unknown = null;

    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`Fetch failed ${r.status}`);

        const json = (await r.json()) as DDragonItemResponse;
        const map = json?.data ?? {};

        if (!map || Object.keys(map).length === 0) {
          throw new Error("Empty ddragon item payload");
        }

        ddragItems = map;
        return;
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError ?? new Error("Failed to load Data Dragon items");
  })();

  return ddragItemsInit;
}

/* ----------------------- Accessors ------------------------- */

export function getDDragonItem(id: string) {
  return ddragItems[id] ?? null;
}

export function getItemDescriptionHtml(id: string) {
  return getDDragonItem(id)?.description ?? "";
}

export function getItemPlaintext(id: string) {
  return getDDragonItem(id)?.plaintext ?? "";
}

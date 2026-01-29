import { currentPatch } from "./patch";

/* ---------------------------- Types ---------------------------- */

export type CDragonItem = {
  id: number;
  name: string;
  description: string;
  from?: number[];
  to?: number[];
  categories?: string[];
  iconPath?: string;

  inStore?: boolean;
  displayInItemSets?: boolean;

  requiredChampion?: string;
  requiredAlly?: string;
  requiredBuffCurrencyName?: string;

  specialRecipe?: number;
  price?: number;
  priceTotal?: number;
};


/* ------------------------- Patch utils ------------------------- */

function normalizeCDragonPatch(patch: string) {
  const p = patch.split(".");
  return p.length >= 2 ? `${p[0]}.${p[1]}` : patch;
}

/* ------------------------- State ------------------------- */

let itemsInit: Promise<void> | null = null;
let items: Record<string, CDragonItem> = {};

/* --------------------- Load items.json once --------------------- */

export function ensureItemsData(locale: string = "en_US") {
  if (itemsInit) return itemsInit;

  const patch = normalizeCDragonPatch(currentPatch);

  const urlFor = (p: string) =>
    `https://raw.communitydragon.org/${p}/plugins/rcp-be-lol-game-data/global/default/v1/items.json`;

  itemsInit = (async () => {
    const urls = [urlFor(patch), urlFor("latest")];
    let lastError: unknown = null;

    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`Fetch failed ${r.status}`);

        const arr = (await r.json()) as CDragonItem[];
        const map: Record<string, CDragonItem> = {};

        for (const it of arr ?? []) {
          map[String(it.id)] = it;
        }

        if (Object.keys(map).length === 0) {
          throw new Error("Empty items payload");
        }

        items = map;
        return;
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError ?? new Error("Failed to load CommunityDragon items");
  })();

  return itemsInit;
}

/* ----------------------- Accessors ------------------------- */

export function getAllItems() {
  return items;
}

export function getItem(id: string) {
  return items[id] ?? null;
}

export function getItemName(id: string) {
  return getItem(id)?.name ?? "";
}

export function getItemTotalCost(id: string) {
  return getItem(id)?.priceTotal ?? 0;
}

export function getItemBaseCost(id: string) {
  return getItem(id)?.price ?? 0;
}

/* ----------------------- Icons ------------------------- */

function iconFileName(iconPath?: string) {
  return (iconPath ?? "").split("/").pop()?.toLowerCase() ?? "";
}

/**
 * PURE helper — does NOT depend on module state.
 * This is the one your page should use.
 */
export function itemIconUrlFromPath(iconPath?: string, patch: string = "latest") {
  const file = (iconPath ?? "").split("/").pop()?.toLowerCase() ?? "";
  if (!file) return "";

  // ✅ encode the filename to avoid issues with special characters
  const safeFile = encodeURIComponent(file);

  return `https://raw.communitydragon.org/${patch}/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/${safeFile}`;
}

/**
 * Legacy helper (state-based). Still exported in case something else uses it.
 */
export function itemIconUrl(id: string, patch: string = "latest") {
  return itemIconUrlFromPath(getItem(id)?.iconPath, patch);
}

/* ----------------------- Components ------------------------- */

export function getItemComponents(id: string) {
  return (getItem(id)?.from ?? []).map(String);
}

/* ----------------------- Tier heuristic ------------------------- */

export function getItemTier(
  id: string
): "legendary" | "epic" | "basic" | "unknown" {
  const cats = getItem(id)?.categories ?? [];
  if (cats.includes("Legendary")) return "legendary";
  if (cats.includes("Epic")) return "epic";
  if (
    cats.includes("Boots") ||
    cats.includes("Lane") ||
    cats.includes("Jungle")
  )
    return "basic";
  return "unknown";
}

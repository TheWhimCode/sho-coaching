import { currentPatch } from "./patch";

/* ---------------------------- Types ---------------------------- */

export type DDragonItem = {
  name: string;
  description: string;
  gold: { base: number; total: number };
  from?: string[];
  into?: string[];
  tags?: string[];
  icon?: string;
};

let itemsInit: Promise<void> | null = null;
let items: Record<string, DDragonItem> = {};

/* --------------------- Load item.json once --------------------- */

export function ensureItemsData(locale: string = "en_US") {
  if (itemsInit) return itemsInit;

  itemsInit = fetch(
    `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/${locale}/item.json`
  )
    .then(r => r.json())
    .then(j => {
      items = j.data ?? {};
    })
    .catch(() => {});

  return itemsInit;
}

/* ----------------------- Basic helpers ------------------------- */

export function getItem(id: string) {
  return items[id] ?? null;
}

export function getItemName(id: string) {
  return getItem(id)?.name ?? "";
}

export function getItemTotalCost(id: string) {
  return getItem(id)?.gold.total ?? 0;
}

export function getItemBaseCost(id: string) {
  return getItem(id)?.gold.base ?? 0;
}

export function itemIconUrl(id: string, patch = currentPatch) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${id}.png`;
}

export function getItemComponents(id: string) {
  return getItem(id)?.from ?? [];
}

export function getItemTier(id: string): "legendary" | "epic" | "basic" | "unknown" {
  const tags = getItem(id)?.tags ?? [];
  if (tags.includes("Legendary")) return "legendary";
  if (tags.includes("Epic")) return "epic";
  if (tags.includes("Basic")) return "basic";
  return "unknown";
}

/* -------------------- Full recursive item tree -------------------- */

/**
 * Returns a **full breakdown** of an item:
 * - its name, cost, id
 * - its direct components
 * - and recursively, their components
 */
export type ItemTreeNode = {
  id: string;
  name: string;
  cost: number;
  tier: string;
  icon: string;
  components: ItemTreeNode[];
};

export function getItemTree(id: string, seen = new Set<string>()): ItemTreeNode {
  if (seen.has(id)) {
    return {
      id,
      name: getItemName(id),
      cost: getItemTotalCost(id),
      tier: getItemTier(id),
      icon: itemIconUrl(id),
      components: []
    };
  }
  seen.add(id);

  const item = getItem(id);

  const components = (item?.from ?? []).map(cid =>
    getItemTree(cid, seen)
  );

  return {
    id,
    name: item?.name ?? "",
    cost: item?.gold.total ?? 0,
    tier: getItemTier(id),
    icon: itemIconUrl(id),
    components
  };
}

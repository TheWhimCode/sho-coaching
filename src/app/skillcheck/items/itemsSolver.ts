// lib/skillcheck/itemsSolver.ts
import type { CDragonItem } from "@/lib/datadragon";

/* ---------------------------------
   SIDE ITEM PLACEHOLDER LIST
---------------------------------- */

export const SIDE_ITEM_IDS: string[] = [
  "1001",
  "3006",
  "3047",
  "3111",
  "2031",
  "2033",
  "2055",
  "1082",
];

/* ---------------------------------
   eligibility
---------------------------------- */

export function isEligibleTarget(it: CDragonItem) {
  if (!it) return false;

  // must have a recipe (filters basics/consumables)
  if (!it.from || it.from.length === 0) return false;

  // must be a real shop item (filters dev/deprecated/mode junk)
  if (it.inStore !== true) return false;
  if ((it as any).displayInItemSets !== true) return false;

  // exclude gated items
  if ((it as any).requiredChampion) return false;
  if (it.requiredAlly) return false;
  if (it.requiredBuffCurrencyName) return false;

  // cost gate
  if ((it.priceTotal ?? 0) < 2000) return false;

  return true;
}

/* ---------------------------------
   component multiset (TREE CUT)
   - never returns a node + its descendant
   - allows intermediate components
   - ✅ deterministic if rng is provided
---------------------------------- */

function canExpand(it?: CDragonItem) {
  return !!it?.from?.length;
}

export function componentCounts(
  data: Record<string, CDragonItem>,
  itemId: string,
  out: Map<string, number> = new Map(),
  opts?: {
    targetNodes?: number;
    expandChanceByDepth?: (depth: number) => number;
    rng?: () => number; // ✅ seeded RNG
  }
): Map<string, number> {
  const targetNodes = opts?.targetNodes ?? 6;
  const expandChanceByDepth =
    opts?.expandChanceByDepth ??
    ((d) => (d === 0 ? 1 : d === 1 ? 0.6 : d === 2 ? 0.35 : 0.15));

  const rng = opts?.rng ?? Math.random; // fallback keeps old behavior

  // ---- Step 1: force root expansion exactly 1 level ----
  const root = data[itemId];
  const rootFrom = root?.from ?? [];

  if (!rootFrom.length) {
    out.set(itemId, (out.get(itemId) ?? 0) + 1);
    return out;
  }

  // Start pool as direct components (depth = 1)
  const pool: { id: string; depth: number; frozen?: boolean }[] = rootFrom.map(
    (c, idx) => ({
      id: String(c),
      depth: 1,
      // freeze FIRST component so it never expands
      frozen: idx === 0,
    })
  );

  function canExpandNode(n: { id: string; frozen?: boolean }) {
    if (n.frozen) return false;
    const it = data[n.id];
    return canExpand(it);
  }

  // ---- Step 2: expand other components deterministically ----
  while (pool.length < targetNodes) {
    const expandableIdxs = pool
      .map((n, i) => (canExpandNode(n) ? i : -1))
      .filter((i) => i !== -1) as number[];

    if (expandableIdxs.length === 0) break;

    const idx =
      expandableIdxs[Math.floor(rng() * expandableIdxs.length)];
    const node = pool[idx];
    const it = data[node.id];
    if (!it?.from?.length) break;

    const p = expandChanceByDepth(node.depth);
    if (rng() > p) break;

    // expand: remove parent, add direct recipe components
    pool.splice(idx, 1);
    for (const c of it.from) {
      const cid = String(c);
      if (cid === node.id) continue; // safety vs self-cycle
      pool.push({ id: cid, depth: node.depth + 1 });
    }
  }

  // Convert pool -> multiset
  for (const n of pool) {
    out.set(n.id, (out.get(n.id) ?? 0) + 1);
  }

  return out;
}

/* ---------------------------------
   crafting solver
---------------------------------- */

type OutcomeMap = Map<number, number>;

function minInto(map: OutcomeMap, mask: number, cost: number) {
  const prev = map.get(mask);
  if (prev === undefined || cost < prev) map.set(mask, cost);
}

function craftOutcomes(
  data: Record<string, CDragonItem>,
  itemId: string,
  slots: string[],
  mask: number,
  memo: Map<string, OutcomeMap>
): OutcomeMap {
  const key = `${itemId}|${mask}`;
  const cached = memo.get(key);
  if (cached) return cached;

  const it = data[itemId];
  const res: OutcomeMap = new Map();

  // Option A: consume exact item from inventory
  for (let i = 0; i < slots.length; i++) {
    const bit = 1 << i;
    if ((mask & bit) && slots[i] === itemId) {
      minInto(res, mask ^ bit, 0);
    }
  }

  if (!it) {
    minInto(res, mask, 1e9);
    memo.set(key, res);
    return res;
  }

  const from = it.from ?? [];
  if (!from.length) {
    // buy outright (base items)
    minInto(res, mask, it.priceTotal ?? it.price ?? 1e9);
    memo.set(key, res);
    return res;
  }

  // craft via components
  let cur: OutcomeMap = new Map([[mask, 0]]);

  for (const comp of from) {
    const next: OutcomeMap = new Map();
    for (const [m, cost] of cur) {
      const out = craftOutcomes(data, String(comp), slots, m, memo);
      for (const [m2, c2] of out) {
        minInto(next, m2, cost + c2);
      }
    }
    cur = next;
  }

  // add combine cost
  for (const [m, c] of cur) {
    minInto(res, m, c + (it.price ?? 0));
  }

  memo.set(key, res);
  return res;
}

export function minGoldToComplete(
  data: Record<string, CDragonItem>,
  targets: string[],
  inventory: string[]
): number {
  const fullMask = (1 << inventory.length) - 1;
  let dp = new Map<number, number>([[fullMask, 0]]);
  const memo = new Map<string, OutcomeMap>();

  for (const t of targets) {
    const next = new Map<number, number>();
    for (const [mask, cost] of dp) {
      const out = craftOutcomes(data, t, inventory, mask, memo);
      for (const [m2, c2] of out) {
        const total = cost + c2;
        const prev = next.get(m2);
        if (prev === undefined || total < prev) next.set(m2, total);
      }
    }
    dp = next;
  }

  return Math.min(...dp.values());
}

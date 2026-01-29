import type { Metadata } from "next";
import ItemsClient from "./ItemsClient";
import {
  ensureItemsData,
  getAllItems,
  itemIconUrlFromPath,
} from "@/lib/datadragon";
import {
  isEligibleTarget,
  componentCounts,
  minGoldToComplete,
} from "./itemsSolver";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Skillcheck — Items",
  description:
    "How much gold do you need to complete your item spike?.",
};

/* -----------------------------
   deterministic helpers (daily seed)
----------------------------- */

function ymdUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickSeeded<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

function mulberry32(seed: number) {
  // deterministic PRNG in [0, 1)
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default async function ItemsPage() {
  await ensureItemsData();

  /* -------------------------
     Build item map
  -------------------------- */
  const data = getAllItems();

  if (Object.keys(data).length === 0) {
    throw new Error("Items map is empty (CommunityDragon fetch failed).");
  }

  const eligibleIds = Object.keys(data).filter(
    (id) => id && isEligibleTarget(data[id])
  );

  if (eligibleIds.length === 0) {
    throw new Error("No eligible legendary items found");
  }

  /* -------------------------
     Daily seed + seeded RNG
  -------------------------- */
  const dayKey = ymdUTC(new Date());
  const baseSeed = hash32(`items:${dayKey}`);
  const rng = mulberry32(baseSeed);

  /* -------------------------
     Pick single target (daily)
  -------------------------- */
  const targetSeed = hash32(`items:${dayKey}:target`);
  const targetId = pickSeeded(eligibleIds, targetSeed);
  const targetItem = data[targetId];

  if (!targetItem) {
    throw new Error("Selected target item missing from data map");
  }

  /* -------------------------
     Build bounded inventory
     (components ONLY for the one target)
  -------------------------- */
  const pool = new Map<string, number>();

for (const [id, n] of componentCounts(data, targetId, new Map(), { rng })) {
  pool.set(id, (pool.get(id) ?? 0) + n);
}


  const bag: string[] = [];
  for (const [id, n] of pool) {
    for (let i = 0; i < n; i++) bag.push(id);
  }

  // inventory size: daily deterministic 3..5 (bounded by bag.length)
  const invSize = Math.min(bag.length, 3 + Math.floor(rng() * 3));
  const inventory: string[] = [];

  // daily deterministic sampling without replacement
  while (inventory.length < invSize && bag.length) {
    const i = Math.floor(rng() * bag.length);
    inventory.push(bag.splice(i, 1)[0]);
  }

  /* -------------------------
     Solve gold
  -------------------------- */
  const trueGold = minGoldToComplete(data, [targetId], inventory);

  /* -------------------------
     Render
  -------------------------- */
  const ICON_PATCH = "latest";

  return (
    <ItemsClient
      targets={[
        {
          id: targetId,
          name: targetItem.name,
          description: targetItem.description ?? "",
          icon: itemIconUrlFromPath(targetItem.iconPath, ICON_PATCH),
          priceTotal: targetItem.priceTotal ?? 0,
          from: (targetItem.from ?? [])
            .map((cid) => {
              const c = data[String(cid)];
              if (!c) return null;

              return {
                id: String(cid),
                name: c.name,
                icon: itemIconUrlFromPath(c.iconPath, ICON_PATCH),
                priceTotal: c.priceTotal ?? 0,
              };
            })
            .filter(
              (
                c
              ): c is {
                id: string;
                name: string;
                icon: string;
                priceTotal: number;
              } => c !== null
            ),
        },
      ]}
      inventory={inventory.map((id) => {
        const it = data[id];
        return {
          id,
          name: it?.name ?? "",
          icon: itemIconUrlFromPath(it?.iconPath, ICON_PATCH),
        };
      })}
      trueGold={trueGold}
      // stable per-day storage key (so attempts/results can persist for the day)
      storageKey={`skillcheck:items:${dayKey}:${targetId}`}
      avgAttempts={"–"}
    />
  );
}

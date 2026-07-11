import { currentPatch, ensureLiveDDragonPatch, DDRAGON_FETCH_REVALIDATE_SECONDS } from "./patch";
import type {
  Rune,
  RuneSlot,
  RunesTree,
  PerkStyle,
  PerkSelection,
  RunePerks,
  RuneIconSet
} from "./types";

let runesInit: Promise<void> | null = null;
const perkIdToIconPath: Record<number, string> = {};
const styleIdToIconPath: Record<number, string> = {};

export function areRunesReady() {
  return Object.keys(perkIdToIconPath).length > 0;
}

export function ensureRunesAssets(locale: string = "en_US") {
  if (runesInit) return runesInit;

  runesInit = ensureLiveDDragonPatch().then(() =>
    fetch(
      `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/${locale}/runesReforged.json`,
      { next: { revalidate: DDRAGON_FETCH_REVALIDATE_SECONDS } }
    )
  )
    .then(r => r.json())
    .then((trees: RunesTree[]) => {
      if (!Array.isArray(trees)) return;

      for (const tree of trees) {
        if (tree?.id && tree?.icon) {
          styleIdToIconPath[tree.id] = tree.icon;
        }

        for (const slot of tree.slots ?? []) {
          for (const rune of slot.runes ?? []) {
            if (rune?.id && rune?.icon) {
              perkIdToIconPath[rune.id] = rune.icon;
            }
          }
        }
      }
    })
    .catch(() => {});

  return runesInit;
}

export function runeIconUrl(runeId: number | string) {
  const icon = perkIdToIconPath[Number(runeId)];
  return `https://ddragon.leagueoflegends.com/cdn/img/${icon}`;
}

export function runeStyleIconUrl(styleId: number | string) {
  const icon = styleIdToIconPath[Number(styleId)];
  return `https://ddragon.leagueoflegends.com/cdn/img/${icon}`;
}

const SHARD_BASENAME: Record<number, string> = {
  5008: "statmodsadaptiveforceicon",
  5005: "statmodsattackspeedicon",
  5007: "statmodscdrscalingicon",
  5002: "statmodsarmoricon",
  5003: "statmodsmagicresicon",
  5001: "statmodshealthplusicon",
  5010: "statmodsmovementspeedicon",
  5011: "statmodshealthscalingicon",
  5013: "statmodstenacityicon",
};

/** In-client row order: offense → flex → defense (3 options each). */
export const STAT_SHARD_ROW_OPTIONS: readonly (readonly number[])[] = [
  [5008, 5005, 5007],
  [5008, 5010, 5001],
  [5011, 5013, 5001],
] as const;

const SHARD_NAMES: Record<number, string> = {
  5001: "Health Scaling",
  5005: "Attack Speed",
  5007: "Ability Haste",
  5008: "Adaptive Force",
  5010: "Move Speed",
  5011: "Health",
  5013: "Tenacity and Slow Resist",
};

export function getStatShardName(shardId: number) {
  return SHARD_NAMES[shardId] ?? "";
}

function statShardIconUrl(id: number) {
  const name = SHARD_BASENAME[id];
  return name
    ? `https://raw.communitydragon.org/latest/game/assets/perks/statmods/${name}.png`
    : null;
}

/** All keystone runes (slot 0 of each tree) from runesReforged. */
export type KeystoneRune = { id: number; key: string; name: string; icon: string };

let keystoneList: KeystoneRune[] | null = null;

export async function fetchKeystoneRunes(patch?: string, locale: string = "en_US"): Promise<KeystoneRune[]> {
  if (keystoneList) return keystoneList;
  await ensureLiveDDragonPatch();
  const p = patch ?? currentPatch;
  const url = `https://ddragon.leagueoflegends.com/cdn/${p}/data/${locale}/runesReforged.json`;
  const res = await fetch(url, { next: { revalidate: DDRAGON_FETCH_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`runesReforged fetch failed: ${res.status}`);
  const trees: RunesTree[] = await res.json();
  if (!Array.isArray(trees)) return [];
  const list: KeystoneRune[] = [];
  for (const tree of trees) {
    const slot0 = tree.slots?.[0];
    const runes = slot0?.runes ?? [];
    for (const r of runes) {
      if (r?.id != null && r?.name != null && r?.icon != null) {
        list.push({
          id: r.id,
          key: r.key ?? "",
          name: r.name,
          icon: `https://ddragon.leagueoflegends.com/cdn/img/${r.icon}`,
        });
      }
    }
  }
  keystoneList = list;
  return list;
}

let runesTreesCache: RunesTree[] | null = null;

/** Full rune trees from runesReforged.json (all slots + perk metadata). */
export async function fetchRunesTrees(
  patch?: string,
  locale: string = "en_US"
): Promise<RunesTree[]> {
  if (runesTreesCache) return runesTreesCache;

  await ensureLiveDDragonPatch();
  const p = patch ?? currentPatch;
  const url = `https://ddragon.leagueoflegends.com/cdn/${p}/data/${locale}/runesReforged.json`;
  const res = await fetch(url, { next: { revalidate: DDRAGON_FETCH_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`runesReforged fetch failed: ${res.status}`);

  const trees: RunesTree[] = await res.json();
  if (!Array.isArray(trees)) return [];

  for (const tree of trees) {
    if (tree?.id && tree?.icon) {
      styleIdToIconPath[tree.id] = tree.icon;
    }
    for (const slot of tree.slots ?? []) {
      for (const rune of slot.runes ?? []) {
        if (rune?.id && rune?.icon) {
          perkIdToIconPath[rune.id] = rune.icon;
        }
      }
    }
  }

  runesTreesCache = trees;
  return trees;
}

export function getStatShardIconUrl(shardId: number) {
  return statShardIconUrl(shardId);
}

export function runeIconsFromPerks(perks: RunePerks | null | undefined): RuneIconSet {
  const styles = Array.isArray(perks?.styles) ? perks.styles : [];

  const primary = styles.find(s => s?.description === "primaryStyle") ?? styles[0];
  const secondary = styles.find(s => s?.description === "subStyle") ?? styles[1];

  const primaryStyleId = primary?.style ?? null;
  const secondaryStyleId = secondary?.style ?? null;

  const primarySel = primary?.selections ?? [];
  const secondarySel = secondary?.selections ?? [];

  const keystoneId = primarySel[0]?.perk ?? null;

  return {
    primaryStyleId,
    secondaryStyleId,
    keystone: keystoneId != null ? runeIconUrl(keystoneId) : null,
    primary: primarySel.slice(1).map(s => runeIconUrl(s.perk)),
    secondary: secondarySel.map(s => runeIconUrl(s.perk)),
    shards: [
      perks?.statPerks?.offense,
      perks?.statPerks?.flex,
      perks?.statPerks?.defense
    ]
      .filter((x): x is number => typeof x === "number")
      .map(id => statShardIconUrl(id)!)
      .filter(Boolean),
  };
}

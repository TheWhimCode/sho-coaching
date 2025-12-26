import { currentPatch } from "./patch";
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

  runesInit = fetch(
    `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/${locale}/runesReforged.json`
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
  5001: "statmodshealthscalingicon",
};

function statShardIconUrl(id: number) {
  const name = SHARD_BASENAME[id];
  return name
    ? `https://raw.communitydragon.org/latest/game/assets/perks/statmods/${name}.png`
    : null;
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

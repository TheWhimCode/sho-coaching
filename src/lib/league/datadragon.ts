// src/lib/league/datadragon.ts
export const FALLBACK_PATCH =
  process.env.NEXT_PUBLIC_DDRAGON_PATCH ?? '15.19.1';

let currentPatch = FALLBACK_PATCH;

/* ------------------------------ Champion utils ----------------------------- */

const ALIAS: Record<string, string> = {
  'dr. mundo': 'DrMundo',
  'dr mundo': 'DrMundo',
  drmundo: 'DrMundo',
  mundo: 'DrMundo',
  'missfortune': 'MissFortune',
  'master yi': 'MasterYi',
  'lee sin': 'LeeSin',
  'jarvaniv': 'JarvanIV',
  'twisted fate': 'TwistedFate',
  'tahm kench': 'TahmKench',
  "cho'gath": 'Chogath',
  "vel'koz": 'Velkoz',
  "kha'zix": 'Khazix',
  "kai'sa": 'Kaisa',
  "kogmaw": 'KogMaw',
  'xinzhao': 'XinZhao',
  'renata glasc': 'Renata',
  'monkeyking': 'MonkeyKing',
  'nunu & willump': 'Nunu',
  'nunu and willump': 'Nunu',
  "reksai": 'RekSai',
  "belveth": 'Belveth',
  "ksante": 'KSante',
  "leesin": 'LeeSin',
  "aurelionsol": 'AurelionSol',
  "masteryi": 'MasterYi',

};

function pascalize(name: string) {
  return name
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export function resolveChampionId(name: string): string {
  const s = (name || '').trim().toLowerCase();
  return ALIAS[s] ?? pascalize(s);
}

export function champSquareUrlById(id: string, patch = currentPatch) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${id}.png`;
}

export function championAvatarByName(name: string, patch = currentPatch) {
  return champSquareUrlById(resolveChampionId(name), patch);
}

/* ------------------------------ Patch handling ----------------------------- */

let patchInit: Promise<void> | null = null;
export function ensureLiveDDragonPatch(realm: string = 'euw') {
  if (patchInit) return patchInit;
  patchInit = fetch(`https://ddragon.leagueoflegends.com/realms/${realm}.json`)
    .then((r) => r.json())
    .then((j) => {
      if (j?.n?.champion) currentPatch = j.n.champion as string;
    })
    .catch(() => {});
  return patchInit;
}

/* --------------------------------- Items ---------------------------------- */

export function itemIconUrl(itemId: number | string, patch = currentPatch) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${itemId}.png`;
}

/* --------------------------- Summoner Spells ------------------------------- */

export function summonerSpellIconUrl(
  spellKey: string,
  patch = currentPatch
): string {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${spellKey}.png`;
}

// Map numeric spell id -> "SummonerFlash" key
let spellsInit: Promise<void> | null = null;
const spellIdToKey: Record<number, string> = {};

export function areSummonerSpellsReady() {
  return Object.keys(spellIdToKey).length > 0;
}

export function ensureSummonerSpellsAssets(locale: string = 'en_US') {
  if (spellsInit) return spellsInit;
  spellsInit = fetch(
    `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/${locale}/summoner.json`
  )
    .then((r) => r.json())
    .then((j) => {
      const data = j?.data ?? {};
      for (const k of Object.keys(data)) {
        const s = data[k];
        const id = Number(s?.key); // numeric-as-string in JSON
        const key = String(s?.id || ''); // e.g. "SummonerFlash"
        if (!Number.isNaN(id) && key) spellIdToKey[id] = key;
      }
    })
    .catch(() => {});
  return spellsInit;
}

/** Icon URL from numeric spell id (e.g. 4 => Flash). Returns null if unknown. */
export function summonerSpellIconById(
  id: number | string,
  patch = currentPatch
): string | null {
  const key = spellIdToKey[Number(id)];
  return key ? summonerSpellIconUrl(key, patch) : null;
}

/** Key from numeric id, e.g. 4 -> "SummonerFlash". */
export function summonerSpellKeyById(id: number | string): string | null {
  return spellIdToKey[Number(id)] ?? null;
}

/* ------------------------------- Runes ------------------------------------- */

type Rune = { id: number; key: string; icon: string };
type RuneSlot = { runes: Rune[] };
type RunesTree = { id: number; key: string; icon: string; slots: RuneSlot[] };

let runesInit: Promise<void> | null = null;
const perkIdToIconPath: Record<number, string> = {};
const styleIdToIconPath: Record<number, string> = {};

export function areRunesReady() {
  return Object.keys(perkIdToIconPath).length > 0;
}

export function ensureRunesAssets(locale: string = 'en_US') {
  if (runesInit) return runesInit;
  runesInit = fetch(
    `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/${locale}/runesReforged.json`
  )
    .then((r) => r.json())
    .then((trees: RunesTree[]) => {
      if (!Array.isArray(trees)) return;
      for (const tree of trees) {
        if (typeof tree?.id === 'number' && typeof tree?.icon === 'string') {
          styleIdToIconPath[tree.id] = tree.icon;
        }
        for (const slot of tree.slots || []) {
          for (const rune of slot.runes || []) {
            if (typeof rune?.id === 'number' && typeof rune?.icon === 'string') {
              perkIdToIconPath[rune.id] = rune.icon;
            }
          }
        }
      }
    })
    .catch(() => {});
  return runesInit;
}

export function runeIconUrl(runeId: number | string): string {
  const icon = perkIdToIconPath[Number(runeId)];
  return `https://ddragon.leagueoflegends.com/cdn/img/${icon}`;
}

export function runeStyleIconUrl(styleId: number | string): string {
  const icon = styleIdToIconPath[Number(styleId)];
  return `https://ddragon.leagueoflegends.com/cdn/img/${icon}`;
}

const SHARD_BASENAME: Record<number, string> = {
  5008: 'statmodsadaptiveforceicon',
  5005: 'statmodsattackspeedicon',
  5007: 'statmodscdrscalingicon',
  5002: 'statmodsarmoricon',
  5003: 'statmodsmagicresicon',
  5001: 'statmodshealthscalingicon',
};
function statShardIconUrl(id: number): string | null {
  const name = SHARD_BASENAME[id];
  return name
    ? `https://raw.communitydragon.org/latest/game/assets/perks/statmods/${name}.png`
    : null;
}

export type RuneIconSet = {
  primaryStyleId: number | null;
  secondaryStyleId: number | null;
  keystone: string | null;
  primary: string[];
  secondary: string[];
  shards: string[];
};

type PerkSelection = { perk: number };
type PerkStyle = { description?: string; style?: number; selections?: PerkSelection[] };

export function runeIconsFromPerks(perks: {
  statPerks?: { offense?: number; flex?: number; defense?: number };
  styles?: PerkStyle[];
} | null | undefined): RuneIconSet {
  const styles = Array.isArray(perks?.styles) ? perks.styles : [];
  const primary = styles.find((s) => s?.description === 'primaryStyle') ?? styles[0];
  const secondary = styles.find((s) => s?.description === 'subStyle') ?? styles[1];

  const primaryStyleId = (primary?.style ?? null) as number | null;
  const secondaryStyleId = (secondary?.style ?? null) as number | null;

  const primarySel = Array.isArray(primary?.selections) ? primary.selections : [];
  const secondarySel = Array.isArray(secondary?.selections) ? secondary.selections : [];

  const keystoneId = primarySel[0]?.perk ?? null;
  const keystone = keystoneId != null ? runeIconUrl(keystoneId) : null;

  const primaryMinor = primarySel.slice(1).map((s) => runeIconUrl(s.perk));
  const secondaryRunes = secondarySel.map((s) => runeIconUrl(s.perk));

  const shardIds = [
    perks?.statPerks?.offense,
    perks?.statPerks?.flex,
    perks?.statPerks?.defense,
  ].filter((x): x is number => typeof x === 'number');

  const shards = shardIds
    .map((id) => statShardIconUrl(id))
    .filter((u): u is string => typeof u === 'string' && !!u);

  return {
    primaryStyleId,
    secondaryStyleId,
    keystone,
    primary: primaryMinor,
    secondary: secondaryRunes,
    shards,
  };
}

/* ------------------------------- Rank assets ------------------------------- */

export type RankTier =
  | 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD'
  | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER' | 'UNRANKED';

export function rankEmblemUrl(tier: RankTier) {
  const base =
    'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem';
  if (tier === 'UNRANKED') return `${base}/emblem-unranked.png`;
  return `${base}/emblem-${tier.toLowerCase()}.png`;
}

export type RankGame = 'lol' | 'tft';
export type RankFormat = 'svg' | 'png';

export function rankMiniCrestUrl(
  tier: RankTier, game: RankGame = 'lol', format: RankFormat = 'svg'
) {
  const base =
    'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests';
  const t = tier.toLowerCase();
  if (game === 'tft') return `${base}/${t === 'unranked' ? 'unranked-tft.svg' : `${t}_tft.svg`}`;
  if (format === 'svg') return `${base}/${t}.svg`;
  return `${base}/${t}.png`;
}

export function rankMiniCrestSvg(tier: RankTier) {
  return rankMiniCrestUrl(tier, 'lol', 'svg');
}

/* -------------------------- Objective / Glyph icons ------------------------ */

const OBJECTIVE_BASE =
  'https://raw.communitydragon.org/latest/game/assets/ux/announcements';
const STATSTONE_BASE =
  'https://raw.communitydragon.org/latest/game/assets/ux/statstones/icons';

export const OBJECTIVE_ICONS: Record<string, string> = {
  atakhan: `${OBJECTIVE_BASE}/atakhan_dark_circle_128px.png`,
  voidgrubs: `${OBJECTIVE_BASE}/sru_voidgrub_circle.png`,
  baron: `${OBJECTIVE_BASE}/baron_circle.png`,
  herald: `${OBJECTIVE_BASE}/sruriftherald_circle.png`,
  dragon: `${OBJECTIVE_BASE}/dragon_circle.png`,
  elder: `${OBJECTIVE_BASE}/drake_elder_circle.png`,
  inhibitor: `${OBJECTIVE_BASE}/inhibitor_circle.png`,
  turret: `${OBJECTIVE_BASE}/tower_circle.png`,
  baronGlyph: `${STATSTONE_BASE}/baron.png`,
  heraldGlyph: `${STATSTONE_BASE}/herald.png`,
  dragonGlyph: `${STATSTONE_BASE}/dragon.png`,
  elderGlyph: `${STATSTONE_BASE}/elder.png`,
  inhibitorGlyph: `${STATSTONE_BASE}/inhibitor.png`,
  turretGlyph: `${STATSTONE_BASE}/tower.png`,
  infernal: `${STATSTONE_BASE}/infernodragon.png`,
  mountain: `${STATSTONE_BASE}/mountaindragon.png`,
  cloud: `${STATSTONE_BASE}/clouddragon.png`,
  ocean: `${STATSTONE_BASE}/oceandragon.png`,
  hextech: `${STATSTONE_BASE}/hextechdragon.png`,
  chemtech: `${STATSTONE_BASE}/chemtechdragon.png`,
};

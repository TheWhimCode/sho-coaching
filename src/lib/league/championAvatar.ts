// src/lib/league/championAvatar.ts
// Single source of truth for champion-name → DDragon square icon.

export const FALLBACK_PATCH =
  process.env.NEXT_PUBLIC_DDRAGON_PATCH ?? "15.19.1";

let currentPatch = FALLBACK_PATCH;

// Known tricky IDs → official DDragon ids
const ALIAS: Record<string, string> = {
  "dr. mundo": "DrMundo",
  "dr mundo": "DrMundo",
  "miss fortune": "MissFortune",
  "master yi": "MasterYi",
  "lee sin": "LeeSin",
  "jarvan iv": "JarvanIV",
  "twisted fate": "TwistedFate",
  "tahm kench": "TahmKench",
  "cho'gath": "Chogath",
  "vel'koz": "Velkoz",
  "kha'zix": "Khazix",
  "kai'sa": "Kaisa",
  "kog'maw": "KogMaw",
  "xin zhao": "XinZhao",
  "renata glasc": "Renata",
  "wukong": "MonkeyKing",
  "nunu & willump": "Nunu",
  "nunu and willump": "Nunu",
  "rek'sai": "RekSai",
  "bel'veth": "Belveth",
  "k'sante": "KSante",
  ksante: "KSante",
};

// Best-effort PascalCase for other names (works for most)
function pascalize(name: string) {
  return name
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function resolveChampionId(name: string): string {
  const s = (name || "").trim().toLowerCase();
  return ALIAS[s] ?? pascalize(s);
}

export function champSquareUrlById(id: string, patch = currentPatch) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${id}.png`;
}

export function championAvatarByName(name: string, patch = currentPatch) {
  return champSquareUrlById(resolveChampionId(name), patch);
}

// Optional: call once at app start (client) to use the live patch.
let patchInit: Promise<void> | null = null;
export function ensureLiveDDragonPatch(realm: string = "euw") {
  if (patchInit) return patchInit;
  patchInit = fetch(`https://ddragon.leagueoflegends.com/realms/${realm}.json`)
    .then((r) => r.json())
    .then((j) => {
      if (j?.n?.champion) currentPatch = j.n.champion as string;
    })
    .catch(() => {
      /* keep fallback */
    });
  return patchInit;
}

// If you prefer to control via env/build:
// export function setDDragonPatch(v: string) { currentPatch = v; }

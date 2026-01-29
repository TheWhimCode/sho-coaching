import { currentPatch } from "./patch";
import type { ChampionAliasMap } from "./types";

const ALIAS: ChampionAliasMap = {
  // spacing / punctuation / roman numerals / internal caps
  "dr mundo": "DrMundo",
  "dr. mundo": "DrMundo",
  drmundo: "DrMundo",
  mundo: "DrMundo",

  "master yi": "MasterYi",
  masteryi: "MasterYi",

  "jarvan iv": "JarvanIV",
  jarvaniv: "JarvanIV",

  "aurelion sol": "AurelionSol",
  aurelionsol: "AurelionSol",

  "twisted fate": "TwistedFate",
  twistedfate: "TwistedFate",

  "tahm kench": "TahmKench",
  tahmkench: "TahmKench",

  "cho'gath": "Chogath",
  chogath: "Chogath",

  "vel'koz": "Velkoz",
  velkoz: "Velkoz",

  "kha'zix": "Khazix",
  khazix: "Khazix",

  "kai'sa": "Kaisa",
  kaisa: "Kaisa",

  kogmaw: "KogMaw",
  xinzhao: "XinZhao",

  monkeyking: "MonkeyKing",
  wukong: "MonkeyKing",

  "nunu & willump": "Nunu",
  "nunu and willump": "Nunu",
  nunu: "Nunu",

  reksai: "RekSai",
  belveth: "Belveth",
  "bel'veth": "Belveth",

  ksante: "KSante",
  leesin: "LeeSin",
};

function pascalize(name: string) {
  return name
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function champSquareUrlById(id: string, patch = currentPatch) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${id}.png`;
}

export function resolveChampionId(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";

  // Preserve correct casing if already a canonical DDragon id
  if (/^[A-Z][A-Za-z0-9]*$/.test(raw)) return raw;

  const s = raw
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return ALIAS[s] ?? pascalize(s);
}

export function championAvatarByName(name: string, patch = currentPatch) {
  return champSquareUrlById(resolveChampionId(name), patch);
}

export async function getAllChampions(
  patch = currentPatch,
  locale = "en_US"
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/champion.json`
  );

  if (!res.ok) {
    throw new Error("Failed to load champion list");
  }

  const data = await res.json();

  return Object.values(data.data).map((c: any) => ({
    id: c.id,
    name: c.name,
    title: c.title, // ✅ "the Nine-Tailed Fox"
    icon: champSquareUrlById(c.id, patch), // ✅ square portrait

  }));
}

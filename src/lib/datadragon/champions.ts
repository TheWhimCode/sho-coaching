import { currentPatch } from "./patch";
import type { ChampionAliasMap } from "./types";

const ALIAS: ChampionAliasMap = {
  "dr. mundo": "DrMundo",
  "dr mundo": "DrMundo",
  drmundo: "DrMundo",
  mundo: "DrMundo",
  missfortune: "MissFortune",
  "master yi": "MasterYi",
  "lee sin": "LeeSin",
  jarvaniv: "JarvanIV",
  "twisted fate": "TwistedFate",
  "tahm kench": "TahmKench",
  "cho'gath": "Chogath",
  "vel'koz": "Velkoz",
  "kha'zix": "Khazix",
  "kai'sa": "Kaisa",
  kogmaw: "KogMaw",
  xinzhao: "XinZhao",
  "renata glasc": "Renata",
  monkeyking: "MonkeyKing",
  "nunu & willump": "Nunu",
  "nunu and willump": "Nunu",
  reksai: "RekSai",
  belveth: "Belveth",
  ksante: "KSante",
  leesin: "LeeSin",
  aurelionsol: "AurelionSol",
  masteryi: "MasterYi",
};

function pascalize(name: string) {
  return name
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function resolveChampionId(name: string) {
  const s = (name || "").trim().toLowerCase();
  return ALIAS[s] ?? pascalize(s);
}

export function champSquareUrlById(id: string, patch = currentPatch) {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${id}.png`;
}

export function championAvatarByName(name: string, patch = currentPatch) {
  return champSquareUrlById(resolveChampionId(name), patch);
}

/* --------------------------------------------------
   NEW: load all champions from Data Dragon
-------------------------------------------------- */

export async function getAllChampions(
  patch = currentPatch,
  locale = "en_US"
): Promise<string[]> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/champion.json`
  );

  if (!res.ok) {
    throw new Error("Failed to load champion list");
  }

  const data = await res.json();

  // Object keys are already the correct canonical names
  return Object.keys(data.data);
}

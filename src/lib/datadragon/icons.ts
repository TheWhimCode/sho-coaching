// lib/cdragon/icons.ts
import { currentPatch } from "./patch";

function normalizeCDragonPatch(patch: string) {
  const p = patch.split(".");
  return p.length >= 2 ? `${p[0]}.${p[1]}` : patch;
}

export function goldIconUrl(patch?: string) {
  const p = patch ?? normalizeCDragonPatch(currentPatch) ?? "latest";
  return `https://raw.communitydragon.org/${p}/plugins/rcp-fe-lol-collections/global/default/icon_gold.png`;
}

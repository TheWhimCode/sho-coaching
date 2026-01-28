export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import CooldownsClient from "./CooldownsClient";
import { cooldownAbilities } from "./components/cooldownAbilities";
import { fetchChampionSpellsById } from "@/lib/datadragon/championspells";
import { champSquareUrlById } from "@/lib/datadragon";

const KEYS = ["Q", "W", "E", "R"] as const;
type SpellKey = typeof KEYS[number];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default async function CooldownsPage() {
  const eligibleChamps = Object.entries(cooldownAbilities)
    .map(([id, keys]) => ({
      id,
      keys: keys.filter(Boolean) as SpellKey[],
    }))
    .filter((x) => x.keys.length > 0);

  const champ = pick(eligibleChamps);
  const key = pick(champ.keys);

  const { data, version } = await fetchChampionSpellsById(champ.id);

  const idx = key === "Q" ? 0 : key === "W" ? 1 : key === "E" ? 2 : 3;
  const activeSpell = data.spells[idx];

  // ✅ pick rank on the server (1..maxRank)
  const maxRank = activeSpell.cooldowns?.length ?? 0;
  const askedRank = maxRank > 0 ? pick(Array.from({ length: maxRank }, (_, i) => i + 1)) : 1;

  return (
    <CooldownsClient
      champion={{ id: champ.id, icon: champSquareUrlById(champ.id, version) }}
      spells={data.spells}
      initialActiveSpellId={activeSpell.id}
      askedRank={askedRank}
    />
  );
}

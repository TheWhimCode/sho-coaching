export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";
import CooldownsClient from "./CooldownsClient";
import { cooldownAbilities } from "./components/cooldownAbilities";
import { fetchChampionSpellsById } from "@/lib/datadragon/championspells";
import { champSquareUrlById } from "@/lib/datadragon";

const KEYS = ["Q", "W", "E", "R"] as const;
type SpellKey = (typeof KEYS)[number];

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
  const spellKey = pick(champ.keys);

  const { data, version } = await fetchChampionSpellsById(champ.id);

  const idx =
    spellKey === "Q" ? 0 : spellKey === "W" ? 1 : spellKey === "E" ? 2 : 3;
  const activeSpell = data.spells[idx];

  // pick rank on the server (1..maxRank)
  const maxRank = activeSpell.cooldowns?.length ?? 0;
  const askedRank =
    maxRank > 0 ? pick(Array.from({ length: maxRank }, (_, i) => i + 1)) : 1;

  // global avg attempts for THIS (champ + spellKey + rank)
  const stat = await prisma.cooldownStat.findUnique({
    where: {
      championId_spellKey_rank: {
        championId: champ.id,
        spellKey,
        rank: askedRank,
      },
    },
    select: { attempts: true, correctAttempts: true },
  });

  const avgAttempts =
    stat && stat.correctAttempts > 0
      ? (stat.attempts / stat.correctAttempts).toFixed(2)
      : "–";

  // ✅ Fetch champion name + title from DDragon champion list JSON
  const champMetaRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    { cache: "no-store" }
  );
  if (!champMetaRes.ok) {
    throw new Error("Failed to load champion metadata");
  }
  const champMetaJson = await champMetaRes.json();
  const champMeta = champMetaJson.data?.[champ.id];

  const champName: string | undefined = champMeta?.name;
  const champTitle: string | undefined = champMeta?.title;

  return (
    <CooldownsClient
      champion={{
        id: champ.id,
        name: champName,
        title: champTitle,
        icon: champSquareUrlById(champ.id, version),
      }}
      spells={data.spells}
      initialActiveSpellId={activeSpell.id}
      askedRank={askedRank}
      avgAttempts={avgAttempts}
    />
  );
}

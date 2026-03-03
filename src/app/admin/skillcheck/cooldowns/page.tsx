import type { Metadata } from "next";
import CooldownsClient from "@/app/skillcheck/cooldowns/CooldownsClient";
import { cooldownAbilities } from "@/app/skillcheck/cooldowns/components/cooldownAbilities";
import { fetchChampionSpellsById } from "@/lib/datadragon/championspells";
import { champSquareUrlById } from "@/lib/datadragon";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const description =
  "Admin cooldown sandbox: play the cooldowns game without affecting stats or streak.";

export const metadata: Metadata = {
  title: "Admin — Skillcheck Cooldowns",
  description,
  openGraph: {
    title: "Admin — Skillcheck Cooldowns",
    description,
    type: "website",
  },
};

const KEYS = ["Q", "W", "E", "R"] as const;
type SpellKey = (typeof KEYS)[number];

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

export default async function AdminCooldownsPage() {
  const eligibleChamps = Object.entries(cooldownAbilities)
    .map(([id, keys]) => ({
      id,
      keys: keys.filter(Boolean) as SpellKey[],
    }))
    .filter((x) => x.keys.length > 0);

  // Use a random seed per-request so reload gets a new challenge.
  const now = Date.now();
  const champSeed = hash32(`admin-cooldowns:${now}:champ`);
  const champ = pickSeeded(eligibleChamps, champSeed);

  const spellSeed = hash32(`admin-cooldowns:${now}:${champ.id}:spell`);
  const spellKey = pickSeeded(champ.keys, spellSeed);

  const { data, version } = await fetchChampionSpellsById(champ.id);

  const idx =
    spellKey === "Q" ? 0 : spellKey === "W" ? 1 : spellKey === "E" ? 2 : 3;

  const activeSpell = data.spells[idx];

  const maxRank = activeSpell.cooldowns?.length ?? 1;
  const rankArr = Array.from({ length: maxRank }, (_, i) => i + 1);
  const rankSeed = hash32(`admin-cooldowns:${now}:${champ.id}:${spellKey}:rank`);
  const askedRank = pickSeeded(rankArr, rankSeed);

  return (
    <CooldownsClient
      dayKey={`admin-${now}`}
      champion={{
        id: champ.id,
        name: undefined,
        title: undefined,
        icon: champSquareUrlById(champ.id, version),
      }}
      spells={data.spells}
      initialActiveSpellId={activeSpell.id}
      askedRank={askedRank}
      avgAttempts={"–"}
      adminMode
    />
  );
}


// app/skillcheck/cooldowns/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CooldownsClient from "./CooldownsClient";
import { cooldownAbilities } from "./components/cooldownAbilities";
import { fetchChampionSpellsById } from "@/lib/datadragon/championspells";
import { champSquareUrlById } from "@/lib/datadragon";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const description = "Guess todays cooldown for a champion ability.";

export const metadata: Metadata = {
  title: "Skillcheck — Cooldowns",
  description,
  openGraph: {
    title: "Skillcheck — Cooldowns",
    description,
    type: "website",
  },
};

const KEYS = ["Q", "W", "E", "R"] as const;
type SpellKey = (typeof KEYS)[number];

/* -----------------------------
   deterministic helpers
----------------------------- */

function ymdUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

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

export default async function CooldownsPage() {
  const eligibleChamps = Object.entries(cooldownAbilities)
    .map(([id, keys]) => ({
      id,
      keys: keys.filter(Boolean) as SpellKey[],
    }))
    .filter((x) => x.keys.length > 0);

  const dayKey = ymdUTC(new Date());

  const champSeed = hash32(`cooldowns:${dayKey}`);
  const champ = pickSeeded(eligibleChamps, champSeed);

  const spellSeed = hash32(`cooldowns:${dayKey}:${champ.id}`);
  const spellKey = pickSeeded(champ.keys, spellSeed);

  const { data, version } = await fetchChampionSpellsById(champ.id);

  const idx =
    spellKey === "Q"
      ? 0
      : spellKey === "W"
      ? 1
      : spellKey === "E"
      ? 2
      : 3;

  const activeSpell = data.spells[idx];

  const maxRank = activeSpell.cooldowns?.length ?? 1;
  const rankArr = Array.from({ length: maxRank }, (_, i) => i + 1);
  const rankSeed = hash32(`cooldowns:${dayKey}:${champ.id}:${spellKey}`);
  const askedRank = pickSeeded(rankArr, rankSeed);

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
      dayKey={dayKey}
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

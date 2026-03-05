import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RunesClient from "./RunesClient";
import { champSquareUrlById } from "@/lib/datadragon";
import { fetchKeystoneRunes } from "@/lib/datadragon/runes";
import { getRunesDailyChampion } from "@/lib/skillcheck/runesDailyChampion";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Skillcheck — Runes",
  description: "What keystone is most popular for this champion in master+?",
};

function ymdUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default async function RunesPage() {
  const dayKey = ymdUTC(new Date());
  const runeDaily = await prisma.runeDaily.findUnique({
    where: { dayKey },
  });

  const championId = runeDaily?.championId ?? getRunesDailyChampion(dayKey);
  const patch = process.env.NEXT_PUBLIC_DDRAGON_PATCH ?? "16.5.1";
  const championIcon = champSquareUrlById(championId, patch);

  const [keystoneRunes, champMeta] = await Promise.all([
    fetchKeystoneRunes(patch),
    fetch(
      `https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((j: any) => j?.data?.[championId]?.name ?? championId)
      .catch(() => championId),
  ]);

  const championName = typeof champMeta === "string" ? champMeta : championId;

  if (!runeDaily || runeDaily.keystoneId <= 0) {
    return (
      <RunesClient
        dayKey={dayKey}
        champion={{ id: championId, name: championName, icon: championIcon }}
        options={[]}
        correctKeystoneId={0}
        storageKey={`skillcheck:runes:${dayKey}:${championId}`}
        avgAttempts="–"
        dataNotReady={true}
        errorLog={runeDaily?.errorLog ?? null}
      />
    );
  }

  const correct = keystoneRunes.find((r) => r.id === runeDaily.keystoneId);
  const wrongPool = keystoneRunes.filter((r) => r.id !== runeDaily.keystoneId);
  const optionsList: typeof keystoneRunes = correct ? [correct] : [];
  while (optionsList.length < 4 && wrongPool.length > 0) {
    const i = Math.floor(Math.random() * wrongPool.length);
    const w = wrongPool.splice(i, 1)[0];
    if (w) optionsList.push(w);
  }
  for (let i = optionsList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionsList[i], optionsList[j]] = [optionsList[j], optionsList[i]];
  }
  const shuffled = optionsList;

  const runeStat = await prisma.runeStat.findUnique({
    where: { dayKey_championId: { dayKey, championId } },
    select: { attempts: true, correctAttempts: true },
  });
  const avgAttempts =
    runeStat && runeStat.correctAttempts > 0
      ? (runeStat.attempts / runeStat.correctAttempts).toFixed(2)
      : "–";

  return (
    <RunesClient
      dayKey={dayKey}
      champion={{ id: championId, name: championName, icon: championIcon }}
      options={shuffled.map((r) => ({ id: r.id, name: r.name, icon: r.icon }))}
      correctKeystoneId={runeDaily.keystoneId}
      storageKey={`skillcheck:runes:${dayKey}:${championId}`}
      avgAttempts={avgAttempts}
      dataNotReady={false}
      errorLog={null}
    />
  );
}

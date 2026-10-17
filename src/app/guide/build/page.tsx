import { DEFAULT_SOCIAL_IMAGE } from "@/lib/socialMetadata";
import type { Metadata } from "next";
import { champSquareUrlById, resolveChampionId } from "@/lib/datadragon/champions";
import { ensureLiveDDragonPatch } from "@/lib/datadragon/patch";
import { loadPickerBoots, loadPickerBuilds } from "@/lib/guides/buildPicker/loadBuilds";
import type { ChampionProfileRow } from "@/lib/guides/buildPicker/types";
import { prisma } from "@/lib/prisma";
import { VIEGO_ITEM_SECTION } from "../viegoItems";
import BuildPickerClient from "./BuildPickerClient";
import { buildGuideTextIcons } from "@/lib/guides/buildGuideTextIcons";

const title = "Viego Build Picker";
const description =
  "Enter your Riot ID while in game and get the right Viego build for both team compositions.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    images: [DEFAULT_SOCIAL_IMAGE],
    title,
    description,
    url: "/guide/build",
    type: "website",
  },
  alternates: {
    canonical: "/guide/build",
  },
};

export const dynamic = "force-dynamic";

export default async function BuildPickerPage() {
  const showPickerDebug = process.env.NODE_ENV === "development";
  const guideTextIcons = await buildGuideTextIcons();
  const [builds, bootItems, profiles] = await Promise.all([
    loadPickerBuilds(VIEGO_ITEM_SECTION),
    loadPickerBoots(),
    showPickerDebug
      ? prisma.championProfile.findMany({ orderBy: { name: "asc" } })
      : Promise.resolve([]),
    ensureLiveDDragonPatch(),
  ]);

  const championRows: ChampionProfileRow[] = profiles.map((row) => {
    const championId = resolveChampionId(row.name);
    return {
      name: row.name,
      championId,
      icon: champSquareUrlById(championId),
      durabilityScore: row.durabilityScore,
      canBuildSteelcaps: row.canBuildSteelcaps,
      mercuryTreadsScore: row.mercuryTreadsScore,
      shieldScore: row.shieldScore,
      shieldTiming: row.shieldTiming,
      damageType: row.damageType,
      damageThreat: row.damageThreat,
      damageScore: row.damageScore,
      cc: row.cc,
      ccScore: row.ccScore,
    };
  });

  return (
    <BuildPickerClient builds={builds} bootItems={bootItems} championRows={championRows} guideTextIcons={guideTextIcons} />
  );
}

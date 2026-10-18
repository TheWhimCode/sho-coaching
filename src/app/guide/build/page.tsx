import { DEFAULT_SOCIAL_IMAGE } from "@/lib/socialMetadata";
import type { Metadata } from "next";
import { champSquareUrlById, resolveChampionId } from "@/lib/datadragon/champions";
import { ensureLiveDDragonPatch } from "@/lib/datadragon/patch";
import { loadPickerBoots, loadPickerBuilds } from "@/lib/guides/buildPicker/loadBuilds";
import type { ChampionProfileRow } from "@/lib/guides/buildPicker/types";
import { pickerProfiles } from "@/lib/guides/buildPicker/profiles.server";
import { VIEGO_ITEM_SECTION } from "../viegoItems";
import BuildPickerClient from "./BuildPickerClient";
import { buildGuideTextIcons } from "@/lib/guides/buildGuideTextIcons";
import { ensureSummonerSpellsAssets, summonerSpellIconById, summonerSpellKeyById } from "@/lib/datadragon/summonerspells";
import type { RandomGameCatalog } from "@/lib/guides/buildPicker/randomGame";

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

export const revalidate = 60;

export default async function BuildPickerPage() {
  const guideTextIcons = await buildGuideTextIcons();
  const [builds, bootItems, profiles] = await Promise.all([
    loadPickerBuilds(VIEGO_ITEM_SECTION),
    loadPickerBoots(),
    pickerProfiles(),
    ensureLiveDDragonPatch(),
    ensureSummonerSpellsAssets(),
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

  const randomGameCatalog: RandomGameCatalog = {
    champions: profiles.filter((row) => row.durabilityScore !== null && row.damageScore !== null && row.shieldScore !== null).map((row) => ({
      name: row.name, championId: resolveChampionId(row.name),
      championIcon: champSquareUrlById(resolveChampionId(row.name)),
      shields: row.shields, damageType: row.damageType, damageThreat: row.damageThreat,
      deniesResets: row.deniesResets, cc: row.cc,
      durabilityScore: row.durabilityScore, damageScore: row.damageScore, ccScore: row.ccScore,
      shieldScore: row.shieldScore, shieldTiming: row.shieldTiming,
      mercuryTreadsScore: row.mercuryTreadsScore, canBuildSteelcaps: row.canBuildSteelcaps,
    })),
    spells: [4, 7, 11, 12, 21].map((id) => ({ id, key: summonerSpellKeyById(id) ?? String(id), icon: summonerSpellIconById(id) ?? "" })),
  };

  return (
    <BuildPickerClient builds={builds} bootItems={bootItems} championRows={championRows} guideTextIcons={guideTextIcons} randomGameCatalog={randomGameCatalog} />
  );
}

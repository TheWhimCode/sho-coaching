import type { Metadata } from "next";
import { fetchRunesTrees } from "@/lib/datadragon/runes";
import { champSquareUrlById } from "@/lib/datadragon/champions";
import { buildGuideRunePageData } from "@/lib/guides/buildGuideRunePageData";
import { buildGuideItemPageData } from "@/lib/guides/buildGuideItemPageData";
import { buildGuideMatchupPageData } from "@/lib/guides/buildGuideMatchupPageData";
import { buildGuideConventionalBuildPageData } from "@/lib/guides/buildGuideConventionalBuildPageData";
import { buildGuideTextIcons } from "@/lib/guides/buildGuideTextIcons";
import { VIEGO_RUNE_BUILD } from "./viegoRunes";
import { VIEGO_ITEM_SECTION } from "./viegoItems";
import { VIEGO_MATCHUP_SECTION } from "./viegoMatchups";
import { VIEGO_CONVENTIONAL_BUILD } from "./viegoConventionalBuild";
import { VIEGO_COMBO_SECTION } from "./viegoCombos";
import ViegoGuideClient from "./ViegoGuideClient";

const title = "Viego Guide";
const description =
  "Runes, builds, and tips for Viego jungle — Domination primary with Precision secondary.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/guide",
    type: "article",
  },
  alternates: {
    canonical: "/guide",
  },
};

export default async function ViegoGuidePage() {
  const [trees, itemData, guideTextIcons] = await Promise.all([
    fetchRunesTrees(),
    buildGuideItemPageData(VIEGO_ITEM_SECTION),
    buildGuideTextIcons(),
  ]);
  const runeData = await buildGuideRunePageData(VIEGO_RUNE_BUILD, trees);
  const matchupData = buildGuideMatchupPageData(VIEGO_MATCHUP_SECTION);
  const conventionalBuildData = buildGuideConventionalBuildPageData(VIEGO_CONVENTIONAL_BUILD);
  const championIcon = champSquareUrlById("Viego");

  return (
    <ViegoGuideClient
      runeData={runeData}
      itemData={itemData}
      conventionalBuildData={conventionalBuildData}
      guideTextIcons={guideTextIcons}
      matchupData={matchupData}
      comboData={VIEGO_COMBO_SECTION}
      championIcon={championIcon}
    />
  );
}

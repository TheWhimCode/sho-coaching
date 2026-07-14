import type { Metadata } from "next";
import { fetchRunesTrees } from "@/lib/datadragon/runes";
import { champSquareUrlById } from "@/lib/datadragon/champions";
import { buildGuideRunePageData } from "@/lib/guides/buildGuideRunePageData";
import { buildGuideItemPageData } from "@/lib/guides/buildGuideItemPageData";
import { buildGuideJungleTierMatchupPageData } from "@/lib/guides/buildGuideJungleTierMatchupData";
import { buildGuidePossessionPageData } from "@/lib/guides/buildGuidePossessionPageData";
import { buildGuideConventionalBuildPageData } from "@/lib/guides/buildGuideConventionalBuildPageData";
import { buildGuideTextIcons } from "@/lib/guides/buildGuideTextIcons";
import { buildGuideViegoAbilityIcons } from "@/lib/guides/buildGuideViegoAbilityIcons";
import { collectGuideCriticalPreloadUrls } from "@/lib/guides/preloadGuideImages";
import { VIEGO_RUNE_BUILD } from "./viegoRunes";
import { VIEGO_ITEM_SECTION } from "./viegoItems";
import { VIEGO_MATCHUP_SECTION } from "./viegoMatchups";
import { VIEGO_JUNGLE_TIER_MATCHUPS } from "./viegoJungleTierMatchups";
import { VIEGO_CONVENTIONAL_BUILD } from "./viegoConventionalBuild";
import { VIEGO_COMBO_SECTION } from "./viegoCombos";
import { VIEGO_POSSESSIONS_SECTION } from "./viegoPossessions";
import { VIEGO_GAME_STAGES_SECTION } from "./viegoGameStages";
import ViegoGuideClient from "./ViegoGuideClient";

const title = "Viego Guide";
const description =
  "Mino's Lethality, Hail of Blades Viego guide.";

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

export const revalidate = 86400;

export default async function ViegoGuidePage() {
  const [runeData, itemData, guideTextIcons, viegoAbilityIcons, possessionsData] =
    await Promise.all([
    fetchRunesTrees().then((trees) => buildGuideRunePageData(VIEGO_RUNE_BUILD, trees)),
    buildGuideItemPageData(VIEGO_ITEM_SECTION),
    buildGuideTextIcons(),
    buildGuideViegoAbilityIcons(),
    buildGuidePossessionPageData(VIEGO_POSSESSIONS_SECTION),
  ]);
  const jungleTierMatchupData = buildGuideJungleTierMatchupPageData(
    VIEGO_JUNGLE_TIER_MATCHUPS,
    VIEGO_MATCHUP_SECTION
  );
  const conventionalBuildData = buildGuideConventionalBuildPageData(VIEGO_CONVENTIONAL_BUILD);
  const championIcon = champSquareUrlById("Viego");
  const preloadImageUrls = collectGuideCriticalPreloadUrls(runeData, championIcon);

  return (
    <>
      {preloadImageUrls.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
      <ViegoGuideClient
        runeData={runeData}
        itemData={itemData}
        conventionalBuildData={conventionalBuildData}
        guideTextIcons={guideTextIcons}
        jungleTierMatchupData={jungleTierMatchupData}
        comboData={VIEGO_COMBO_SECTION}
        possessionsData={possessionsData}
        gameStagesData={VIEGO_GAME_STAGES_SECTION}
        viegoAbilityIcons={viegoAbilityIcons}
        championIcon={championIcon}
      />
    </>
  );
}

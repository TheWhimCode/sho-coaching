"use client";

import Image from "next/image";
import { Suspense } from "react";
import RunePageSection from "@/app/_components/guides/runes/RunePageSection";
import ItemBuildSection from "@/app/_components/guides/items/ItemBuildSection";
import JungleTierMatchupPanel from "@/app/_components/guides/matchups/JungleTierMatchupPanel";
import CombosSection from "@/app/_components/guides/combos/CombosSection";
import PossessionsSection from "@/app/_components/guides/possessions/PossessionsSection";
import GameStagesSection from "@/app/_components/guides/gameStages/GameStagesSection";
import ConventionalBuildSection from "@/app/_components/guides/conventional/ConventionalBuildSection";
import GuideSectionIndex from "@/app/_components/guides/GuideSectionIndex";
import TwitchShoutoutSection from "@/app/_components/guides/TwitchShoutoutSection";
import GuideDonationSection from "@/app/_components/guides/GuideDonationSection";
import { guideChampionIconImgClass, guidePageBg, GUIDE } from "@/lib/guides/guideTheme";
import {
  gameStagesSectionHasNew,
  jungleMatchupsSectionHasNew,
} from "@/lib/guides/guideWhatsNew";
import { SHOW_GUIDE_POSSESSIONS_SECTION } from "@/lib/guides/guideFeatureFlags";
import type { GuideRunePageData } from "@/lib/guides/runeGuideTypes";
import type { GuideItemPageData } from "@/lib/guides/itemGuideTypes";
import type { GuideJungleTierMatchupPageData } from "@/lib/guides/matchupGuideTypes";
import type { GuideComboPageData, GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";
import type { GuidePossessionPageData } from "@/lib/guides/possessionGuideTypes";
import type { GuideGameStagePageData } from "@/lib/guides/gameStageGuideTypes";
import type { GuideConventionalBuildPageData } from "@/lib/guides/conventionalBuildGuideTypes";
import type { TwitchStreamStatus } from "@/lib/twitch/types";

function GuideFooter() {
  return (
    <footer className="mt-16 pb-4">
      <Suspense fallback={null}>
        <GuideDonationSection />
      </Suspense>
    </footer>
  );
}

export default function ViegoGuideClient({
  runeData,
  itemData,
  conventionalBuildData,
  jungleTierMatchupData,
  comboData,
  possessionsData,
  gameStagesData,
  viegoAbilityIcons,
  championIcon,
  guideTextIcons,
  twitchStatus,
}: {
  runeData: GuideRunePageData;
  itemData: GuideItemPageData;
  conventionalBuildData: GuideConventionalBuildPageData;
  jungleTierMatchupData: GuideJungleTierMatchupPageData;
  comboData: GuideComboPageData;
  possessionsData: GuidePossessionPageData;
  gameStagesData: GuideGameStagePageData;
  viegoAbilityIcons: GuideViegoAbilityIcons;
  championIcon: string;
  guideTextIcons: Record<string, string>;
  twitchStatus: TwitchStreamStatus;
}) {
  const indexEntries = [
    { id: "runes", label: runeData.build.heading },
    { id: "items", label: itemData.heading },
    { id: "conventional-build", label: conventionalBuildData.heading },
    {
      id: "matchups",
      label: jungleTierMatchupData.title,
      isNew: jungleMatchupsSectionHasNew(jungleTierMatchupData),
    },
    { id: "combos", label: comboData.heading },
    ...(SHOW_GUIDE_POSSESSIONS_SECTION
      ? [{ id: "possessions", label: possessionsData.heading, isNew: possessionsData.isNew }]
      : []),
    {
      id: "game-stages",
      label: gameStagesData.heading,
      isNew: gameStagesSectionHasNew(gameStagesData),
    },
  ];

  return (
    <div className="relative min-h-screen" style={{ color: GUIDE.text }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: guidePageBg }}
      />

      <GuideSectionIndex
        entries={indexEntries}
        className="pointer-events-auto fixed top-28 z-30 hidden xl:block"
        style={{
          left: "max(1rem, calc((100vw - 72rem) / 2 - 11rem))",
        }}
      />

      <div className="relative z-10 mx-auto min-w-0 max-w-6xl overflow-x-hidden px-0 pb-20 pt-20 sm:overflow-visible sm:px-10 sm:pt-24 lg:px-16 lg:pt-28 xl:px-24">
        <header className="mb-12 flex items-center gap-4 px-6 sm:gap-6 sm:px-0">
          <div className="flex min-w-0 flex-1 flex-col pl-24 sm:pl-28">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: GUIDE.lightBlue }}
            >
              Champion Guide
            </p>
            <div className="relative mt-0.5">
              <div
                className="absolute right-full top-1/2 mr-4 h-20 w-20 -translate-y-1/2 overflow-hidden rounded-2xl sm:h-24 sm:w-24"
                style={{
                  boxShadow: `0 0 0 2px ${GUIDE.pink}, 0 0 20px rgba(240, 171, 207, 0.25)`,
                }}
              >
                <Image
                  src={championIcon}
                  alt="Viego"
                  fill
                  className={guideChampionIconImgClass}
                  priority
                  unoptimized
                />
              </div>
              <h1
                className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
                style={{ color: GUIDE.beige }}
              >
                Mino&apos;s Viego Guide
              </h1>
            </div>
            <p className="mt-1 text-sm sm:text-base" style={{ color: GUIDE.textMuted }}>
              Isolde was a femboy. Where is he?
            </p>
          </div>
        </header>

        <div className="mb-12">
          <TwitchShoutoutSection initialStatus={twitchStatus} />
        </div>

        <RunePageSection data={runeData} guideTextIcons={guideTextIcons} />

        <div className="mt-16">
          <ItemBuildSection data={itemData} guideTextIcons={guideTextIcons} />
        </div>

        <div className="mt-16">
          <ConventionalBuildSection data={conventionalBuildData} guideTextIcons={guideTextIcons} />
        </div>

        <div className="mt-16">
          <JungleTierMatchupPanel data={jungleTierMatchupData} guideTextIcons={guideTextIcons} />
        </div>

        <div className="mt-16">
          <CombosSection
            data={comboData}
            abilityIcons={viegoAbilityIcons}
            guideTextIcons={guideTextIcons}
          />
        </div>

        {SHOW_GUIDE_POSSESSIONS_SECTION ? (
          <div className="mt-16">
            <PossessionsSection
              data={possessionsData}
              guideTextIcons={guideTextIcons}
              viegoAbilityIcons={viegoAbilityIcons}
            />
          </div>
        ) : null}

        <div className="mt-16">
          <GameStagesSection
            data={gameStagesData}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
        </div>

        <GuideFooter />
      </div>
    </div>
  );
}

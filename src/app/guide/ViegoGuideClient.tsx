"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
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
  itemSectionHasNew,
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

/** Survives Strict Mode remounts so the intro only plays once per page JS lifetime. */
let guideCoachingAdIntroDone = false;

function GuideCoachingAd() {
  const [visible, setVisible] = useState(guideCoachingAdIntroDone);

  useEffect(() => {
    if (guideCoachingAdIntroDone) {
      setVisible(true);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      guideCoachingAdIntroDone = true;
      setVisible(true);
      return;
    }

    const id = window.setTimeout(() => {
      guideCoachingAdIntroDone = true;
      setVisible(true);
    }, 550);

    return () => window.clearTimeout(id);
  }, []);

  return (
    <Link
      href="/coaching"
      className={[
        "group flex w-[7.25rem] shrink-0 self-stretch sm:w-44 md:w-52",
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-2.5 scale-[0.94] opacity-0",
      ].join(" ")}
      aria-label="Book coaching — available until Saturday"
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
    >
      <span
        className="relative flex h-full min-h-[6rem] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border px-2 py-2 text-center transition duration-200 group-hover:brightness-110 sm:min-h-[6.75rem] sm:px-3 sm:py-2"
        style={{
          color: GUIDE.beige,
          borderColor: "rgba(232, 198, 118, 0.55)",
          background:
            "linear-gradient(160deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 45%, rgba(74, 53, 79, 0.55) 100%)",
          boxShadow:
            "0 0 0 1px rgba(251, 191, 36, 0.2), 0 0 28px -4px rgba(232, 198, 118, 0.55), 0 12px 32px -12px rgba(0, 0, 0, 0.65)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(251, 191, 36, 0.22), transparent 60%)",
          }}
        />
        <GraduationCap
          className="relative h-5 w-5 shrink-0 sm:h-6 sm:w-6"
          style={{
            color: "#E8C676",
            filter:
              "drop-shadow(0 0 6px rgba(251, 191, 36, 0.55)) drop-shadow(0 0 10px rgba(196, 181, 253, 0.35))",
          }}
          aria-hidden
        />
        <span className="relative mt-1.5 text-sm font-bold tracking-tight sm:mt-2 sm:text-base md:text-lg">
          Coaching
        </span>
        <span
          className="relative mt-0.5 whitespace-nowrap text-[7px] font-semibold uppercase leading-none tracking-[0.06em] sm:mt-1 sm:text-[9px]"
          style={{ color: GUIDE.pinkLight }}
        >
          Available until Saturday
        </span>
      </span>
    </Link>
  );
}

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
    { id: "runes", label: runeData.heading },
    { id: "items", label: itemData.heading, isNew: itemSectionHasNew(itemData) },
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
        <header className="mb-12 flex items-stretch gap-3 px-6 sm:gap-5 sm:px-0">
          <div className="flex min-w-0 flex-1 flex-col justify-center pl-24 sm:pl-28">
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

          <GuideCoachingAd />

        </header>

        <div className="mb-12">
          <TwitchShoutoutSection status={twitchStatus} />
        </div>

        <div className="mt-8">
          <RunePageSection
            data={runeData}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
        </div>

        <div className="mt-16">
          <ItemBuildSection
            data={itemData}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
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

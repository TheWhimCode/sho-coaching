"use client";

import Image from "next/image";
import { FaTwitch } from "react-icons/fa6";
import RunePageSection from "@/app/_components/guides/runes/RunePageSection";
import ItemBuildSection from "@/app/_components/guides/items/ItemBuildSection";
import MatchupSection from "@/app/_components/guides/matchups/MatchupSection";
import CombosSection from "@/app/_components/guides/combos/CombosSection";
import ConventionalBuildSection from "@/app/_components/guides/conventional/ConventionalBuildSection";
import { LINK_TREE_LINKS } from "@/app/_components/linktree/linkTreeLinks";
import { guideChampionIconImgClass, guidePageBg, GUIDE } from "@/lib/guides/guideTheme";
import type { GuideRunePageData } from "@/lib/guides/runeGuideTypes";
import type { GuideItemPageData } from "@/lib/guides/itemGuideTypes";
import type { GuideMatchupPageData } from "@/lib/guides/matchupGuideTypes";
import type { GuideComboPageData, GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";
import type { GuideConventionalBuildPageData } from "@/lib/guides/conventionalBuildGuideTypes";

const TWITCH_URL =
  LINK_TREE_LINKS.find((link) => link.id === "twitch")?.href ??
  "https://www.twitch.tv/itsMinooooo";

export default function ViegoGuideClient({
  runeData,
  itemData,
  conventionalBuildData,
  matchupData,
  comboData,
  viegoAbilityIcons,
  championIcon,
  guideTextIcons,
}: {
  runeData: GuideRunePageData;
  itemData: GuideItemPageData;
  conventionalBuildData: GuideConventionalBuildPageData;
  matchupData: GuideMatchupPageData;
  comboData: GuideComboPageData;
  viegoAbilityIcons: GuideViegoAbilityIcons;
  championIcon: string;
  guideTextIcons: Record<string, string>;
}) {
  return (
    <div className="relative min-h-screen" style={{ color: GUIDE.text }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: guidePageBg }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-20 sm:px-10 sm:pt-24 lg:px-16 lg:pt-28 xl:px-24">
        <header className="mb-12 flex items-center justify-between gap-4 sm:gap-6">
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
                  sizes="96px"
                  priority
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

          <a
            href={TWITCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-[#9146FF]/45 bg-[#9146FF]/10 px-3.5 py-2 text-sm font-semibold text-[#BF94FF] transition hover:border-[#9146FF]/70 hover:bg-[#9146FF]/18 hover:text-[#D9B8FF] sm:px-4 sm:py-2.5 sm:text-base"
          >
            <FaTwitch className="h-4 w-4 shrink-0 text-[#9146FF] transition group-hover:text-[#B794FF] sm:h-5 sm:w-5" aria-hidden />
            Watch me live
          </a>
        </header>

        <RunePageSection data={runeData} guideTextIcons={guideTextIcons} />

        <div className="mt-16">
          <ItemBuildSection data={itemData} guideTextIcons={guideTextIcons} />
        </div>

        <div className="mt-16">
          <ConventionalBuildSection data={conventionalBuildData} guideTextIcons={guideTextIcons} />
        </div>

        <div className="mt-16">
          <MatchupSection data={matchupData} guideTextIcons={guideTextIcons} />
        </div>

        <div className="mt-16">
          <CombosSection
            data={comboData}
            abilityIcons={viegoAbilityIcons}
            guideTextIcons={guideTextIcons}
          />
        </div>
      </div>
    </div>
  );
}

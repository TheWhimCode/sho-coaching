"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import GuideImage from "@/app/_components/guides/GuideImage";
import { MatchupSectionSkeleton } from "@/app/_components/guides/GuideSectionSkeletons";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { useGuideSectionImages } from "@/app/_components/guides/useGuideSectionImages";
import { collectMatchupSectionImageUrls } from "@/lib/guides/preloadGuideImages";
import type {
  GuideMatchupPageData,
  SerializedGuideMatchup,
  SerializedGuideMatchupColumn,
} from "@/lib/guides/matchupGuideTypes";
import { guideChampionIconImgClass } from "@/lib/guides/guideTheme";

const TONE = {
  hard: {
    title: "text-[#F87171]",
    iconRing: "ring-[#F87171]/70",
    cardSelected: "border-[#F87171]/55 bg-[#F87171]/8 ring-1 ring-[#F87171]/25",
    cardIdle: "border-[#F87171]/22 bg-[#1E1724]/55 hover:border-[#F87171]/35 hover:bg-[#F87171]/5",
    nameSelected: "text-[#F87171]",
  },
  easy: {
    title: "text-[#7AADD6]",
    iconRing: "ring-[#7AADD6]/70",
    cardSelected: "border-[#7AADD6]/55 bg-[#7AADD6]/8 ring-1 ring-[#7AADD6]/25",
    cardIdle: "border-[#7AADD6]/22 bg-[#1E1724]/55 hover:border-[#7AADD6]/35 hover:bg-[#7AADD6]/5",
    nameSelected: "text-[#7AADD6]",
  },
} as const;

type Selection = {
  tone: SerializedGuideMatchupColumn["tone"];
  id: string;
};

function MatchupCard({
  matchup,
  tone,
  selected,
  onSelect,
}: {
  matchup: SerializedGuideMatchup;
  tone: SerializedGuideMatchupColumn["tone"];
  selected: boolean;
  onSelect: () => void;
}) {
  const accent = TONE[tone];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "flex min-h-[5.75rem] min-w-0 flex-col items-center justify-center rounded-lg border px-1 transition-all duration-300 ease-out sm:min-h-[6.25rem]",
        selected ? "flex-[1.35] py-2.5" : "flex-1 py-2",
        selected ? accent.cardSelected : accent.cardIdle
      )}
    >
      <div
        className={clsx(
          "relative shrink-0 overflow-hidden rounded-full bg-[#352839]/80 ring-2 transition-all duration-300 ease-out",
          accent.iconRing,
          selected ? "h-9 w-9 sm:h-10 sm:w-10" : "h-8 w-8 sm:h-9 sm:w-9"
        )}
      >
        <GuideImage
          src={matchup.icon}
          alt={matchup.name}
          loading="lazy"
          className={guideChampionIconImgClass}
        />
      </div>
      <span
        className={clsx(
          "mt-1.5 line-clamp-2 w-full text-center font-medium leading-tight text-[#F5E6D3]/88 transition-all duration-300 ease-out",
          selected ? "text-[0.62rem] sm:text-xs" : "text-[0.58rem] sm:text-[0.62rem]"
        )}
      >
        {matchup.name}
      </span>
    </button>
  );
}

function MatchupGroup({
  column,
  selection,
  onSelect,
}: {
  column: SerializedGuideMatchupColumn;
  selection: Selection;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {column.matchups.map((matchup) => (
        <MatchupCard
          key={matchup.id}
          matchup={matchup}
          tone={column.tone}
          selected={selection.tone === column.tone && selection.id === matchup.id}
          onSelect={() => onSelect(matchup.id)}
        />
      ))}
    </>
  );
}

export default function MatchupSection({
  data,
  guideTextIcons = {},
}: {
  data: GuideMatchupPageData;
  guideTextIcons?: Record<string, string>;
}) {
  const hardColumn = data.columns.find((column) => column.tone === "hard") ?? data.columns[0];
  const easyColumn =
    data.columns.find((column) => column.tone === "easy") ?? data.columns[1] ?? hardColumn;

  const [selection, setSelection] = useState<Selection>({
    tone: hardColumn.tone,
    id: hardColumn.matchups[0]?.id ?? "",
  });

  const matchupImageUrls = useMemo(() => collectMatchupSectionImageUrls(data), [data]);
  const { sectionRef, shouldLoad, imagesReady } = useGuideSectionImages(matchupImageUrls);

  const selectedMatchup = useMemo(() => {
    const column = selection.tone === "hard" ? hardColumn : easyColumn;
    return column.matchups.find((matchup) => matchup.id === selection.id) ?? hardColumn.matchups[0];
  }, [easyColumn, hardColumn, selection.id, selection.tone]);

  const selectedAccent = TONE[selection.tone];
  const showContent = shouldLoad && imagesReady;

  return (
    <section
      ref={sectionRef}
      id="matchups"
      className="scroll-mt-24 w-full"
      aria-busy={shouldLoad && !imagesReady}
    >
      {!shouldLoad ? (
        <MatchupSectionSkeleton data={data} />
      ) : (
      <div className="grid">
        <div
          className={clsx(
            "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
            showContent ? "pointer-events-none opacity-0" : "opacity-100"
          )}
        >
          <MatchupSectionSkeleton data={data} />
        </div>

        <div
          className={clsx(
            "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
            showContent ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!showContent}
        >
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        {[hardColumn, easyColumn].map((column) => {
          const accent = TONE[column.tone];
          return (
            <div key={column.id} className="min-w-0">
              <h2
                className={clsx(
                  "text-sm font-bold uppercase tracking-[0.14em] sm:text-base",
                  accent.title
                )}
              >
                {column.label}
              </h2>
              <p className="mt-1.5 text-xs text-[#F5E6D3]/48 sm:text-sm">{column.subtitle}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex w-full items-end gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-end justify-between gap-1 sm:gap-1.5">
          <MatchupGroup
            column={hardColumn}
            selection={selection}
            onSelect={(id) => setSelection({ tone: "hard", id })}
          />
        </div>

        <div aria-hidden className="mb-2 w-px shrink-0 self-stretch bg-[#F0ABCF]/14" />

        <div className="flex min-w-0 flex-1 items-end justify-between gap-1 sm:gap-1.5">
          <MatchupGroup
            column={easyColumn}
            selection={selection}
            onSelect={(id) => setSelection({ tone: "easy", id })}
          />
        </div>
      </div>

      {selectedMatchup ? (
        <div className="mt-5 w-full rounded-xl border border-[#F0ABCF]/12 bg-[#1E1724]/55 p-4 sm:p-5">
          <div className="flex items-start gap-4 sm:gap-5">
            <div
              className={clsx(
                "relative h-[4.2rem] w-[4.2rem] shrink-0 overflow-hidden rounded-lg bg-[#352839]/80 ring-1 sm:h-[4.9rem] sm:w-[4.9rem]",
                selection.tone === "hard" ? "ring-[#F87171]/35" : "ring-[#7AADD6]/35"
              )}
            >
              <GuideImage
                src={selectedMatchup.icon}
                alt={selectedMatchup.name}
                loading="lazy"
                className={guideChampionIconImgClass}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={clsx(
                  "text-sm font-semibold leading-none sm:text-base",
                  selectedAccent.nameSelected
                )}
              >
                {selectedMatchup.name}
              </p>
              <div className="mt-2 text-sm leading-[1.7] text-[#F5E6D3]/62 sm:text-base">
                {selectedMatchup.explanation.split("\n").map((paragraph, index) => (
                  <p key={index} className={index > 0 ? "mt-[0.5em]" : undefined}>
                    {renderGuideHighlightedText(paragraph, guideTextIcons)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
        </div>
      </div>
      )}
    </section>
  );
}

"use client";

import clsx from "clsx";
import { useState } from "react";
import ComboSequenceBar from "@/app/_components/guides/combos/ComboSequenceBar";
import GuideVideoPanel from "@/app/_components/guides/GuideVideoPanel";
import { renderGuideHighlightedTextWithViegoAbilities } from "@/app/_components/guides/guideTextHighlights";
import { guideInnerPanelClass, guideMobileFlushPanelClass, guideSectionHeaderPadClass, guideSectionTitleClass } from "@/lib/guides/guideTheme";
import type { GuideComboPageData, GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";

const comboListButtonClass =
  "w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold tracking-wide transition sm:px-4 sm:py-3 sm:text-sm";

const comboMobileGridButtonClass =
  "flex w-full min-h-[3.5rem] items-center justify-center border border-[#F0ABCF]/12 px-2 py-3 text-center text-xs font-semibold tracking-wide transition";

function comboGridCellClass({
  index,
  active,
}: {
  index: number;
  active: boolean;
}) {
  const colIdx = index % 2;
  const isLeftCol = colIdx === 0;
  const isRightCol = colIdx === 1;

  return clsx(
    comboMobileGridButtonClass,
    isLeftCol && "border-l-0",
    isRightCol && "border-r-0",
    active
      ? "relative z-[1] bg-[#F0ABCF]/10 text-[#FAD4E8] ring-1 ring-inset ring-[#F0ABCF]/25"
      : "bg-[#16121A]/40 text-[#F5E6D3]/55"
  );
}

function ComboListSidebar({
  combos,
  selectedId,
  onSelect,
}: {
  combos: GuideComboPageData["combos"];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const paddedCount = combos.length + (combos.length % 2);

  return (
    <>
      <p className="mb-3 hidden text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:block sm:text-xs">
        Select combo
      </p>

      <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 sm:static sm:w-full sm:max-w-full sm:translate-x-0">
        <div className="grid grid-cols-2 isolate sm:hidden">
        {Array.from({ length: paddedCount }, (_, index) => {
          const combo = combos[index];
          if (!combo) {
            const colIdx = index % 2;
            const isLeftCol = colIdx === 0;
            const isRightCol = colIdx === 1;

            return (
              <div
                key={`combo-grid-pad-${index}`}
                aria-hidden
                className={clsx(
                  "min-h-[3.5rem] border border-[#F0ABCF]/12 bg-[#16121A]/20",
                  isLeftCol && "border-l-0",
                  isRightCol && "border-r-0"
                )}
              />
            );
          }

          const active = combo.id === selectedId;
          return (
            <button
              key={combo.id}
              type="button"
              onClick={() => onSelect(combo.id)}
              className={comboGridCellClass({
                index,
                active,
              })}
              aria-pressed={active}
            >
              {combo.label}
            </button>
          );
        })}
        </div>
      </div>

      <div className="hidden flex-col gap-2 sm:flex">
        {combos.map((combo) => {
          const active = combo.id === selectedId;
          return (
            <button
              key={combo.id}
              type="button"
              onClick={() => onSelect(combo.id)}
              className={clsx(
                comboListButtonClass,
                active
                  ? "border-[#F0ABCF]/40 bg-[#F0ABCF]/10 text-[#FAD4E8] ring-1 ring-[#F0ABCF]/25"
                  : "border-[#F0ABCF]/12 bg-[#16121A]/40 text-[#F5E6D3]/55 hover:border-[#F0ABCF]/22 hover:bg-[#F0ABCF]/5 hover:text-[#F5E6D3]/78"
              )}
              aria-pressed={active}
            >
              {combo.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function CombosSection({
  data,
  abilityIcons,
  guideTextIcons = {},
}: {
  data: GuideComboPageData;
  abilityIcons: GuideViegoAbilityIcons;
  guideTextIcons?: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState(data.combos[0]?.id ?? "");
  const selected =
    data.combos.find((combo) => combo.id === selectedId) ?? data.combos[0];

  if (!selected) return null;

  const hasIngameVideo =
    selected.ingameExampleVideoSrc ||
    selected.ingameExampleVideoEmbedUrl ||
    selected.ingamePosterSrc;

  return (
    <section id="combos" className="scroll-mt-24 w-full min-w-0 max-w-full overflow-x-hidden sm:overflow-visible">
      <div className={clsx("mb-6", guideSectionHeaderPadClass)}>
        <h2 className={guideSectionTitleClass}>{data.heading}</h2>
        {data.subtitle ? (
          <p className="mt-2 text-sm text-[#F5E6D3]/55 sm:text-base">{data.subtitle}</p>
        ) : null}
      </div>

      <div
        className={clsx(
          guideInnerPanelClass,
          guideMobileFlushPanelClass,
          "overflow-hidden max-sm:!border-0 max-sm:!bg-transparent max-sm:!p-0 sm:p-0"
        )}
      >
        <div className="flex flex-col lg:flex-row">
          <div className="max-sm:p-0 sm:border-b sm:border-[#F0ABCF]/12 sm:py-5 sm:pl-4 sm:pr-6 lg:w-[min(100%,16rem)] lg:shrink-0 lg:border-b-0 lg:border-r lg:pl-4 lg:pr-8 xl:w-64">
            <ComboListSidebar
              combos={data.combos}
              selectedId={selected.id}
              onSelect={setSelectedId}
            />
          </div>

          <div className="min-w-0 flex-1 px-6 pb-4 pt-4 sm:p-6 lg:py-4 lg:pl-8 lg:pr-4">
            {selected.sequence?.length ? (
              <ComboSequenceBar sequence={selected.sequence} abilityIcons={abilityIcons} />
            ) : null}
            <h3 className="text-base font-semibold text-[#FAD4E8]/90 sm:text-lg">
              {selected.label}
            </h3>
            <div className="mt-4">
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                Combo clip
              </p>
              <GuideVideoPanel
                key={`${selected.id}-clip`}
                videoSrc={selected.videoSrc}
                posterSrc={selected.posterSrc}
                embedUrl={selected.videoEmbedUrl}
                title={`${selected.label} combo clip`}
              />
            </div>
            <div className="mt-5 text-sm leading-[1.75] text-[#F5E6D3]/62 sm:text-base">
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                When to use it
              </p>
              {selected.explanation.split("\n").map((paragraph, index) => (
                <p key={index} className={index > 0 ? "mt-[0.5em]" : undefined}>
                  {renderGuideHighlightedTextWithViegoAbilities(
                    paragraph,
                    guideTextIcons,
                    abilityIcons
                  )}
                </p>
              ))}
            </div>
            {hasIngameVideo ? (
              <div className="mt-5">
                <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                  Ingame example
                </p>
                <GuideVideoPanel
                  key={`${selected.id}-ingame`}
                  videoSrc={selected.ingameExampleVideoSrc}
                  posterSrc={selected.ingamePosterSrc}
                  embedUrl={selected.ingameExampleVideoEmbedUrl}
                  title={`${selected.label} ingame example`}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

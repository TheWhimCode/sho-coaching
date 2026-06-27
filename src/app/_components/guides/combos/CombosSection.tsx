"use client";

import clsx from "clsx";
import { useState } from "react";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { guideInnerPanelClass, guideSectionTitleClass } from "@/lib/guides/guideTheme";
import type { GuideComboPageData } from "@/lib/guides/comboGuideTypes";

const comboListButtonClass =
  "w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold tracking-wide transition sm:px-5 sm:py-3.5 sm:text-base";

function ComboVideoPanel({ embedUrl }: { embedUrl?: string | null }) {
  if (embedUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-[#F0ABCF]/15 bg-black ring-1 ring-[#B8D8EA]/10">
        <iframe
          src={embedUrl}
          title="Combo video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-[#F0ABCF]/20 bg-[#1E1724]/55 ring-1 ring-[#B8D8EA]/10">
      <p className="text-sm text-[#F5E6D3]/38 sm:text-base">Video coming soon</p>
    </div>
  );
}

export default function CombosSection({
  data,
  guideTextIcons = {},
}: {
  data: GuideComboPageData;
  guideTextIcons?: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState(data.combos[0]?.id ?? "");
  const selected =
    data.combos.find((combo) => combo.id === selectedId) ?? data.combos[0];

  if (!selected) return null;

  return (
    <section id="combos" className="scroll-mt-24">
      <div className="mb-6">
        <h2 className={guideSectionTitleClass}>{data.heading}</h2>
        {data.subtitle ? (
          <p className="mt-2 text-sm text-[#F5E6D3]/55 sm:text-base">{data.subtitle}</p>
        ) : null}
      </div>

      <div className={clsx(guideInnerPanelClass, "overflow-hidden p-0 sm:p-0")}>
        <div className="flex flex-col lg:flex-row">
          <div className="border-b border-[#F0ABCF]/12 p-4 sm:p-5 lg:w-[min(100%,16rem)] lg:shrink-0 lg:border-b-0 lg:border-r xl:w-60">
            <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
              Select combo
            </p>
            <div className="flex flex-col gap-2">
              {data.combos.map((combo) => {
                const active = combo.id === selected.id;
                return (
                  <button
                    key={combo.id}
                    type="button"
                    onClick={() => setSelectedId(combo.id)}
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
          </div>

          <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <h3 className="text-base font-semibold text-[#FAD4E8]/90 sm:text-lg">
              {selected.label}
            </h3>
            <div className="mt-4">
              <ComboVideoPanel embedUrl={selected.videoEmbedUrl} />
            </div>
            <div className="mt-5 text-sm leading-[1.75] text-[#F5E6D3]/62 sm:text-base">
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                When to use it
              </p>
              {selected.explanation.split("\n").map((paragraph, index) => (
                <p key={index} className={index > 0 ? "mt-[0.5em]" : undefined}>
                  {renderGuideHighlightedText(paragraph, guideTextIcons)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import type { GuideConventionalBuildPageData } from "@/lib/guides/conventionalBuildGuideTypes";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";

const conventionalPanelClass =
  "overflow-hidden rounded-2xl border border-[#F0ABCF]/15 bg-[#2A1F2E]/75 px-6 py-8 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm sm:px-10 sm:py-10 lg:px-14 lg:py-12";

export default function ConventionalBuildSection({
  data,
  guideTextIcons,
}: {
  data: GuideConventionalBuildPageData;
  guideTextIcons: Record<string, string>;
}) {
  return (
    <section id="conventional-build" className="scroll-mt-24">
      <div className={conventionalPanelClass}>
        <h2 className="text-xl font-bold tracking-tight text-[#FAD4E8]/90 sm:text-2xl">
          {data.heading}
        </h2>
        <div className="mt-4 space-y-4">
          {data.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-sm leading-[1.75] text-[#F5E6D3]/62 sm:text-base"
            >
              {renderGuideHighlightedText(paragraph, guideTextIcons)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

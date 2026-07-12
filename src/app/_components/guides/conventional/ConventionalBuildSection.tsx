"use client";

import clsx from "clsx";
import { ConventionalBuildSectionSkeleton } from "@/app/_components/guides/GuideSectionSkeletons";
import { GuidePawIcon, renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { useGuideSectionImages } from "@/app/_components/guides/useGuideSectionImages";
import type { GuideConventionalBuildPageData } from "@/lib/guides/conventionalBuildGuideTypes";

const conventionalPanelClass =
  "overflow-hidden rounded-none border border-[#F0ABCF]/15 border-x-0 bg-[#2A1F2E]/75 px-6 py-8 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm sm:rounded-2xl sm:border-x sm:px-10 sm:py-10 lg:px-14 lg:py-12";

export default function ConventionalBuildSection({
  data,
  guideTextIcons,
}: {
  data: GuideConventionalBuildPageData;
  guideTextIcons: Record<string, string>;
}) {
  const { sectionRef, shouldLoad, imagesReady } = useGuideSectionImages([]);
  const showContent = shouldLoad && imagesReady;

  return (
    <section
      ref={sectionRef}
      id="conventional-build"
      className="scroll-mt-24"
      aria-busy={shouldLoad && !imagesReady}
    >
      {!shouldLoad ? (
        <ConventionalBuildSectionSkeleton data={data} />
      ) : (
        <div className="grid">
          {!showContent ? (
            <div className="col-start-1 row-start-1 transition-opacity duration-300 ease-out">
              <ConventionalBuildSectionSkeleton data={data} />
            </div>
          ) : null}

          <div
            className={clsx(
              "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
              showContent ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!showContent}
          >
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
                    {paragraph.trimEnd().endsWith("Meow.") ? <GuidePawIcon /> : null}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

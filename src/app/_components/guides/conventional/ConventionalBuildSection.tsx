"use client";

import { guidePanelClass } from "@/lib/guides/guideTheme";
import type { GuideConventionalBuildPageData } from "@/lib/guides/conventionalBuildGuideTypes";

export default function ConventionalBuildSection({
  data,
}: {
  data: GuideConventionalBuildPageData;
}) {
  return (
    <section id="conventional-build" className="scroll-mt-24">
      <div className={guidePanelClass}>
        <h2 className="text-xl font-bold tracking-tight text-[#FAD4E8]/90 sm:text-2xl">
          {data.heading}
        </h2>
        <div className="mt-4 space-y-4">
          {data.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-sm leading-[1.75] text-[#F5E6D3]/62 sm:text-base"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

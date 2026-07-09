"use client";

import clsx from "clsx";
import { Fragment } from "react";
import {
  ArrowDown,
  ArrowRight,
  Ban,
  Crosshair,
  Heart,
  Hourglass,
  Shield,
  Swords,
  Zap,
} from "lucide-react";
import GuideImage from "@/app/_components/guides/GuideImage";
import { guideComboAbilityIconClass } from "@/app/_components/guides/combos/ComboSequenceBar";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import {
  guideMobileFlushPanelClass,
  guideRuneOuterPanelClass,
  guideSectionHeaderPadClass,
  guideSectionSubClass,
  guideSectionTitleClass,
} from "@/lib/guides/guideTheme";
import type {
  GuidePossessionPageData,
  GuidePossessionRule,
  GuidePossessionRuleIcon,
} from "@/lib/guides/possessionGuideTypes";
import type { GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";

const RULE_ICON_CLASS = "size-9 shrink-0 rounded-lg border p-2 sm:size-10";

function RuleIcon({
  icon,
  positive,
}: {
  icon: GuidePossessionRuleIcon;
  positive: boolean;
}) {
  const tone = positive
    ? "border-[#F0ABCF]/28 bg-[#F0ABCF]/10 text-[#FAD4E8]"
    : "border-[#F0ABCF]/14 bg-[#16121A]/55 text-[#F5E6D3]/50";

  const props = { className: clsx(RULE_ICON_CLASS, tone), strokeWidth: 2, "aria-hidden": true };

  switch (icon) {
    case "mobility":
      return <Zap {...props} />;
    case "burst":
      return <Swords {...props} />;
    case "cc":
      return <Shield {...props} />;
    case "survive":
      return <Heart {...props} />;
    case "no-reach":
      return <Ban {...props} />;
    case "no-damage":
      return <Crosshair {...props} />;
    case "low-hp":
      return <Heart {...props} />;
    case "hold-r":
      return <Hourglass {...props} />;
  }
}

function PossessionRuleCard({
  rule,
  positive,
  guideTextIcons,
}: {
  rule: GuidePossessionRule;
  positive: boolean;
  guideTextIcons: Record<string, string>;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-xl border px-3 py-3 sm:gap-3.5 sm:px-4 sm:py-3.5",
        positive
          ? "border-[#F0ABCF]/18 bg-[#1E1724]/45"
          : "border-[#F0ABCF]/10 bg-[#16121A]/35"
      )}
    >
      <RuleIcon icon={rule.icon} positive={positive} />
      <p className="min-w-0 flex-1 text-sm leading-snug text-[#F5E6D3]/75 sm:text-[0.95rem]">
        {renderGuideHighlightedText(rule.text, guideTextIcons)}
      </p>
    </div>
  );
}

function PossessionFlow({
  data,
  abilityIcons,
}: {
  data: GuidePossessionPageData;
  abilityIcons: GuideViegoAbilityIcons;
}) {
  return (
    <div className="border-b border-[#F0ABCF]/10 px-6 py-8 sm:px-10 sm:py-10">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/80 sm:text-xs">
        {data.howItWorksHeading}
      </p>
      {data.howItWorksNote ? (
        <p className="mt-2 text-sm text-[#F5E6D3]/55 sm:text-base">{data.howItWorksNote}</p>
      ) : null}

      <ol className="mt-6 list-none sm:mt-8">
        <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
          {data.flow.map((step, index) => (
            <Fragment key={step.id}>
              {index > 0 ? (
                <>
                  <ArrowDown
                    className="size-4 shrink-0 text-[#F0ABCF]/35 lg:hidden"
                    aria-hidden
                  />
                  <ArrowRight
                    className="hidden size-4 shrink-0 text-[#F0ABCF]/35 lg:mt-5 lg:block"
                    aria-hidden
                  />
                </>
              ) : null}
              <li className="flex w-full max-w-[11rem] flex-col items-center gap-2.5 text-center lg:w-auto">
                {step.highlightR ? (
                  <div className="relative shrink-0">
                    <GuideImage
                      src={abilityIcons.R}
                      alt="Viego R"
                      className={guideComboAbilityIconClass}
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 rounded-md border border-[#F0ABCF]/25 bg-[#16121A]/92 px-1.5 py-0.5 text-[0.62rem] font-bold leading-none text-[#FAD4E8]">
                      R
                    </span>
                  </div>
                ) : (
                  <div
                    className={clsx(
                      guideComboAbilityIconClass,
                      "flex items-center justify-center border border-[#F0ABCF]/18 bg-[#16121A]/70 text-xs font-bold text-[#FAD4E8]/80"
                    )}
                  >
                    {index + 1}
                  </div>
                )}
                <p className="text-sm font-medium leading-snug text-[#FAD4E8] sm:text-[0.95rem]">
                  {step.label}
                </p>
              </li>
            </Fragment>
          ))}
        </div>
      </ol>
    </div>
  );
}

export default function PossessionsSection({
  data,
  abilityIcons,
  guideTextIcons = {},
}: {
  data: GuidePossessionPageData;
  abilityIcons: GuideViegoAbilityIcons;
  guideTextIcons?: Record<string, string>;
}) {
  return (
    <section
      id="possessions"
      className="scroll-mt-24 w-full min-w-0 max-w-full overflow-x-hidden sm:overflow-visible"
    >
      <div className={clsx("mb-6", guideSectionHeaderPadClass)}>
        <h2 className={guideSectionTitleClass}>{data.heading}</h2>
        {data.subtitle ? <p className={guideSectionSubClass}>{data.subtitle}</p> : null}
      </div>

      <div
        className={clsx(
          guideRuneOuterPanelClass,
          guideMobileFlushPanelClass,
          "overflow-hidden p-0 sm:p-0"
        )}
      >
        <PossessionFlow data={data} abilityIcons={abilityIcons} />

        <div className="grid gap-6 px-6 py-8 sm:gap-8 sm:px-10 sm:py-10 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/80 sm:text-xs">
              {data.strongHeading}
            </p>
            <div className="grid gap-2.5 sm:gap-3">
              {data.strongRules.map((rule) => (
                <PossessionRuleCard
                  key={rule.id}
                  rule={rule}
                  positive
                  guideTextIcons={guideTextIcons}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/80 sm:text-xs">
              {data.skipHeading}
            </p>
            <div className="grid gap-2.5 sm:gap-3">
              {data.skipRules.map((rule) => (
                <PossessionRuleCard
                  key={rule.id}
                  rule={rule}
                  positive={false}
                  guideTextIcons={guideTextIcons}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

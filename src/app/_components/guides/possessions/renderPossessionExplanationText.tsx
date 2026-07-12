"use client";

import clsx from "clsx";
import { Fragment, type ReactNode } from "react";
import { renderGuideHighlightedText, stripTrailingPeriodAfterInlineIcon } from "@/app/_components/guides/guideTextHighlights";
import type { GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";
import type { GuideChampionAbilityIcons } from "@/lib/guides/possessionGuideTypes";

const POSSESSION_ABILITY_TOKEN_RE = /\s*->\s*|\b([QWER])\b/g;

const possessionInlineAbilityIconClass =
  "size-4 shrink-0 rounded-sm object-cover ring-1 ring-[#B8D8EA]/20 sm:size-[1.125rem]";

type PossessionExplanationToken =
  | { kind: "text"; value: string }
  | { kind: "ability"; key: "Q" | "W" | "E" | "R" }
  | { kind: "arrow" };

function tokenizePossessionExplanation(text: string): PossessionExplanationToken[] {
  const tokens: PossessionExplanationToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  POSSESSION_ABILITY_TOKEN_RE.lastIndex = 0;
  while ((match = POSSESSION_ABILITY_TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      tokens.push({ kind: "ability", key: match[1] as "Q" | "W" | "E" | "R" });
    } else {
      tokens.push({ kind: "arrow" });
    }

    lastIndex = POSSESSION_ABILITY_TOKEN_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

function PossessionInlineAbility({
  label,
  src,
  alt,
}: {
  label: string;
  src: string;
  alt: string;
}) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-0.5 align-middle">
      <span className="text-[0.7rem] font-bold leading-none text-[#FAD4E8] sm:text-xs">
        {label}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={possessionInlineAbilityIconClass} />
    </span>
  );
}

function renderPossessionAbilityToken(
  key: "Q" | "W" | "E" | "R",
  championName: string,
  championAbilityIcons: GuideChampionAbilityIcons,
  viegoAbilityIcons: GuideViegoAbilityIcons
): ReactNode {
  if (key === "R") {
    const src = viegoAbilityIcons.R;
    if (!src) return key;

    return (
      <PossessionInlineAbility label={key} src={src} alt="Viego R" />
    );
  }

  const src = championAbilityIcons[key];
  if (!src) return key;

  return (
    <PossessionInlineAbility
      label={key}
      src={src}
      alt={`${championName} ${key}`}
    />
  );
}

export function renderPossessionExplanationText(
  text: string,
  championName: string,
  championAbilityIcons: GuideChampionAbilityIcons,
  viegoAbilityIcons: GuideViegoAbilityIcons,
  guideTextIcons: Record<string, string> = {}
): ReactNode {
  const tokens = tokenizePossessionExplanation(
    stripTrailingPeriodAfterInlineIcon(text)
  );

  return tokens.map((token, index) => {
    if (token.kind === "arrow") {
      return (
        <span
          key={`arrow-${index}`}
          className={clsx(
            "mx-0.5 inline-flex select-none items-center align-middle font-semibold text-[#B8D8EA]/85"
          )}
          aria-hidden
        >
          ›
        </span>
      );
    }

    if (token.kind === "ability") {
      return (
        <Fragment key={`ability-${index}`}>
          {renderPossessionAbilityToken(
            token.key,
            championName,
            championAbilityIcons,
            viegoAbilityIcons
          )}
        </Fragment>
      );
    }

    return (
      <Fragment key={`text-${index}`}>
        {renderGuideHighlightedText(token.value, guideTextIcons)}
      </Fragment>
    );
  });
}

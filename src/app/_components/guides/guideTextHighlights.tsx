"use client";

import clsx from "clsx";

const GUIDE_PAW_SRC = "/images/guide/paw.png";
import { Fragment, type ReactNode } from "react";
import { flattenGuideTextEntities, GUIDE_TEXT_ENTITIES, isCaseSensitiveGuideRegexPattern } from "@/lib/guides/guideTextEntities";
import type { GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";

export const GUIDE_CONQUEROR_ORANGE = "#F97316";
export const GUIDE_DARK_RED = "#B01212";

const GUIDE_TEXT_TERMS = flattenGuideTextEntities();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type GuideTermMatch = { start: number; end: number; text: string };

function findGuideTermMatches(text: string): GuideTermMatch[] {
  const spans: GuideTermMatch[] = [];

  for (const term of GUIDE_TEXT_TERMS) {
    const body = term.regex ? term.pattern : escapeRegex(term.pattern);
    const flags = term.caseSensitive ? "g" : "gi";
    const re = new RegExp(body, flags);
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = spans.some((span) => start < span.end && end > span.start);
      if (!overlaps) {
        spans.push({ start, end, text: match[0] });
      }
      if (match[0].length === 0) {
        re.lastIndex += 1;
      }
    }
  }

  spans.sort((a, b) => a.start - b.start);
  return spans;
}

const TRAILING_ABILITY_BEFORE_PERIOD_RE = /(?:\s*(?:->|>)\s*)*\b[QWER]\.$/;

/** Drop a sentence-ending period when it immediately follows an inline icon term. */
export function stripTrailingPeriodAfterInlineIcon(text: string): string {
  if (!text.endsWith(".")) return text;

  if (TRAILING_ABILITY_BEFORE_PERIOD_RE.test(text)) {
    return text.slice(0, -1);
  }

  const withoutPeriod = text.slice(0, -1);
  const matches = findGuideTermMatches(withoutPeriod);
  const lastMatch = matches.at(-1);
  if (lastMatch?.end === withoutPeriod.length) {
    const entity = resolveEntity(lastMatch.text);
    if (entity?.icon) return withoutPeriod;
  }

  return text;
}

function splitGuideHighlightedText(text: string): string[] {
  if (!text) return [];

  const matches = findGuideTermMatches(text);
  if (matches.length === 0) return [text];

  const parts: string[] = [];
  let pos = 0;

  for (const match of matches) {
    if (match.start > pos) {
      parts.push(text.slice(pos, match.start));
    }
    parts.push(match.text);
    pos = match.end;
  }

  if (pos < text.length) {
    parts.push(text.slice(pos));
  }

  return parts;
}

/** All-caps words in prose (AND, MEGA, DPS, …) — not single letters like Q/R. */
const ALL_CAPS_WORD_REGEX = /\b[A-Z]{2,}(?:'[A-Z]+)?\b/g;

function renderPlainWithCapsBold(text: string, segmentKey: number): ReactNode {
  ALL_CAPS_WORD_REGEX.lastIndex = 0;
  if (!ALL_CAPS_WORD_REGEX.test(text)) return text;

  ALL_CAPS_WORD_REGEX.lastIndex = 0;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = ALL_CAPS_WORD_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <span key={`${segmentKey}-caps-${partIndex++}`} className="font-bold">
        {match[0]}
      </span>
    );
    lastIndex = ALL_CAPS_WORD_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

const CURLY_QUOTE_RE = /“([^”]+)”/g;

function renderPlainWithQuotesAndCaps(text: string, segmentKey: number): ReactNode {
  CURLY_QUOTE_RE.lastIndex = 0;
  if (!CURLY_QUOTE_RE.test(text)) {
    return renderPlainWithCapsBold(text, segmentKey);
  }

  CURLY_QUOTE_RE.lastIndex = 0;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = CURLY_QUOTE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${segmentKey}-pre-${partIndex}`}>
          {renderPlainWithCapsBold(text.slice(lastIndex, match.index), segmentKey * 100 + partIndex)}
        </Fragment>
      );
    }
    nodes.push(
      <em key={`${segmentKey}-quote-${partIndex++}`} className="italic">
        “{match[1]}”
      </em>
    );
    lastIndex = CURLY_QUOTE_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${segmentKey}-post`}>
        {renderPlainWithCapsBold(text.slice(lastIndex), segmentKey * 100 + 99)}
      </Fragment>
    );
  }

  return nodes;
}

function resolveEntity(part: string) {
  const lower = part.toLowerCase();
  for (const entity of GUIDE_TEXT_ENTITIES) {
    for (const pattern of entity.patterns) {
      if (pattern.startsWith("\\b")) {
        const flags = isCaseSensitiveGuideRegexPattern(pattern) ? "" : "i";
        if (new RegExp(`^${pattern}$`, flags).test(part)) return entity;
      } else if (pattern.toLowerCase() === lower) {
        return entity;
      }
    }
  }
  return undefined;
}

function GuideInlineIcon({ src, compact }: { src: string; compact?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={clsx(
        "inline-block shrink-0 object-contain",
        compact ? "size-3 sm:size-3.5" : "size-4 sm:size-5"
      )}
    />
  );
}

function renderColoredPart(
  part: string,
  entity: (typeof GUIDE_TEXT_ENTITIES)[number],
  icon: string | undefined,
  index: number
) {
  const weight = entity.weight ?? 700;
  const suffix = entity.colorSuffix;
  const displayText = entity.displayAs ?? part;

  if (suffix && entity.color && part.toLowerCase().endsWith(suffix.toLowerCase())) {
    const prefix = displayText.slice(0, displayText.length - suffix.length);
    const colored = displayText.slice(displayText.length - suffix.length);

    return (
      <span key={index} className="inline align-baseline">
        {prefix}
        <span className="font-bold" style={{ color: entity.color, fontWeight: weight }}>
          {colored}
        </span>
        {icon ? <GuideInlineIcon src={icon} compact={entity.icon?.kind === "stat"} /> : null}
      </span>
    );
  }

  const hasStyle = entity.boldOnly || entity.color;

  if (!hasStyle && icon) {
    return (
      <span key={index} className="inline align-baseline">
        {displayText}
        <GuideInlineIcon src={icon} compact={entity.icon?.kind === "stat"} />
      </span>
    );
  }

  return (
    <span key={index} className="inline align-baseline">
      <span
        className={hasStyle ? "font-bold" : undefined}
        style={
          entity.boldOnly
            ? { fontWeight: weight }
            : entity.color
              ? { color: entity.color, fontWeight: weight }
              : undefined
        }
      >
        {displayText}
      </span>
      {icon ? <GuideInlineIcon src={icon} compact={entity.icon?.kind === "stat"} /> : null}
    </span>
  );
}

export function renderGuideHighlightedText(
  text: string,
  termIcons: Record<string, string> = {}
): ReactNode[] {
  return splitGuideHighlightedText(stripTrailingPeriodAfterInlineIcon(text)).map((part, index) => {
    if (!part) return null;

    const entity = resolveEntity(part);
    if (entity) {
      const icon = entity.icon ? termIcons[entity.matchKey] : undefined;
      return renderColoredPart(part, entity, icon, index);
    }

    return <Fragment key={index}>{renderPlainWithQuotesAndCaps(part, index)}</Fragment>;
  });
}

const VIEGO_ABILITY_TOKEN_RE = /\s*(?:->|>)\s*|\b([QWER])\b/g;

const guideInlineViegoAbilityIconClass =
  "size-4 shrink-0 rounded-sm object-cover ring-1 ring-[#B8D8EA]/20 sm:size-5";

type ViegoAbilityTextToken =
  | { kind: "text"; value: string }
  | { kind: "ability"; key: "Q" | "W" | "E" | "R" }
  | { kind: "arrow" };

function tokenizeViegoAbilityText(text: string): ViegoAbilityTextToken[] {
  const tokens: ViegoAbilityTextToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  VIEGO_ABILITY_TOKEN_RE.lastIndex = 0;
  while ((match = VIEGO_ABILITY_TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      tokens.push({ kind: "ability", key: match[1] as "Q" | "W" | "E" | "R" });
    } else {
      tokens.push({ kind: "arrow" });
    }

    lastIndex = VIEGO_ABILITY_TOKEN_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

function GuideInlineViegoAbility({
  label,
  src,
  tokenIndex,
}: {
  label: string;
  src: string;
  tokenIndex: number;
}) {
  return (
    <span
      key={`viego-ability-${tokenIndex}`}
      className="mx-0.5 inline-flex items-center gap-0.5 align-middle"
    >
      <span className="text-[0.7rem] font-bold leading-none text-[#FAD4E8] sm:text-xs">
        {label}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Viego ${label}`} className={guideInlineViegoAbilityIconClass} />
    </span>
  );
}

export function renderGuideHighlightedTextWithViegoAbilities(
  text: string,
  termIcons: Record<string, string> = {},
  viegoAbilityIcons: GuideViegoAbilityIcons
): ReactNode {
  const tokens = tokenizeViegoAbilityText(stripTrailingPeriodAfterInlineIcon(text));

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
      const src = viegoAbilityIcons[token.key];
      if (!src) return token.key;

      return (
        <GuideInlineViegoAbility
          key={`ability-${index}`}
          label={token.key}
          src={src}
          tokenIndex={index}
        />
      );
    }

    return (
      <Fragment key={`text-${index}`}>
        {renderGuideHighlightedText(token.value, termIcons)}
      </Fragment>
    );
  });
}

export function GuidePawIcon() {
  return (
    <span
      aria-hidden
      className="relative -top-0.5 ml-1.5 inline-block size-5 shrink-0 -rotate-[30deg] bg-[#F0ABCF] align-middle mask-contain mask-center mask-no-repeat sm:-top-1 sm:size-[1.35rem]"
      style={{
        WebkitMaskImage: `url(${GUIDE_PAW_SRC})`,
        maskImage: `url(${GUIDE_PAW_SRC})`,
      }}
    />
  );
}

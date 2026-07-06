"use client";

import clsx from "clsx";

const GUIDE_PAW_SRC = "/images/guide/paw.png";
import { Fragment, type ReactNode } from "react";
import { flattenGuideTextEntities, GUIDE_TEXT_ENTITIES, isCaseSensitiveGuideRegexPattern } from "@/lib/guides/guideTextEntities";

export const GUIDE_CONQUEROR_ORANGE = "#F97316";
export const GUIDE_DARK_RED = "#B01212";

const GUIDE_TEXT_TERMS = flattenGuideTextEntities();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HIGHLIGHT_REGEX = new RegExp(
  `(${GUIDE_TEXT_TERMS.map(({ pattern, regex, caseSensitive }) => {
    const body = regex ? pattern : escapeRegex(pattern);
    return caseSensitive ? `(?-i:${body})` : body;
  }).join("|")})`,
  "gi"
);

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

  if (suffix && entity.color && part.toLowerCase().endsWith(suffix.toLowerCase())) {
    const prefix = part.slice(0, part.length - suffix.length);
    const colored = part.slice(part.length - suffix.length);

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
        {part}
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
        {part}
      </span>
      {icon ? <GuideInlineIcon src={icon} compact={entity.icon?.kind === "stat"} /> : null}
    </span>
  );
}

export function renderGuideHighlightedText(
  text: string,
  termIcons: Record<string, string> = {}
): ReactNode[] {
  return text.split(HIGHLIGHT_REGEX).map((part, index) => {
    if (!part) return null;

    const entity = resolveEntity(part);
    if (entity) {
      const icon = entity.icon ? termIcons[entity.matchKey] : undefined;
      return renderColoredPart(part, entity, icon, index);
    }

    return <Fragment key={index}>{renderPlainWithCapsBold(part, index)}</Fragment>;
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

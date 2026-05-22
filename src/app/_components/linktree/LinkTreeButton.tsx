"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LinkTreeLink } from "./linkTreeLinks";
import ButtonParticleTrail from "./ButtonParticleTrail";
import { useLinkTreePointerTrail } from "./useLinkTreePointerTrail";
import {
  LINKTREE_BUTTON_INNER,
  LINKTREE_DESCRIPTION,
  LINKTREE_ICON_TILE,
  LINKTREE_SHELL,
  LINKTREE_TILE_ICON,
  LINKTREE_TITLE,
} from "./linktreeUi";

type Props = {
  link: LinkTreeLink;
  index: number;
};

function LinkTreeTileIcon({ link }: { link: LinkTreeLink }) {
  const { Icon } = link;
  const sizeClass = LINKTREE_TILE_ICON;
  const stops = link.iconRadiantStops;

  if (stops?.length) {
    const gradId = `link-icon-radiant-${link.id}`;
    return (
      <>
        <svg width={0} height={0} className="absolute" aria-hidden>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              {stops.map((s) => (
                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
          </defs>
        </svg>
        <Icon
          className={sizeClass}
          stroke={`url(#${gradId})`}
          style={{
            filter:
              "drop-shadow(0 0 5px rgba(251, 191, 36, 0.45)) drop-shadow(0 0 8px rgba(167, 139, 250, 0.35))",
          }}
          aria-hidden
        />
      </>
    );
  }

  return (
    <Icon
      className={sizeClass}
      style={{ color: link.iconColor }}
      aria-hidden
    />
  );
}

export default function LinkTreeButton({ link, index }: Props) {
  const { trailRef, pointerHandlers } = useLinkTreePointerTrail();

  const inner = (
    <>
      <ButtonParticleTrail ref={trailRef} color={link.accent} />
      <div className={LINKTREE_BUTTON_INNER}>
        <div
          className={LINKTREE_ICON_TILE}
          style={{
            background: link.iconGradient,
            boxShadow: `0 8px 24px -6px ${link.glow}`,
          }}
        >
          <LinkTreeTileIcon link={link} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className={LINKTREE_TITLE}>{link.label}</div>
          <div className={LINKTREE_DESCRIPTION}>{link.description}</div>
        </div>

        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-white/40 transition-all duration-300 group-hover:text-[var(--link-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:h-[1.125rem] sm:w-[1.125rem] lg:h-5 lg:w-5"
          style={{ ["--link-accent" as string]: link.accent }}
          aria-hidden
        />
      </div>
    </>
  );

  const shellClass = LINKTREE_SHELL;

  const shellStyle = {
    ["--link-accent" as string]: link.accent,
    ["--link-glow" as string]: link.glow,
  } as React.CSSProperties;

  return (
    <li
      className="linktree-enter-item w-full"
      style={{ animationDelay: `${120 + index * 80}ms` }}
    >
      {link.external ? (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={shellClass}
          style={shellStyle}
          {...pointerHandlers}
        >
          {inner}
        </a>
      ) : (
        <Link
          href={link.href}
          className={shellClass}
          style={shellStyle}
          {...pointerHandlers}
        >
          {inner}
        </Link>
      )}
    </li>
  );
}

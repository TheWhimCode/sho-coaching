"use client";

import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";
import ButtonParticleTrail from "./ButtonParticleTrail";
import { useLinkTreePointerTrail } from "./useLinkTreePointerTrail";
import {
  ABOUT_MINO_ACCENT,
  ABOUT_MINO_GLOW,
  ABOUT_MINO_ICON_GRADIENT,
} from "./aboutMinoAchievements";
import {
  LINKTREE_BUTTON_INNER,
  LINKTREE_CHEVRON,
  LINKTREE_DESCRIPTION,
  LINKTREE_ICON_TILE,
  LINKTREE_SHELL,
  LINKTREE_TILE_ICON,
  LINKTREE_TITLE,
} from "./linktreeUi";

type Props = {
  index: number;
};

export default function AboutMinoButton({ index }: Props) {
  const { trailRef, pointerHandlers } = useLinkTreePointerTrail();

  const shellStyle = {
    ["--link-accent" as string]: ABOUT_MINO_ACCENT,
    ["--link-glow" as string]: ABOUT_MINO_GLOW,
  } as React.CSSProperties;

  return (
    <li
      className="linktree-enter-item w-full"
      style={{ animationDelay: `${120 + index * 80}ms` }}
    >
      <Link
        href="/about"
        className={LINKTREE_SHELL}
        style={shellStyle}
        {...pointerHandlers}
      >
        <div className={LINKTREE_BUTTON_INNER}>
          <div
            className={LINKTREE_ICON_TILE}
            style={{
              background: ABOUT_MINO_ICON_GRADIENT,
              boxShadow: `0 8px 24px -6px ${ABOUT_MINO_GLOW}`,
            }}
          >
            <Trophy
              className={`${LINKTREE_TILE_ICON} text-white`}
              strokeWidth={2.25}
              style={{
                filter:
                  "drop-shadow(0 1px 2px rgba(131, 24, 67, 0.4)) drop-shadow(0 2px 6px rgba(190, 24, 93, 0.28))",
              }}
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1 text-left">
            <div className={LINKTREE_TITLE}>
              About Mino{" "}
              <span aria-hidden className="inline-block">
                🌸
              </span>
            </div>
            <div className={LINKTREE_DESCRIPTION}>Some stuff about me :3</div>
          </div>

          <ArrowUpRight
            className={`${LINKTREE_CHEVRON} transition-all duration-300 group-hover:text-[var(--link-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5`}
            aria-hidden
          />
        </div>
        <ButtonParticleTrail ref={trailRef} color={ABOUT_MINO_ACCENT} />
      </Link>
    </li>
  );
}

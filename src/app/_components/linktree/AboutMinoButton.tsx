"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Trophy } from "lucide-react";
import { championAvatarByName, rankMiniCrestSvg } from "@/lib/league/datadragon";
import { ROLE_ICONS } from "@/lib/datadragon/roles";
import ButtonParticleTrail from "./ButtonParticleTrail";
import {
  ABOUT_MINO_ACCENT,
  ABOUT_MINO_ACHIEVEMENTS,
  ABOUT_MINO_GLOW,
  ABOUT_MINO_ICON_GRADIENT,
  type AboutMinoAchievement,
} from "./aboutMinoAchievements";
import {
  LINKTREE_BUTTON_INNER,
  LINKTREE_DESCRIPTION,
  LINKTREE_ICON_TILE,
  LINKTREE_TILE_ICON,
  LINKTREE_TITLE,
} from "./linktreeUi";

const EASE = [0.22, 1, 0.36, 1] as const;
const EXPAND_EASE = [0.16, 1, 0.3, 1] as const;

const ROLE_LABEL: Record<AboutMinoAchievement["role"], string> = {
  top: "Top",
  jng: "Jungle",
  mid: "Mid",
  adc: "ADC",
  sup: "Support",
};

const TIER_LABEL: Record<string, string> = {
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
};

type Props = {
  index: number;
};

function ChampionIcons({ champions }: { champions: string[] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1">
      {champions.map((champ) => (
        <div
          key={champ}
          className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-900 ring-1 ring-white/20 md:h-8 md:w-8"
          title={champ}
        >
          <Image
            src={championAvatarByName(champ)}
            alt={champ}
            width={32}
            height={32}
            className="h-full w-full object-cover scale-[1.12]"
            unoptimized
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/images/coaching/reviews/placeholder-avatar.png";
            }}
          />
        </div>
      ))}
    </div>
  );
}

function AchievementRow({ achievement }: { achievement: AboutMinoAchievement }) {
  const roleSrc = ROLE_ICONS[achievement.role];
  const tierName = TIER_LABEL[achievement.tier] ?? achievement.tier;
  const roleName = ROLE_LABEL[achievement.role];

  return (
    <li className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 md:gap-3 md:py-3">
      <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center">
        <Image
          src={rankMiniCrestSvg(achievement.tier)}
          alt=""
          width={36}
          height={36}
          className="h-8 w-8 object-contain"
          unoptimized
        />
        <span className="sr-only">
          {tierName} {roleName}
        </span>
      </span>

      <ChampionIcons champions={achievement.champions} />

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
        <Image
          src={roleSrc}
          alt={roleName}
          width={24}
          height={24}
          className="h-6 w-6 object-contain opacity-90"
          unoptimized
        />
      </span>
    </li>
  );
}

export default function AboutMinoButton({ index }: Props) {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const updatePointer = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPointer({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const clearHover = useCallback(() => {
    setHovering(false);
    setPointer(null);
  }, []);

  const shellClass = [
    "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220]/55 backdrop-blur-md outline-none transition-[border-color,box-shadow] duration-300",
    open
      ? "shadow-[0_12px_40px_-8px_var(--link-glow),0_0_48px_-12px_var(--link-glow)]"
      : [
          "hover:border-[color-mix(in_srgb,var(--link-accent)_45%,transparent)]",
          "hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--link-accent)_35%,transparent),0_12px_40px_-8px_var(--link-glow),0_0_48px_-12px_var(--link-glow)]",
        ].join(" "),
  ].join(" ");

  const shellStyle = {
    ["--link-accent" as string]: ABOUT_MINO_ACCENT,
    ["--link-glow" as string]: ABOUT_MINO_GLOW,
  } as React.CSSProperties;

  return (
    <li
      className="linktree-enter-item w-full"
      style={{ animationDelay: `${120 + index * 80}ms` }}
    >
      <div className={shellClass} style={shellStyle}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="about-mino-panel"
          onClick={() => setOpen((v) => !v)}
          className="relative block w-full cursor-pointer text-left outline-none focus:outline-none focus-visible:outline-none"
          onPointerEnter={(e) => {
            setHovering(true);
            updatePointer(e);
          }}
          onPointerMove={updatePointer}
          onPointerLeave={clearHover}
          onPointerCancel={clearHover}
        >
          <ButtonParticleTrail
            color={ABOUT_MINO_ACCENT}
            point={pointer}
            active={hovering}
          />
          <motion.div
            className={LINKTREE_BUTTON_INNER}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
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
              <div className={LINKTREE_DESCRIPTION}>
                Main champs and peak ranks
              </div>
            </div>

            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.35, ease: EXPAND_EASE }}
              className="shrink-0 text-white/40"
              aria-hidden
            >
              <ChevronDown className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem] lg:h-5 lg:w-5" />
            </motion.span>
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="about-mino-panel"
              role="region"
              aria-label="About Mino achievements"
              key="about-mino-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: EXPAND_EASE }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/10 px-4 pb-4 pt-3 md:px-5 md:pb-5 md:pt-3.5">
                <ul className="flex flex-col gap-2 list-none p-0 m-0">
                  {ABOUT_MINO_ACHIEVEMENTS.map((a) => (
                    <AchievementRow
                      key={`${a.tier}-${a.role}`}
                      achievement={a}
                    />
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

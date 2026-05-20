"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { LinkTreeLink } from "./linkTreeLinks";
import ButtonParticleTrail from "./ButtonParticleTrail";

type Props = {
  link: LinkTreeLink;
  index: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function LinkTreeTileIcon({ link }: { link: LinkTreeLink }) {
  const { Icon } = link;
  const sizeClass = "h-6 w-6 md:h-7 md:w-7";
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

  const pointerHandlers = {
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      setHovering(true);
      updatePointer(e);
    },
    onPointerMove: updatePointer,
    onPointerLeave: clearHover,
    onPointerCancel: clearHover,
  };

  const inner = (
    <>
      <ButtonParticleTrail
        color={link.accent}
        point={pointer}
        active={hovering}
      />
      <motion.div
        className="group relative z-10 flex w-full items-center gap-4 px-4 py-4 md:px-5 md:py-[1.15rem]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        <div
          className="relative flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105"
          style={{
            background: link.iconGradient,
            boxShadow: `0 8px 24px -6px ${link.glow}`,
          }}
        >
          <LinkTreeTileIcon link={link} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="text-lg md:text-xl font-semibold text-white tracking-tight">
            {link.label}
          </div>
          <div className="mt-0.5 text-sm text-white/55 group-hover:text-white/70 transition-colors">
            {link.description}
          </div>
        </div>

        <ArrowUpRight
          className="h-5 w-5 shrink-0 text-white/40 transition-all duration-300 group-hover:text-[var(--link-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ ["--link-accent" as string]: link.accent }}
          aria-hidden
        />
      </motion.div>
    </>
  );

  const shellClass =
    "relative block overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220]/55 backdrop-blur-md outline-none transition-[border-color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-[var(--link-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B18] hover:border-[color-mix(in_srgb,var(--link-accent)_45%,transparent)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--link-accent)_35%,transparent),0_12px_40px_-8px_var(--link-glow),0_0_48px_-12px_var(--link-glow)]";

  const shellStyle = {
    ["--link-accent" as string]: link.accent,
    ["--link-glow" as string]: link.glow,
  } as React.CSSProperties;

  return (
    <li
      className="linktree-enter-item"
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

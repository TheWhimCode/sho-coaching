// src/app/_components/small/SquareButton.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export type SquareButtonProps = {
  role: string;
  href: string;
  src: string;   // e.g. "/images/squarebuttons/Syndra8.png"
  size?: number; // px
};

export default function SquareButton({
  role,
  href,
  src,
  size = 160,
}: SquareButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${role} – Watch on Patreon`}
      className="group relative block shrink-0 transform -translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      style={{ width: size, height: size }}
    >
      {/* soft glow behind (helps on dark bg) */}
      <span
        aria-hidden
        className="absolute -inset-2 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(160,200,255,0.18) 0%, rgba(140,170,240,0.10) 40%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      <Image
        src={src}
        alt={`${role} preview`}
        fill
        sizes={`${size}px`}
        // keep your hover values; add always-on color boost
        className="object-cover select-none pointer-events-none
                   filter brightness-[1.08] contrast-[1.10] saturate-[1.22]
                   drop-shadow-[0_6px_12px_rgba(0,0,0,0.95)]
                   group-hover:brightness-[1.5] group-hover:saturate-[1.18]"
        draggable={false}
      />

      {/* inner shadow for depth */}
      <span
        aria-hidden
        className="absolute inset-0 z-20 pointer-events-none"
        style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.38)" }}
      />
    </Link>
  );
}

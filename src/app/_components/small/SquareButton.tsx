"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export type SquareButtonProps = {
  role: string;
  href: string;
  src: string;   // e.g. "/squarebuttons/Syndra3.png"
  size?: number; // px
};

export default function SquareButton({ role, href, src, size = 112 }: SquareButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${role} – Watch on Patreon`}
      className="group relative block shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={`${role} preview`}
        fill
        sizes={`${size}px`}
        // instant pop: apply filter to the image itself
        className="object-cover select-none pointer-events-none group-hover:brightness-150 group-hover:saturate-110"
        draggable={false}
      />
    </Link>
  );
}

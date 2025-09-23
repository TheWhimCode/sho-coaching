"use client";
import React from "react";

type Props = {
  className?: string;
  /** base color of the line + logo shape */
  color?: string;
  logoSrc?: string;
  logoSize?: number;
};

export default function DividerWithLogo({
  className,
  color = "rgba(255,255,255,0.10)",
  logoSrc = "/images/Logo_blue.png",
  logoSize = 24,
}: Props) {
  const leftGradient = `linear-gradient(to right, transparent 0%, ${color} 30%, ${color} 100%)`;
  const rightGradient = `linear-gradient(to left, transparent 0%, ${color} 30%, ${color} 100%)`;

  return (
    <div className={["relative flex items-center w-full", className].filter(Boolean).join(" ")}>
      {/* left line (fades at far left) */}
      <span
        aria-hidden
        className="h-px flex-1 rounded-full"
        style={{ backgroundImage: leftGradient }}
      />
      {/* logo */}
      <span
        aria-hidden
        className="mx-3 block shrink-0"
        style={{
          width: logoSize,
          height: logoSize,
          backgroundColor: color,
          maskImage: `url('${logoSrc}')`,
          WebkitMaskImage: `url('${logoSrc}')`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
      {/* right line (fades at far right) */}
      <span
        aria-hidden
        className="h-px flex-1 rounded-full"
        style={{ backgroundImage: rightGradient }}
      />
    </div>
  );
}

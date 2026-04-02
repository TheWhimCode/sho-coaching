"use client";
import React from "react";

type Props = {
  className?: string;
  /** base color of the line + logo shape */
  color?: string;
  logoSrc?: string;
  logoSize?: number;
  /** Vertical line + logo (for side-by-side columns). Default: horizontal bar. */
  vertical?: boolean;
};

export default function DividerWithLogo({
  className,
  color = "rgba(255,255,255,0.10)",
  logoSrc = "/images/Logo_blue.png",
  logoSize = 24,
  vertical = false,
}: Props) {
  const logoStyle: React.CSSProperties = {
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
  };

  if (vertical) {
    const topGradient = `linear-gradient(to bottom, transparent 0%, ${color} 30%, ${color} 100%)`;
    const bottomGradient = `linear-gradient(to top, transparent 0%, ${color} 30%, ${color} 100%)`;

    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={["relative flex h-full min-h-[10rem] w-full flex-col items-center justify-center", className]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          aria-hidden
          className="w-px flex-1 rounded-full"
          style={{ backgroundImage: topGradient, minHeight: "1.5rem" }}
        />
        <span aria-hidden className="my-3 block shrink-0" style={logoStyle} />
        <span
          aria-hidden
          className="w-px flex-1 rounded-full"
          style={{ backgroundImage: bottomGradient, minHeight: "1.5rem" }}
        />
      </div>
    );
  }

  const leftGradient = `linear-gradient(to right, transparent 0%, ${color} 30%, ${color} 100%)`;
  const rightGradient = `linear-gradient(to left, transparent 0%, ${color} 30%, ${color} 100%)`;

  return (
    <div className={["relative flex w-full items-center", className].filter(Boolean).join(" ")}>
      <span
        aria-hidden
        className="h-px flex-1 rounded-full"
        style={{ backgroundImage: leftGradient }}
      />
      <span aria-hidden className="mx-3 block shrink-0" style={logoStyle} />
      <span
        aria-hidden
        className="h-px flex-1 rounded-full"
        style={{ backgroundImage: rightGradient }}
      />
    </div>
  );
}

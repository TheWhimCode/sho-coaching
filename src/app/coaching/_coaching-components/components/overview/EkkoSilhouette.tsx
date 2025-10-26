"use client";

import React from "react";

const EKKO_SRC = "/images/coaching/overview/Ezreal.png";

export default function EkkoSilhouette() {
  const maskBase: React.CSSProperties = {
    WebkitMaskImage: `url(${EKKO_SRC})`,
    maskImage: `url(${EKKO_SRC})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };

  // tweak how big/where he sits
  const transform = "scale(1.25) translateX(8%)";

  return (
    <div className="relative h-full w-full overflow-visible">
      {/* Glow */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          ...maskBase,
          backgroundColor: "rgba(0,200,255,0.25)",
          filter: "blur(18px)",
          transform,
        }}
      />

      {/* Outline */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          ...maskBase,
          backgroundColor: "white",
          filter: `
            drop-shadow(0 0 2px white)
            drop-shadow(0 0 6px white)
          `,
          transform,
        }}
      />

      {/* Gradient Fill */}
      <div
        className="absolute inset-0"
        style={{
          ...maskBase,
          background: "linear-gradient(135deg, #4fc3f7 0%, #7e57c2 100%)",
          transform,
        }}
      />
    </div>
  );
}

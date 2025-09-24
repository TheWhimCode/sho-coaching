// src/app/_components/panels/BluePanel.tsx
"use client";

import React from "react";

export default function BluePanel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden font-semibold ring-1 ring-[var(--color-divider)] ${className}`}
      style={{
        background: "var(--color-panel)", // same panel color as before
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

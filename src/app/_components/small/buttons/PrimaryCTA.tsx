// app/_components/small/PrimaryCTA.tsx
"use client";

import * as React from "react";

export interface PrimaryCTAProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  withHalo?: boolean;
  fullWidth?: boolean;
}

export default function PrimaryCTA({
  children,
  withHalo = true,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: PrimaryCTAProps) {
  const widthClass = fullWidth ? "w-full" : "inline-block";

  return (
    <div className={`relative ${widthClass}`}>
      {withHalo && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-xl blur-md opacity-30 -z-10
                     bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]"
        />
      )}
      <button
        {...props}
        disabled={disabled}
        className={[
          "relative z-10 rounded-xl font-semibold transition",
          "text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a]",
          "shadow-[0_10px_28px_rgba(245,158,11,.35)]",
          "ring-1 ring-[rgba(255,190,80,.55)]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          className, // 👉 sizing comes entirely from parent
        ].join(" ")}
      >
        {children}
      </button>
    </div>
  );
}

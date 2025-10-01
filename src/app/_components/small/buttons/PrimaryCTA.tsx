// PrimaryCTA.tsx
"use client";

import * as React from "react";

export interface PrimaryCTAProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  withHalo?: boolean;
  fullWidth?: boolean; // optional convenience: adds w-full block
}

const PrimaryCTA = React.forwardRef<HTMLButtonElement, PrimaryCTAProps>(
  ({ children, withHalo = true, fullWidth = false, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={[
          // base button (no width enforced here)
          "relative inline-flex items-center justify-center rounded-xl font-semibold transition",
          "text-[#0A0A0A] bg-[#fc8803] enabled:hover:bg-[#f8a81a]",
          "shadow-[0_10px_28px_rgba(245,158,11,.35)]",
          "ring-1 ring-[rgba(255,190,80,.55)]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          // optional halo drawn via pseudo-element (no wrapper needed)
          withHalo
            ? "before:content-[''] before:absolute before:-inset-1 before:-z-10 before:rounded-xl before:blur-md before:opacity-30 before:pointer-events-none before:[background:radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]"
            : "",
          // optional full width
          fullWidth ? "w-full block" : "",
          className,
        ].join(" ")}
      >
        {children}
      </button>
    );
  }
);

PrimaryCTA.displayName = "PrimaryCTA";
export default PrimaryCTA;

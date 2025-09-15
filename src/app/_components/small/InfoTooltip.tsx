"use client";

import type { ReactNode } from "react";

type InfoTooltipProps = {
  ariaLabel: string;
  children: ReactNode; // tooltip content
  className?: string; // optional wrapper overrides if needed
};

export default function InfoTooltip({ ariaLabel, children, className }: InfoTooltipProps) {
  return (
    <div className={["relative group", className].filter(Boolean).join(" ")}>
      <button
        className="w-4 h-4 rounded-full bg-white/20 text-[11px] font-bold flex items-center justify-center"
        aria-label={ariaLabel}
        type="button"
      >
        ?
      </button>
      <div
        className="absolute left-full top-1/2 ml-2 -translate-y-1/2
                   w-52 rounded-md bg-black/80 text-xs text-white p-2 opacity-0
                   group-hover:opacity-100 transition pointer-events-none shadow-lg
                   z-50"
        role="tooltip"
      >
        {children}
      </div>
    </div>
  );
}

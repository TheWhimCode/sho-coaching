// components/ui/GlassPanel.tsx
"use client";

import { forwardRef, type HTMLAttributes } from "react";
import clsx from "clsx";

/**
 * GlassPanel
 * Reusable dark, glassy container that ONLY applies the visual treatment.
 * Pass layout/sizing via className (e.g., p-5, flex, gap-3, w-full, etc.).
 */
export type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          // Visual style only (no sizing/layout)
          "rounded-2xl backdrop-blur-[1px] bg-[#0B1220]/10 ring-1 ring-[rgba(146,180,255,.18)]",
          className
        )}
        {...rest}
      />
    );
  }
);

GlassPanel.displayName = "GlassPanel";
export default GlassPanel;

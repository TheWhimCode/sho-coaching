"use client";

import * as React from "react";

export interface OutlineCTAProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export default function OutlineCTA({
  children,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: OutlineCTAProps) {
  const widthClass = fullWidth ? "w-full" : "inline-block";

  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        "relative z-10 font-medium transition rounded-xl",
        // look-only styling
        "text-white",
        "bg-[rgba(16,24,40,.70)] hover:bg-[rgba(20,28,48,.85)]",
        "ring-1 ring-[var(--color-divider)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        widthClass,
        className, // 👈 sizing comes from parent
      ].join(" ")}
    >
      {children}
    </button>
  );
}

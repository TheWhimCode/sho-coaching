"use client";

import React, { useEffect, useState } from "react";
import { CaretDoubleDown } from "@phosphor-icons/react";

type Props = {
  label?: string;
  accent?: string;        // text + icon color
  delayMs?: number;       // default 2000ms
  fadeMaxScroll?: number; // default 100px (match navbar)
  className?: string;
};

export default function NeedMoreInfo({
  label = "Need more info?",
  accent = "var(--color-lightblue)", // updated to use global lightblue (#60A5FA)
  delayMs = 2000,
  fadeMaxScroll = 100,
  className = "",
}: Props) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);

  // delayed mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), Math.max(0, delayMs));
    return () => clearTimeout(t);
  }, [delayMs]);

  // match NavBar fade behavior, but use OverlayScrollbars viewport if present
  useEffect(() => {
    const root = document.getElementById("scroll-root");
    const viewport = root?.querySelector<HTMLElement>(
      "[data-overlayscrollbars-viewport]"
    );

    const scroller: HTMLElement | Window = viewport ?? window;

    const onScroll = () => {
      const y =
        scroller === window
          ? window.scrollY || 0
          : (scroller as HTMLElement).scrollTop || 0;

      setOpacity(Math.max(0, Math.min(1, 1 - y / fadeMaxScroll)));
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial sync

    return () => {
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [fadeMaxScroll]);

  return (
    <div
      style={{
        opacity: visible ? opacity : 0,
        color: accent,
      }}
      className={[
        "fixed bottom-6 right-6 z-50 select-none pointer-events-none",
        "flex items-center gap-2.5",
        "transition-[opacity] duration-75",
        className,
      ].join(" ")}
      aria-hidden
    >
      <span className="text-base md:text-lg font-semibold tracking-tight">
        {label}
      </span>
      <CaretDoubleDown
        size={32}
        weight="regular"
        className="opacity-90"
        aria-hidden
      />
    </div>
  );
}

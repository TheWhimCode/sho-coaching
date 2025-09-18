"use client";

import React, { useEffect, useRef, useState } from "react";
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
  accent = "#8FB8E6",
  delayMs = 2000,
  fadeMaxScroll = 100,
  className = "",
}: Props) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const rafRef = useRef<number | null>(null);

  // delayed mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), Math.max(0, delayMs));
    return () => clearTimeout(t);
  }, [delayMs]);

  // fade with navbar (0 -> fadeMaxScroll)
  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const y = typeof window !== "undefined" ? window.scrollY : 0;
        const next = Math.max(0, Math.min(1, 1 - y / fadeMaxScroll));
        setOpacity(next);
      });
    };
    onScroll(); // initialize
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fadeMaxScroll]);

  return (
    <div
      style={{
        opacity: visible ? opacity : 0,
        transition: "opacity 200ms ease",
        color: accent,
      }}
      className={[
        "fixed bottom-6 right-6 z-50 select-none pointer-events-none",
        "flex items-center gap-2.5",
        className,
      ].join(" ")}
      aria-hidden
    >
      <span className="text-base md:text-lg font-semibold tracking-tight">
        {label}
      </span>
      <CaretDoubleDown
        size={32}          // even, bigger size → crisp outline
        weight="regular"   // outlined, not filled
        className="opacity-90"
        aria-hidden
      />
    </div>
  );
}

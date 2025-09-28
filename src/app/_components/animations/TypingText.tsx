"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  speed?: number; // ms per character (default ~22ms)
  delay?: number; // delay before start (default 500ms)
  color?: string; // caret color
};

export default function TypingText({
  text,
  speed = 22,
  delay = 500,
  color = "var(--color-lightblue)",
}: Props) {
  const [n, setN] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const delayedStartRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setN(0);
    startRef.current = null;
    delayedStartRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (prefersReduced) {
      setN(text.length);
      return;
    }

    const loop = (t: number) => {
      if (delayedStartRef.current == null) delayedStartRef.current = t;
      const sinceDelay = t - delayedStartRef.current;
      if (sinceDelay < delay) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (startRef.current == null) startRef.current = t;
      const elapsed = t - startRef.current;

      const next = Math.min(text.length, Math.floor(elapsed / speed) + 1);
      setN(next);

      if (next < text.length) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, speed, delay]);

  const reserveStyle = { minWidth: `${text.length}ch` };

  return (
    <span
      className="inline-flex relative font-mono whitespace-pre tabular-nums leading-none"
      style={reserveStyle}
    >
      <span aria-hidden="true">{text.slice(0, n)}</span>
      <span className="sr-only">{text}</span>
      {n < text.length && (
        <span
          aria-hidden
          className="absolute top-0 bottom-0"
          style={{
            left: `calc(${n}ch)`,
            width: "0.12em",
            background: color,
          }}
        />
      )}
    </span>
  );
}

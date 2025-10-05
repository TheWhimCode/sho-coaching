"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  speed?: number; // ms per character (default ~22ms)
  delay?: number; // delay before start (default 500ms)
  color?: string; // caret color
  className?: string; // override font etc.
};

export default function TypingText({
  text,
  speed = 22,
  delay = 500,
  color = "var(--color-lightblue)",
  className = "",
}: Props) {
  const [n, setN] = useState(0);
  const [started, setStarted] = useState(false); // <-- track when animation actually begins
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const delayedStartRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setN(0);
    setStarted(false);
    startRef.current = null;
    delayedStartRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (prefersReduced) {
      setN(text.length);
      setStarted(true);
      return;
    }

    const loop = (t: number) => {
      if (delayedStartRef.current == null) delayedStartRef.current = t;
      const sinceDelay = t - delayedStartRef.current;
      if (sinceDelay < delay) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!started) setStarted(true); // <-- mark animation start here

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
      className={["inline-flex relative whitespace-pre tabular-nums leading-none", className].join(" ")}
      style={reserveStyle}
    >
      <span aria-hidden="true">{text.slice(0, n)}</span>
      <span className="sr-only">{text}</span>

      {/* Caret appears only once typing starts */}
      {started && n < text.length && (
        <span
          aria-hidden
          className="inline-block align-baseline"
          style={{
            width: 0,
            borderLeft: `0.12em solid ${color}`,
            height: "1em",
            marginLeft: 0,
          }}
        />
      )}
    </span>
  );
}

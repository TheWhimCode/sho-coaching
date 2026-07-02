"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  text: string;
  /** ms before reveal starts */
  delay?: number;
  /** ms for the full reveal (two beats + gradient exit) */
  duration?: number;
  className?: string;
  baseColor?: string;
  accentColor?: string;
};

type AnimFrame = {
  maskReveal: number;
  gradientCenter: number;
  complete: boolean;
};

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

type RevealTimings = {
  phase1End: number;
  pauseEnd: number;
  revealEnd: number;
  commaReveal: number;
  afterCommaStart: number;
};

const REVEAL_END = 0.86;
const PAUSE_DURATION = 0.17;

function revealTimings(commaSplit: number): RevealTimings {
  const commaReveal = commaSplit;
  const afterCommaStart = Math.min(1, commaSplit + 0.025);
  const firstDist = commaReveal;
  const secondDist = 1 - afterCommaStart;
  const revealBudget = REVEAL_END - PAUSE_DURATION;

  // Equal average speed for both sweeps; nudge timings toward each other slightly.
  const blend = 0.04;
  const phase1End =
    (revealBudget * (firstDist - blend * secondDist)) / (firstDist + secondDist);
  const phase3Duration =
    (revealBudget * (secondDist + blend * firstDist)) / (firstDist + secondDist);

  return {
    phase1End,
    pauseEnd: phase1End + PAUSE_DURATION,
    revealEnd: phase1End + PAUSE_DURATION + phase3Duration,
    commaReveal,
    afterCommaStart,
  };
}

/** First comma splits the line into two reveal beats with a slow pass at the pause. */
function mapProgress(t: number, commaSplit: number | null): AnimFrame {
  if (t >= 1) {
    return { maskReveal: 1, gradientCenter: 1.3, complete: true };
  }

  if (commaSplit == null) {
    if (t <= REVEAL_END) {
      const local = easeInOutQuart(t / REVEAL_END);
      return {
        maskReveal: local,
        gradientCenter: local + 0.04,
        complete: false,
      };
    }
    const local = easeInOutSine((t - REVEAL_END) / (1 - REVEAL_END));
    return {
      maskReveal: 1,
      gradientCenter: 1 + local * 0.3,
      complete: false,
    };
  }

  const { phase1End, pauseEnd, revealEnd, commaReveal, afterCommaStart } =
    revealTimings(commaSplit);

  if (t <= phase1End) {
    const local = easeInOutQuart(t / phase1End);
    const maskReveal = local * commaReveal;
    return { maskReveal, gradientCenter: maskReveal + 0.04, complete: false };
  }

  if (t <= pauseEnd) {
    const local = easeInOutSine((t - phase1End) / (pauseEnd - phase1End));
    const maskReveal = commaReveal + local * (afterCommaStart - commaReveal);
    return { maskReveal, gradientCenter: maskReveal + 0.04, complete: false };
  }

  if (t <= revealEnd) {
    const local = easeInOutQuart((t - pauseEnd) / (revealEnd - pauseEnd));
    const maskReveal = afterCommaStart + local * (1 - afterCommaStart);
    return { maskReveal, gradientCenter: maskReveal + 0.04, complete: false };
  }

  const local = easeInOutSine((t - revealEnd) / (1 - revealEnd));
  return {
    maskReveal: 1,
    gradientCenter: 1 + local * 0.3,
    complete: false,
  };
}

function commaSplitRatio(text: string): number | null {
  const commaIndex = text.indexOf(",");
  if (commaIndex < 0) return null;
  return (commaIndex + 1) / text.length;
}

export default function StripeRevealText({
  text,
  delay = 500,
  duration = 2400,
  className = "",
  baseColor = "rgba(167, 184, 214, 0.9)",
  accentColor = "#F5B8D9",
}: Props) {
  const [timeProgress, setTimeProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const delayStartRef = useRef<number | null>(null);
  const animStartRef = useRef<number | null>(null);

  const commaSplit = useMemo(() => commaSplitRatio(text), [text]);
  const frame = useMemo(
    () => mapProgress(timeProgress, commaSplit),
    [timeProgress, commaSplit]
  );

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setTimeProgress(0);
    delayStartRef.current = null;
    animStartRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (prefersReduced) {
      setTimeProgress(1);
      return;
    }

    const loop = (t: number) => {
      if (delayStartRef.current == null) delayStartRef.current = t;
      const sinceDelay = t - delayStartRef.current;
      if (sinceDelay < delay) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (animStartRef.current == null) animStartRef.current = t;
      const elapsed = t - animStartRef.current;
      const raw = Math.min(1, elapsed / duration);
      setTimeProgress(raw);

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, delay, duration]);

  if (frame.complete) {
    return (
      <span className={className} style={{ color: baseColor }}>
        {text}
      </span>
    );
  }

  const maskReveal = frame.maskReveal * 100;
  const gradientCenter = frame.gradientCenter * 100;
  const pinkLead = Math.max(0, gradientCenter - 14);
  const pinkPeak = Math.max(0, gradientCenter - 3);
  const pinkTail = gradientCenter + 1.5;

  return (
    <span className={["relative inline-block max-w-full", className].join(" ")}>
      <span
        className="relative inline-block"
        style={{
          clipPath: `inset(0 ${100 - maskReveal}% 0 0)`,
          WebkitClipPath: `inset(0 ${100 - maskReveal}% 0 0)`,
        }}
      >
        <span
          aria-hidden="true"
          className="inline-block"
          style={{
            backgroundImage: `linear-gradient(90deg, ${baseColor} 0%, ${baseColor} ${pinkLead}%, ${accentColor} ${pinkPeak}%, ${baseColor} ${pinkTail}%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {text}
        </span>
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

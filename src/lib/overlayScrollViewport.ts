"use client";

import { useEffect, useState } from "react";

export function getOverlayScrollViewport(): HTMLElement | null {
  return (
    document
      .getElementById("scroll-root")
      ?.querySelector<HTMLElement>("[data-overlayscrollbars-viewport]") ?? null
  );
}

/** OverlayScrollbars viewport — the element that actually scrolls on this site. */
export function useOverlayScrollViewport(): HTMLElement | null {
  const [viewport, setViewport] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const resolve = () => {
      const el = getOverlayScrollViewport();
      if (el) {
        setViewport(el);
        return true;
      }
      return false;
    };

    if (resolve()) return;

    const interval = window.setInterval(() => {
      if (resolve()) window.clearInterval(interval);
    }, 50);

    const timeout = window.setTimeout(() => window.clearInterval(interval), 3000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  return viewport;
}

/** Pink reveal: 0 until section top reaches `revealStartRatio` of viewport, 1 at top. */
export function getPinkSectionScrollMetrics(
  zone: HTMLElement,
  container: HTMLElement,
  revealStartRatio = 0.72
): { reveal: number; exit: number } {
  const containerRect = container.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const viewHeight = containerRect.height;
  const zoneTop = zoneRect.top - containerRect.top;
  const zoneBottom = zoneRect.bottom - containerRect.top;

  const revealStart = viewHeight * revealStartRatio;
  const revealEnd = 0;
  const revealSpan = revealStart - revealEnd;
  const reveal =
    revealSpan <= 0
      ? 1
      : Math.min(1, Math.max(0, (revealStart - zoneTop) / revealSpan));

  const exit =
    zoneBottom >= viewHeight
      ? 0
      : Math.min(1, Math.max(0, 1 - zoneBottom / viewHeight));

  return { reveal, exit };
}

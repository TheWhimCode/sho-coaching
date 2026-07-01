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

const SCROLL_SETTLE_FRAMES = 4;
const SCROLL_MAX_WAIT_MS = 1200;

/** Smooth-scroll until `element`'s bottom sits in view (OverlayScrollbars viewport or window). */
export function scrollRevealElementBottom(
  element: HTMLElement,
  bottomPaddingPx = 32
): Promise<void> {
  return new Promise((resolve) => {
    const viewport = getOverlayScrollViewport();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const containerRect = viewport
      ? viewport.getBoundingClientRect()
      : { top: 0, height: window.innerHeight };
    const elRect = element.getBoundingClientRect();
    const visibleBottom = containerRect.top + containerRect.height - bottomPaddingPx;
    const overflow = elRect.bottom - visibleBottom;

    if (overflow <= 0) {
      resolve();
      return;
    }

    const currentScrollTop = viewport?.scrollTop ?? window.scrollY;
    const targetScrollTop = currentScrollTop + overflow;

    if (reduceMotion) {
      if (viewport) viewport.scrollTop = targetScrollTop;
      else window.scrollTo({ top: targetScrollTop });
      resolve();
      return;
    }

    if (viewport) {
      viewport.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    } else {
      window.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    }

    let lastScrollTop = -1;
    let stableFrames = 0;
    const startedAt = performance.now();

    const tick = () => {
      const scrollTop = viewport?.scrollTop ?? window.scrollY;

      if (
        Math.abs(scrollTop - targetScrollTop) < 2 ||
        scrollTop === lastScrollTop
      ) {
        stableFrames += 1;
        if (
          stableFrames >= SCROLL_SETTLE_FRAMES ||
          performance.now() - startedAt >= SCROLL_MAX_WAIT_MS
        ) {
          resolve();
          return;
        }
      } else {
        stableFrames = 0;
      }

      lastScrollTop = scrollTop;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}

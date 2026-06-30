"use client";

import { useEffect } from "react";
import { OverlayScrollbars } from "overlayscrollbars";

const SCROLLBAR_OPTIONS = {
  overflow: { x: "hidden" as const, y: "scroll" as const },
  scrollbars: {
    theme: "os-theme-custom",
    autoHide: "never" as const,
    visibility: "auto" as const,
  },
};

function configureInstance(instance: OverlayScrollbars) {
  const viewport = instance.elements().viewport;
  if (viewport) viewport.style.scrollBehavior = "smooth";

  const { host, padding } = instance.elements();
  if (host) host.style.pointerEvents = "none";
  if (padding) padding.style.pointerEvents = "none";
  if (viewport) viewport.style.pointerEvents = "auto";
}

function getOrCreateScrollbarInstance(scrollRoot: HTMLElement) {
  const existing = OverlayScrollbars(scrollRoot);
  if (existing) return existing;
  return OverlayScrollbars(scrollRoot, SCROLLBAR_OPTIONS);
}

function finishLoading(scrollRoot: HTMLElement) {
  scrollRoot.classList.remove("os-loading");
}

export default function ScrollbarInit() {
  useEffect(() => {
    let cancelled = false;

    const tryInit = () => {
      if (cancelled) return true;

      const scrollRoot = document.getElementById("scroll-root");
      if (!scrollRoot) return false;

      try {
        const instance = getOrCreateScrollbarInstance(scrollRoot);
        if (!instance) return false;
        configureInstance(instance);
        finishLoading(scrollRoot);
        return true;
      } catch {
        finishLoading(scrollRoot);
        return true;
      }
    };

    const refresh = () => {
      tryInit();
      const scrollRoot = document.getElementById("scroll-root");
      if (!scrollRoot) return;
      const instance = OverlayScrollbars(scrollRoot);
      instance?.update(true);
    };

    if (tryInit()) {
      window.addEventListener("pageshow", refresh);
      window.addEventListener("popstate", refresh);
      return () => {
        cancelled = true;
        window.removeEventListener("pageshow", refresh);
        window.removeEventListener("popstate", refresh);
      };
    }

    const interval = window.setInterval(() => {
      if (tryInit()) window.clearInterval(interval);
    }, 50);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      const scrollRoot = document.getElementById("scroll-root");
      if (scrollRoot) finishLoading(scrollRoot);
    }, 3000);

    window.addEventListener("pageshow", refresh);
    window.addEventListener("popstate", refresh);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("popstate", refresh);
      // Do not destroy OverlayScrollbars — React Strict Mode remount breaks scroll-root if we do.
    };
  }, []);

  return null;
}

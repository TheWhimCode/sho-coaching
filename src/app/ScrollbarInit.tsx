"use client";

import { useEffect } from "react";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/styles/overlayscrollbars.css";

export default function ScrollbarInit() {
  useEffect(() => {
    const scrollRoot = document.getElementById("scroll-root");
    if (!scrollRoot) return;

    const instance = OverlayScrollbars(scrollRoot, {
      overflow: { x: "hidden", y: "scroll" },
      scrollbars: {
        theme: "os-theme-custom",
        autoHide: "never",
        visibility: "auto",
      },
    });

    const handleNavigation = () => {
      const viewport = instance.elements().viewport;
      if (viewport) {
        viewport.scrollTop = 0;
      }
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            instance.update(true);
            if (viewport) {
              void viewport.offsetHeight;
            }
          });
        });
      });
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        handleNavigation();
      }
    };

    const onPopState = () => {
      handleNavigation();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPopState);

    const viewport = instance.elements().viewport;
    if (viewport) viewport.style.scrollBehavior = "smooth";

    // ✅ Fix pointer-events on OverlayScrollbars wrapper elements
    const { host, padding } = instance.elements();
    if (host) host.style.pointerEvents = "none";
    if (padding) padding.style.pointerEvents = "none";
    if (viewport) viewport.style.pointerEvents = "auto";

    scrollRoot.classList.remove("os-loading");

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPopState);
      instance?.destroy();
    };
  }, []);

  return null;
}
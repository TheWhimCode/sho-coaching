"use client";

import { useEffect } from "react";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/styles/overlayscrollbars.css";

export default function ScrollbarInit() {
  useEffect(() => {
    const scrollRoot = document.getElementById("scroll-root");
    
    if (!scrollRoot) return;

    const instance = OverlayScrollbars(scrollRoot, {
      scrollbars: {
        theme: "os-theme-custom",
        autoHide: "never",
        visibility: "visible",
      },
    });

    // Add smooth scrolling behavior
    const viewport = instance.elements().viewport;
    if (viewport) {
      viewport.style.scrollBehavior = "smooth";
    }

    return () => {
      instance?.destroy();
    };
  }, []);

  return null;
}
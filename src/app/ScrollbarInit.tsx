"use client";

import { useEffect } from "react";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/styles/overlayscrollbars.css";

export default function ScrollbarInit() {
  useEffect(() => {
    const root = document.documentElement; // ⭐ attach to <html>

    OverlayScrollbars(root, {
      scrollbars: {
        theme: "os-theme-custom",
        autoHide: "leave",
        visibility: "auto",
      },
    });
  }, []);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { preloadGuideImages } from "@/lib/guides/preloadGuideImages";

type UseGuideSectionImagesOptions = {
  /** Preload immediately (above-the-fold sections). */
  eager?: boolean;
  rootMargin?: string;
};

export function useGuideSectionImages(
  urls: string[],
  { eager = false, rootMargin = "240px" }: UseGuideSectionImagesOptions = {}
) {
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    if (eager || shouldLoad) return;

    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, shouldLoad, rootMargin]);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;
    setImagesReady(false);

    void preloadGuideImages(urls).then(() => {
      if (!cancelled) setImagesReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, urls]);

  return { sectionRef, shouldLoad, imagesReady };
}

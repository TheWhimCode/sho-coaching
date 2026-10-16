"use client";

import { useEffect, useState } from "react";
import {
  PARTICLE_BG_MOBILE_VIDEO,
  PARTICLE_BG_VIDEO,
} from "@/lib/coaching/coachingClipVideos";

/** Particle video backdrop — matches coaching preset SessionHero. */
export default function LinkTreeBackground() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const videoSrc = isDesktop === null
    ? null
    : isDesktop
      ? PARTICLE_BG_VIDEO
      : PARTICLE_BG_MOBILE_VIDEO;

  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none linktree-bg"
      aria-hidden
    >
      {videoSrc ? (
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover object-left md:object-center"
        />
      ) : null}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

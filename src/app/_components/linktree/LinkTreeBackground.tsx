import {
  PARTICLE_BG_MOBILE_VIDEO,
  PARTICLE_BG_VIDEO,
} from "@/lib/coaching/coachingClipVideos";

/** Particle video backdrop — matches coaching preset SessionHero. */
export default function LinkTreeBackground() {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none linktree-bg"
      aria-hidden
    >
      <video
        src={PARTICLE_BG_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="hidden md:block h-full w-full object-cover object-left md:object-center"
      />
      <video
        src={PARTICLE_BG_MOBILE_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="block md:hidden h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

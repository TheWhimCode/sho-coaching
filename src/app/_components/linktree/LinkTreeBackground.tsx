/** Particle video backdrop — matches coaching preset SessionHero. */
export default function LinkTreeBackground() {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none linktree-bg"
      aria-hidden
    >
      <video
        src="/videos/customize/Particle1_slow.webm"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        decoding="async"
        className="hidden md:block h-full w-full object-cover object-left md:object-center"
      />
      <video
        src="/videos/customize/Particle_mobile480p.webm"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        decoding="async"
        className="block md:hidden h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

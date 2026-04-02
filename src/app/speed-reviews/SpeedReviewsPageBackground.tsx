/** Fills a `relative` ancestor that wraps both `<main>` and the site footer — scrolls with the page, not the viewport. */
export default function SpeedReviewsPageBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0d1a32 0%, #0a1224 45%, #080f1a 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-sky-800/25 via-sky-950/10 to-indigo-950/20"
        aria-hidden
      />
      <div
        className="hud-grid absolute inset-0 opacity-[0.07]"
        style={{
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <div
        className="absolute -left-[20%] -top-[10%] h-[min(55vh,28rem)] w-[min(85vw,42rem)] rounded-full bg-[var(--color-orange)]/[0.18] blur-[100px] motion-safe:animate-[pulse_14s_ease-in-out_infinite]"
        aria-hidden
      />
      <div
        className="absolute -right-[15%] top-[20%] h-[min(45vh,24rem)] w-[min(70vw,36rem)] rounded-full bg-sky-400/[0.14] blur-[90px] motion-safe:animate-[pulse_18s_ease-in-out_infinite] [animation-delay:-4s]"
        aria-hidden
      />
      <div
        className="absolute bottom-[5%] left-[15%] h-[min(40vh,22rem)] w-[min(65vw,32rem)] rounded-full bg-violet-400/[0.12] blur-[110px] motion-safe:animate-[pulse_20s_ease-in-out_infinite] [animation-delay:-7s]"
        aria-hidden
      />
    </div>
  );
}

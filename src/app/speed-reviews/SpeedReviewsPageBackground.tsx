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
            "linear-gradient(180deg, #0a1428 0%, #070f1c 45%, #050a12 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-blue-950/18 via-slate-950/20 to-indigo-950/[0.22]"
        aria-hidden
      />
      <div
        className="hud-grid absolute inset-0 opacity-[0.07]"
        style={{
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
    </div>
  );
}

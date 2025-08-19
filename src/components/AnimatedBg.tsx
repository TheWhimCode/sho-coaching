export default function AnimatedBg() {
  return (
    <div aria-hidden className="neo-bg -z-10">
      <div className="neo-base" />
      <div className="neo-grid" />
      <div className="neo-blob cyan a"   style={{ left: "-10%", top: "-10%" }} />
      <div className="neo-blob indigo b" style={{ right: "-15%", top: "10%" }} />
      <div className="neo-blob blue c"   style={{ left: "5%", bottom: "-20%" }} />
      <div className="neo-vignette" />
    </div>
  );
}

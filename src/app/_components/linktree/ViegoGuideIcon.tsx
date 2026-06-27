/** Sharp diagonal split — black upper-left, red lower-right. */
export function ViegoGuideTileSplit({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div
        className="absolute inset-0 bg-black"
        style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />
      <div
        className="absolute inset-0 bg-[#E11D48]"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
    </div>
  );
}

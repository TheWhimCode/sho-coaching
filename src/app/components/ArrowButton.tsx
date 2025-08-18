"use client";
type Props = { dir: "prev" | "next"; onClick: () => void; className?: string };
export default function ArrowButton({ dir, onClick, className }: Props) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={dir === "prev" ? "Previous" : "Next"}
      onClick={onClick}
      className={`group p-2 sm:p-3 text-white/70 hover:text-white transition ${className ?? ""}`}
    >
      <svg viewBox="0 0 12 16" className={`h-10 sm:h-12 w-auto transition-transform ${dir==="prev" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`}>
        {dir === "prev" ? (
          <polyline points="9,1 3,8 9,15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <polyline points="3,1 9,8 3,15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

"use client";
type Props = { count: number; active: number; onSelect: (i:number)=>void; className?: string };
export default function Dots({ count, active, onSelect, className }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`h-1.5 rounded-full transition-all ${active === i ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
        />
      ))}
    </div>
  );
}

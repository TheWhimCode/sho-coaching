"use client";

export default function SlotSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-1 grid grid-cols-1 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-full rounded-xl ring-1 ring-white/10 bg-white/5 skeleton"
        />
      ))}
    </div>
  );
}

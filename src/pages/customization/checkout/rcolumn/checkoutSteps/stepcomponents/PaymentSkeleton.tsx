"use client";

type Method = "card" | "paypal" | "revolut_pay";

export default function PaymentSkeleton({ method }: { method: Method }) {
  if (method !== "card") {
    // fallback for PayPal/Revolut (simple panel)
    return (
      <div className="rounded-xl ring-1 ring-white/10 bg-white/[0.04] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-white/10 shimmer" />
          <div className="h-3 w-20 rounded bg-white/10 shimmer" />
        </div>
        <div className="h-16 rounded-lg bg-white/10 shimmer" />
      </div>
    );
  }

  // Card form skeleton
  return (
    <div className="rounded-xl ring-1 ring-white/10 bg-white/[0.04] p-4 space-y-5">
      {/* header row (icon + "Card") */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-md bg-white/10 shimmer" />
        <div className="h-3 w-14 rounded bg-white/10 shimmer" />
      </div>

      {/* Card number */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-white/10 shimmer" />
        <div className="h-10 rounded-lg bg-white/10 shimmer" />
      </div>

      {/* Expiration + CVC side by side */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded bg-white/10 shimmer" />
          <div className="h-10 rounded-lg bg-white/10 shimmer" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-white/10 shimmer" />
          <div className="h-10 rounded-lg bg-white/10 shimmer" />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-white/10 shimmer" />
        <div className="h-10 rounded-lg bg-white/10 shimmer" />
      </div>

      {/* shimmer effect */}
      <style jsx>{`
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.18) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          mix-blend-mode: overlay;
          animation: shimmer 1.1s linear infinite;
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

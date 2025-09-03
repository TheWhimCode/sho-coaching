"use client";

type Method = "card" | "paypal" | "revolut_pay";

export default function PaymentSkeleton({ method }: { method: Method }) {
  if (method !== "card") {
    // Unchanged (PayPal/Revolut)
    return (
      <div className="rounded-2xl ring-1 ring-gray-800 bg-gray-900 px-5 py-5 space-y-8">
        {/* OUTER: small icon + label */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-gray-700 shimmer" />
          <div className="h-3 w-16 rounded bg-gray-700 shimmer" />
        </div>

        {/* INNER CARD */}
        <div className="rounded-xl ring-1 ring-gray-800 bg-gray-900 p-6 space-y-4">
          {/* TOP: icon alone, then title below it */}
          <div className="flex flex-col gap-2">
            <div className="h-9 w-9 rounded-md bg-gray-700 shimmer" />
            <div className="h-4 w-44 rounded bg-gray-700 shimmer" />
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-gray-800" />

          {/* BOTTOM: icon + TWO text rows (stacked) */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-8 rounded bg-gray-700 shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-5/6 rounded bg-gray-700 shimmer" />
              <div className="h-3 w-2/3 rounded bg-gray-700 shimmer" />
            </div>
          </div>
        </div>

        <ShimmerStyles />
      </div>
    );
  }

  // Card-only skeleton — top padding added, rows 52px, extra vertical spacing
  return (
    <div className="pt-[6px] space-y-[14px]">
      {/* Card number */}
      <div className="space-y-[8px]">
        <div className="h-3 w-24 rounded bg-white/12 shimmer" />
        <div className="h-[52px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-[8px]">
          <div className="h-3 w-20 rounded bg-white/12 shimmer" />
          <div className="h-[52px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
        </div>
        <div className="space-y-[8px]">
          <div className="h-3 w-24 rounded bg-white/12 shimmer" />
          <div className="h-[52px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-[8px]">
        <div className="h-3 w-24 rounded bg-white/12 shimmer" />
        <div className="h-[52px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
      </div>

      <ShimmerStyles />
    </div>
  );
}

/** Shared shimmer */
function ShimmerStyles() {
  return (
    <style jsx>{`
      .shimmer {
        position: relative;
        overflow: hidden;
      }
      .shimmer::after {
        content: "";
        position: absolute;
        top: 0;
        left: -150%;
        height: 100%;
        width: 150%;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.12) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmer 1.2s linear infinite.
      }
      @keyframes shimmer {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  );
}

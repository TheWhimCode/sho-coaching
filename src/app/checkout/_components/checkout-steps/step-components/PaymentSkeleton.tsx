// src/app/checkout/_components/checkout-steps/step-components/PaymentSkeleton.tsx
"use client";

type Method = "card" | "paypal" | "revolut_pay" | "klarna" | "wallet";

export default function PaymentSkeleton({ method }: { method: Method }) {
  if (method === "card") {
    // Card skeleton — matches 48px rows + tight spacing
    return (
      <div className="pt-1 space-y-2">
        {/* Card number */}
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-white/12 shimmer" />
          <div className="h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
        </div>

        {/* Expiry + CVC */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-white/12 shimmer" />
            <div className="h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-white/12 shimmer" />
            <div className="h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
          </div>
        </div>

        {/* Postal code */}
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-white/12 shimmer" />
          <div className="h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-white/12 shimmer" />
          <div className="h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer" />
        </div>

        <ShimmerStyles />
      </div>
    );
  }

  if (method === "klarna") {
    // Klarna skeleton — more compact than PayPal/Revolut
    return (
      <div className="rounded-2xl ring-1 ring-gray-800 bg-gray-900 px-5 py-4 space-y-4">
        {/* Top row: small icon + title */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-gray-700 shimmer" />
          <div className="h-3 w-24 rounded bg-gray-700 shimmer" />
        </div>

        {/* Compact inner card */}
        <div className="rounded-xl ring-1 ring-gray-800 bg-gray-900 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-gray-700 shimmer" />
            <div className="h-3 w-40 rounded bg-gray-700 shimmer" />
          </div>

          <div className="h-px w-full bg-gray-800" />

          {/* Short description lines */}
          <div className="space-y-2">
            <div className="h-3 w-5/6 rounded bg-gray-700 shimmer" />
            <div className="h-3 w-2/3 rounded bg-gray-700 shimmer" />
          </div>

          {/* Small action button */}
          <div className="h-9 w-28 rounded-md bg-gray-700 shimmer" />
        </div>

        <ShimmerStyles />
      </div>
    );
  }

  if (method === "wallet") {
    // Wallet skeleton — looks like an Apple/Google Pay button with brief copy
    return (
      <div className="rounded-2xl ring-1 ring-gray-800 bg-gray-900 px-5 py-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-gray-700 shimmer" />
          <div className="h-3 w-28 rounded bg-gray-700 shimmer" />
        </div>

        <div className="rounded-xl ring-1 ring-gray-800 bg-gray-900 p-5 space-y-3">
          {/* Big wallet button placeholder */}
          <div className="h-12 w-44 rounded-md bg-gray-700 shimmer" />
          {/* Short note */}
          <div className="h-3 w-3/4 rounded bg-gray-700 shimmer" />
        </div>

        <ShimmerStyles />
      </div>
    );
  }

  // Default non-card (PayPal / Revolut Pay) — slightly taller than Klarna
  return (
    <div className="rounded-2xl ring-1 ring-gray-800 bg-gray-900 px-5 py-5 space-y-6">
      {/* OUTER: small icon + label */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-md bg-gray-700 shimmer" />
        <div className="h-3 w-16 rounded bg-gray-700 shimmer" />
      </div>

      {/* INNER CARD */}
      <div className="rounded-xl ring-1 ring-gray-800 bg-gray-900 p-6 space-y-4">
        {/* TOP: icon + title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-gray-700 shimmer" />
          <div className="h-4 w-44 rounded bg-gray-700 shimmer" />
        </div>

        <div className="h-px w-full bg-gray-800" />

        {/* BOTTOM: icon + two text rows */}
        <div className="flex items-start gap-3">
          <div className="h-6 w-8 rounded bg-gray-700 shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-5/6 rounded bg-gray-700 shimmer" />
            <div className="h-3 w-2/3 rounded bg-gray-700 shimmer" />
          </div>
        </div>

        {/* Action button */}
        <div className="h-10 w-32 rounded-md bg-gray-700 shimmer" />
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
        animation: shimmer 1.2s linear infinite;
      }
      @keyframes shimmer {
        0% { transform: translateX(0%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  );
}

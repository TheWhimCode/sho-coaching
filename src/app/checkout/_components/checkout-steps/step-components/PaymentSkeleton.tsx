// src/app/checkout/_components/checkout-steps/step-components/PaymentSkeleton.tsx
"use client";

type Method = "card" | "paypal" | "revolut_pay" | "klarna";

export default function PaymentSkeleton({ method }: { method: Method }) {
  if (method === "card") {
    // Card skeleton — matches 48px rows + tight spacing
    return (
      <div className="pt-1 space-y-2">
        {/* Card number */}
        <div className="space-y-2">
          <div className="relative h-3 w-24 rounded bg-white/12 shimmer overflow-hidden" />
          <div className="relative h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer overflow-hidden" />
        </div>

        {/* Expiry + CVC */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className="relative h-3 w-20 rounded bg-white/12 shimmer overflow-hidden" />
            <div className="relative h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer overflow-hidden" />
          </div>
          <div className="space-y-2">
            <div className="relative h-3 w-24 rounded bg-white/12 shimmer overflow-hidden" />
            <div className="relative h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer overflow-hidden" />
          </div>
        </div>

        {/* Postal code */}
        <div className="space-y-2">
          <div className="relative h-3 w-24 rounded bg-white/12 shimmer overflow-hidden" />
          <div className="relative h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer overflow-hidden" />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <div className="relative h-3 w-24 rounded bg-white/12 shimmer overflow-hidden" />
          <div className="relative h-[48px] rounded-lg bg-white/[.05] ring-1 ring-white/12 shimmer overflow-hidden" />
        </div>

        <ShimmerStyles />
      </div>
    );
  }

  if (method === "klarna") {
    // Klarna skeleton — simple header + one placeholder line + icon + two rows
    return (
      <div className="rounded-2xl ring-1 ring-gray-800 bg-gray-900 px-5 py-6 space-y-5">
        {/* Top row: small icon + title */}
        <div className="flex items-center gap-2">
          <div className="relative h-5 w-5 rounded-md bg-gray-700 shimmer overflow-hidden" />
          <div className="relative h-3 w-24 rounded bg-gray-700 shimmer overflow-hidden" />
        </div>

        {/* Single placeholder line */}
        <div className="relative h-3 w-40 rounded bg-gray-700 shimmer overflow-hidden" />

        {/* Icon with text rows */}
        <div className="flex items-start gap-3">
          <div className="relative h-7 w-7 rounded-md bg-gray-700 shimmer overflow-hidden" />
          <div className="flex-1 space-y-2">
            <div className="relative h-3 w-5/6 rounded bg-gray-700 shimmer overflow-hidden" />
            <div className="relative h-3 w-2/3 rounded bg-gray-700 shimmer overflow-hidden" />
          </div>
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
        <div className="relative h-5 w-5 rounded-md bg-gray-700 shimmer overflow-hidden" />
        <div className="relative h-3 w-16 rounded bg-gray-700 shimmer overflow-hidden" />
      </div>

      {/* INNER CARD */}
      <div className="rounded-xl ring-1 ring-gray-800 bg-gray-900 p-6 space-y-4">
        {/* TOP: icon + title */}
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-md bg-gray-700 shimmer overflow-hidden" />
          <div className="relative h-4 w-44 rounded bg-gray-700 shimmer overflow-hidden" />
        </div>

        <div className="h-px w-full bg-gray-800" />

        {/* BOTTOM: icon + two text rows */}
        <div className="flex items-start gap-3">
          <div className="relative h-6 w-8 rounded bg-gray-700 shimmer overflow-hidden" />
          <div className="flex-1 space-y-2">
            <div className="relative h-3 w-5/6 rounded bg-gray-700 shimmer overflow-hidden" />
            <div className="relative h-3 w-2/3 rounded bg-gray-700 shimmer overflow-hidden" />
          </div>
        </div>

        {/* Action button */}
        <div className="relative h-10 w-32 rounded-md bg-gray-700 shimmer overflow-hidden" />
      </div>

      <ShimmerStyles />
    </div>
  );
}

/** Shared shimmer */
function ShimmerStyles() {
  return (
    <style jsx>{`
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

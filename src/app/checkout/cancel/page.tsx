// src/app/checkout/cancel/page.tsx
import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="grid min-h-[60vh] place-items-center text-white">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">Checkout canceled</h1>
        <p className="text-white/70">
          No charge was made. You can pick another time.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-white/10 ring-1 ring-white/15 px-4 py-2"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

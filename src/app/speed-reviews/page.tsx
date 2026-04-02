import { Suspense } from "react";
import type { Metadata } from "next";
import SpeedReviewsClient from "./SpeedReviewsClient";

export const metadata: Metadata = {
  title: "Speed Reviews | Sho Coaching",
  description: "Sign up for weekly free speed reviews on Discord.",
};

export default function SpeedReviewsPage() {
  return (
    <div className="min-h-dvh overflow-y-auto">
      <Suspense
        fallback={
          <div className="min-h-dvh p-10 text-white/60 text-center bg-[#0a1224]">Loading…</div>
        }
      >
        <SpeedReviewsClient />
      </Suspense>
    </div>
  );
}

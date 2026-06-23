import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SPEED_REVIEWS_PUBLIC_ENABLED } from "@/lib/speedReview/publicAccess";
import SpeedReviewsClient from "./SpeedReviewsClient";

export const metadata: Metadata = {
  title: "Speed Reviews | Mino",
  description: "Sign up for weekly free speed reviews on Discord.",
};

export default function SpeedReviewsPage() {
  if (!SPEED_REVIEWS_PUBLIC_ENABLED) {
    notFound();
  }

  return (
    <div className="min-h-dvh overflow-y-auto">
      <Suspense fallback={null}>
        <SpeedReviewsClient />
      </Suspense>
    </div>
  );
}
